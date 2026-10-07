import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { runChatTurn } from "@/lib/llm";
import { loadChatHistory } from "@/lib/chat-history";
import { requireAdmin } from "@/lib/require-admin";
import { Profile, ChatLog, AnalyticsEvent } from "@portafolio/models";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs"; // necesita el SDK de Anthropic y el cliente MCP (no Edge)
export const maxDuration = 60; // el MCP server puede tardar en despertar (cold start) + turnos de Gemini

const bodySchema = z.object({
  sessionId: z.string().min(1).max(128),
  message: z.string().min(1).max(2000),
  // Dos chats, dos canales: el público del sitio y el copiloto privado del
  // dueño (/admin/copiloto). El historial se reconstruye server-side
  // (loadChatHistory) filtrando por sessionId + channel — deliberadamente NO
  // se acepta `history` del cliente: cualquiera podría fabricar turnos de
  // asistente y meter texto falso en el contexto del modelo.
  channel: z.enum(["public", "private"]).default("public"),
});

async function buildSystemPrompt(): Promise<string> {
  const profile = await Profile.findOne().lean();

  const persona =
    profile?.aiPersona ??
    "Responde en primera persona, en español, con tono profesional y cercano.";

  return [
    `Eres el asistente de IA personal de ${profile?.fullName ?? "el dueño de este portafolio"}.`,
    `${persona}`,
    "Reglas estrictas:",
    "- SOLO puedes afirmar datos que hayas obtenido llamando a las tools disponibles (get_profile_info, get_experience, get_education, get_projects, get_skills, get_gallery, get_references, get_services, get_portfolio_stats, get_blogs).",
    "- Si la información solicitada no aparece en los resultados de las tools, dilo honestamente en vez de inventar datos.",
    "- Sé conciso y conversacional; evita listar JSON crudo, redacta la respuesta en lenguaje natural.",
    "- Si te preguntan por fotos, imágenes o la galería, usa get_gallery de todas formas para poder mostrarlas, aunque tu respuesta en texto sea breve — el visitante verá las imágenes reales junto a tu mensaje.",
    "- No tienes capacidad de generar ni crear imágenes, PDFs, CVs, documentos ni ningún archivo — no existe ninguna tool para eso. Si te piden generar o crear algo así, dilo honestamente en vez de simular que lo hiciste, y ofrece la alternativa real disponible (por ejemplo, la galería de fotos existente vía get_gallery, o contactar directamente al dueño).",
    "- Si preguntan algo fuera de este perfil profesional, redirige amablemente la conversación.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  // Cada mensaje dispara llamadas a APIs de IA de pago (Gemini/Groq/OpenRouter)
  // — sin límite, alguien podría hacer un loop y generarte una factura.
  const { allowed, retryAfterSeconds } = checkRateLimit(`chat:${getClientIp(req)}`, {
    limit: 15,
    windowMs: 60_000,
  });
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Estás mandando mensajes muy rápido, esperá un momento." }), {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Payload inválido" }), {
      status: 400,
    });
  }

  const { sessionId, message, channel } = parsed.data;

  // El canal privado es solo para el dueño. /api/chat NO está bajo el matcher
  // del middleware (lo usa el chat público), así que el gate vive acá: sin
  // sesión de admin, el canal "private" ni se procesa ni se lee su historial.
  if (channel === "private" && !(await requireAdmin())) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 403 });
  }

  await connectDB();

  const systemPrompt = await buildSystemPrompt();
  const history = await loadChatHistory(sessionId, channel);
  const messages = [
    ...history,
    { role: "user" as const, content: message },
  ];

  const encoder = new TextEncoder();
  const startedAt = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        let finalText = "";
        let toolsUsed: string[] = [];
        let provider: string | undefined;
        let model: string | undefined;
        let usage: { inputTokens: number; outputTokens: number } | undefined;

        for await (const event of runChatTurn({ messages, systemPrompt })) {
          if (event.type === "status") {
            send({ type: "status", message: event.message });
          } else if (event.type === "tool_result") {
            send({ type: "tool_result", tool: event.tool, data: event.data });
          } else if (event.type === "delta") {
            // Fragmento del texto final en streaming: se reenvía tal cual para
            // que el frontend lo vaya pintando en vivo.
            send({ type: "delta", text: event.text });
          } else if (event.type === "delta_reset") {
            // Se cambió de proveedor a mitad de la respuesta: el frontend
            // descarta lo parcial y empieza de nuevo con el nuevo intento.
            send({ type: "delta_reset" });
          } else {
            finalText = event.text;
            toolsUsed = event.toolsUsed;
            provider = event.provider;
            model = event.model;
            usage = event.usage;
            // Un final vacío (algún proveedor devolvió contenido vacío, p.ej.
            // tras un 503 en cadena) no se pinta: abajo se trata como falla
            // y se manda un error honesto — así no queda una burbuja vacía
            // ni se persiste una respuesta en blanco en ChatLog.
            if (event.text.trim()) send({ type: "final", text: event.text });
          }
        }

        if (!finalText.trim()) {
          send({
            type: "error",
            message: "No pude generar una respuesta, intenta de nuevo en unos segundos.",
          });
        } else {
          // La respuesta ya se le envió al usuario: si la persistencia falla
          // (DB caída, validación), se loguea acá en vez de mandarle un error
          // crudo por un problema que no es suyo.
          try {
            await Promise.all([
              ChatLog.create({
                sessionId,
                channel,
                question: message,
                answer: finalText,
                toolsUsed,
                latencyMs: Date.now() - startedAt,
                // Trazabilidad: qué proveedor/modelo respondió y cuántos tokens
                // costó — sin esto no hay forma de ver en producción que la
                // cadena de fallback se disparó ni de medir el gasto.
                provider,
                llmModel: model,
                inputTokens: usage?.inputTokens,
                outputTokens: usage?.outputTokens,
              }),
              AnalyticsEvent.create({
                type: "chat_question",
                sessionId,
                metadata: { toolsUsed, provider, llmModel: model, channel },
              }),
            ]);
          } catch (persistErr) {
            console.error("[chat] no se pudo persistir el turno:", persistErr);
          }
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Error interno",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
