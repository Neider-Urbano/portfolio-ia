import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { runChatTurn } from "@/lib/llm";
import { Profile, ChatLog, AnalyticsEvent } from "@portafolio/models";

export const runtime = "nodejs"; // necesita el SDK de Anthropic y el cliente MCP (no Edge)
export const maxDuration = 60; // el MCP server puede tardar en despertar (cold start) + turnos de Gemini

const bodySchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional()
    .default([]),
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
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Payload inválido" }), {
      status: 400,
    });
  }

  const { sessionId, message, history } = parsed.data;
  await connectDB();

  const systemPrompt = await buildSystemPrompt();
  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
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

        for await (const event of runChatTurn({ messages, systemPrompt })) {
          if (event.type === "status") {
            send({ type: "status", message: event.message });
          } else if (event.type === "tool_result") {
            send({ type: "tool_result", tool: event.tool, data: event.data });
          } else {
            finalText = event.text;
            toolsUsed = event.toolsUsed;
            send({ type: "final", text: event.text });
          }
        }

        await Promise.all([
          ChatLog.create({
            sessionId,
            question: message,
            answer: finalText,
            toolsUsed,
            latencyMs: Date.now() - startedAt,
          }),
          AnalyticsEvent.create({
            type: "chat_question",
            sessionId,
            metadata: { toolsUsed },
          }),
        ]);
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
