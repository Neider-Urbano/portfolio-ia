import { GoogleGenAI, type Content, type FunctionDeclaration, type Part } from "@google/genai";
import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { listMcpTools, callMcpTool } from "./mcp-client";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

// Los dos respaldos son compatibles con la API de OpenAI (mismo formato de
// mensajes/tools), así que comparten una sola función de bucle-agente
// (runOpenAiCompatibleTurn) en vez de duplicar la lógica por proveedor.
// Ambos son opcionales: sin su API key, el proveedor queda deshabilitado y
// la cadena simplemente lo salta — no rompe nada para quien no las cargó.
// Orden de la cadena: Gemini → OpenRouter → Groq (ver `fallbacks` en
// runChatTurn, que es lo que realmente decide el orden de intento).
const openrouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        "X-Title": "Portafolio Interactivo con IA",
      },
    })
  : null;
// "openrouter/free" es el router gratuito propio de OpenRouter: elige entre
// los modelos gratis con soporte de tools disponibles en cada momento, en
// vez de fijar un slug puntual que puede dejar de ser gratis sin aviso
// (como pasó con el modelo que estaba antes acá).
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "openrouter/free";

const groq = process.env.GROQ_API_KEY
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" })
  : null;
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const MAX_AGENT_TURNS = 6;

export interface ChatTurnMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatEvent =
  | { type: "status"; message: string; tool: string }
  | { type: "tool_result"; tool: string; data: unknown }
  | { type: "final"; text: string; toolsUsed: string[] };

const STATUS_LABELS: Record<string, string> = {
  get_profile_info: "Consultando el perfil...",
  get_experience: "Buscando en la experiencia laboral...",
  get_education: "Revisando estudios y certificaciones...",
  get_projects: "Buscando en los proyectos...",
  get_skills: "Consultando habilidades técnicas...",
  get_gallery: "Buscando en la galería...",
  get_references: "Consultando referencias...",
  get_services: "Consultando servicios...",
  get_portfolio_stats: "Calculando estadísticas del portafolio...",
  get_blogs: "Revisando artículos guardados...",
};

function statusLabel(toolName: string): string {
  return STATUS_LABELS[toolName] ?? `Ejecutando ${toolName}...`;
}

/**
 * El JSON Schema que produce el MCP SDK (vía zod-to-json-schema) trae claves
 * como "$schema" o "additionalProperties" que Gemini no reconoce y rechaza.
 * Nos quedamos solo con las claves que sí soporta — este subconjunto también
 * es válido para el formato de tools de OpenAI/Groq/OpenRouter, así que se
 * reutiliza para los tres proveedores en vez de mantener sanitizadores
 * separados.
 */
type JsonSchema = Record<string, unknown>;

function sanitizeSchema(schema: JsonSchema): JsonSchema {
  if (!schema || typeof schema !== "object") return { type: "object", properties: {} };

  const clean: JsonSchema = {};
  if (schema.type) clean.type = schema.type;
  if (schema.description) clean.description = schema.description;
  if (schema.enum) clean.enum = schema.enum;
  if (schema.format) clean.format = schema.format;

  if (schema.properties && typeof schema.properties === "object") {
    clean.properties = Object.fromEntries(
      Object.entries(schema.properties as Record<string, JsonSchema>).map(([key, value]) => [
        key,
        sanitizeSchema(value),
      ])
    );
  }
  if (schema.items) clean.items = sanitizeSchema(schema.items as JsonSchema);
  if (Array.isArray(schema.required) && schema.required.length > 0) clean.required = schema.required;

  if (!clean.type) clean.type = "object";
  if (clean.type === "object" && !clean.properties) clean.properties = {};

  return clean;
}

interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema: unknown;
}

interface TurnParams {
  messages: ChatTurnMessage[];
  systemPrompt: string;
}

/**
 * Punto de entrada único que usa la API route. Cadena de respaldo, en orden:
 * Gemini → OpenRouter → Groq. Cada salto ocurre solo si el anterior tira una
 * excepción (cuota agotada, error 5xx, timeout, lo que sea) y el siguiente
 * proveedor tiene su API key configurada; si no hay ninguno disponible más
 * que el que falló, se devuelve un mensaje honesto en vez de romper el
 * stream. Los tres emiten exactamente los mismos eventos (status/tool_result
 * /final), así que el visitante nunca nota en qué proveedor respondió — ni
 * en el contenido ni en la forma de la respuesta, porque los tres siguen
 * usando las mismas tools MCP contra los mismos datos reales.
 */
// Tools que el mcp-server expone pero que el chat público del sitio NUNCA
// debe poder llamar — quedan reservadas para integraciones externas de uso
// personal del dueño (Claude conectado como MCP remoto, n8n), que hablan
// directo con el mcp-server sin pasar por acá. get_full_profile incluye
// preferencias privadas (estado civil, estrato, salario esperado, etc. —
// ver getFullProfileTool en apps/mcp-server); si se la mandáramos al LLM
// como función disponible, un visitante podría lograr que la llame con solo
// pedírselo, sin importar lo que diga el system prompt — la única barrera
// real es que el modelo ni siquiera sepa que la tool existe. create_blog es
// la única tool de ESCRITURA del servidor (la usa una automatización de
// n8n para registrar artículos) — un visitante jamás debe poder crear
// contenido en la base con solo pedírselo al chat.
const PUBLIC_CHAT_EXCLUDED_TOOLS = new Set(["get_full_profile", "create_blog"]);

export async function* runChatTurn(params: TurnParams): AsyncGenerator<ChatEvent> {
  const mcpTools = (await listMcpTools()).filter((t) => !PUBLIC_CHAT_EXCLUDED_TOOLS.has(t.name));

  if (params.messages.length === 0) {
    yield { type: "final", text: "", toolsUsed: [] };
    return;
  }

  const fallbacks: { name: string; client: OpenAI | null; model: string }[] = [
    { name: "OpenRouter", client: openrouter, model: OPENROUTER_MODEL },
    { name: "Groq", client: groq, model: GROQ_MODEL },
  ];

  try {
    yield* runGeminiTurn(params, mcpTools);
    return;
  } catch (err) {
    console.error("[llm] Gemini falló:", err);
  }

  for (const fallback of fallbacks) {
    if (!fallback.client) continue;
    try {
      yield* runOpenAiCompatibleTurn(fallback.client, fallback.model, params, mcpTools);
      return;
    } catch (err) {
      console.error(`[llm] ${fallback.name} (respaldo) también falló:`, err);
    }
  }

  yield {
    type: "final",
    text: "Estoy teniendo problemas para responder en este momento — intenta de nuevo en unos segundos.",
    toolsUsed: [],
  };
}

/**
 * Bucle agente con Gemini: se listan las tools MCP disponibles, se registran
 * como functionDeclarations, y si el modelo responde con functionCalls se
 * ejecutan contra el mcp-server y se le devuelve el resultado, hasta obtener
 * texto final. El SDK envuelve las functionResponse parts en un Content de
 * rol "user" automáticamente (la API ya no acepta rol "function").
 */
async function* runGeminiTurn(params: TurnParams, mcpTools: McpToolInfo[]): AsyncGenerator<ChatEvent> {
  const functionDeclarations: FunctionDeclaration[] = mcpTools.map((t) => ({
    name: t.name,
    description: t.description ?? "",
    parametersJsonSchema: sanitizeSchema(t.inputSchema as JsonSchema),
  }));

  const history: Content[] = params.messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  const lastMessage = params.messages[params.messages.length - 1];

  const chat = gemini.chats.create({
    model: GEMINI_MODEL,
    history,
    config: {
      systemInstruction: params.systemPrompt,
      tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
    },
  });

  const toolsUsed: string[] = [];
  let pending: string | Part[] = lastMessage.content;

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    const response = await chat.sendMessage({ message: pending });
    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      yield { type: "final", text: response.text ?? "", toolsUsed };
      return;
    }

    const functionResponseParts: Part[] = [];
    for (const call of functionCalls) {
      const name = call.name ?? "";
      toolsUsed.push(name);
      yield { type: "status", message: statusLabel(name), tool: name };

      const result = await runTool(name, (call.args ?? {}) as Record<string, unknown>);
      // Se reenvía al frontend además de al modelo: permite que el chat
      // muestre imágenes reales (galería, detalle de proyecto) en vez de
      // solo la descripción en texto que redacta el LLM.
      if (result.publish) yield { type: "tool_result", tool: name, data: result.value };

      functionResponseParts.push({
        functionResponse: { name, response: { result: result.value } },
      });
    }

    pending = functionResponseParts;
  }

  yield {
    type: "final",
    text: "No pude completar la respuesta en este momento, ¿puedes reformular tu pregunta?",
    toolsUsed,
  };
}

/**
 * Mismo bucle agente contra cualquier API compatible con OpenAI (Groq,
 * OpenRouter, y cualquier otro respaldo que se agregue después) — mensajes
 * con rol "tool" en vez de functionResponse. Se usa solo cuando Gemini (y,
 * en el caso de OpenRouter, también Groq) fallan. Mismo contrato ChatEvent
 * de salida que runGeminiTurn.
 */
async function* runOpenAiCompatibleTurn(
  client: OpenAI,
  model: string,
  params: TurnParams,
  mcpTools: McpToolInfo[]
): AsyncGenerator<ChatEvent> {
  const tools: ChatCompletionTool[] = mcpTools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: sanitizeSchema(t.inputSchema as JsonSchema),
    },
  }));

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: params.systemPrompt },
    ...params.messages.map(
      (m): ChatCompletionMessageParam => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })
    ),
  ];

  const toolsUsed: string[] = [];

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    const completion = await client.chat.completions.create({
      model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
    });

    const choice = completion.choices[0]?.message;
    const toolCalls = choice?.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      yield { type: "final", text: choice?.content ?? "", toolsUsed };
      return;
    }

    messages.push({ role: "assistant", content: choice.content ?? null, tool_calls: toolCalls });

    for (const call of toolCalls) {
      // Solo registramos tools de tipo "function" (ver `tools` arriba), así
      // que un tool_call "custom" no debería ocurrir nunca en la práctica —
      // se filtra igual porque el SDK ahora tipa ambos como una unión.
      if (call.type !== "function") continue;
      const name = call.function.name;
      toolsUsed.push(name);
      yield { type: "status", message: statusLabel(name), tool: name };

      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }

      const result = await runTool(name, args);
      if (result.publish) yield { type: "tool_result", tool: name, data: result.value };
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result.value) });
    }
  }

  yield {
    type: "final",
    text: "No pude completar la respuesta en este momento, ¿puedes reformular tu pregunta?",
    toolsUsed,
  };
}

/**
 * Ejecuta una tool MCP y devuelve tanto el resultado (para el modelo) como
 * si debe reenviarse al frontend (`publish`: solo cuando la tool respondió
 * bien — un error de tool se le informa al modelo para que lo explique, pero
 * no tiene datos reales que mostrarle al visitante). Compartido entre los
 * tres proveedores para no duplicar el manejo de errores de tools.
 */
async function runTool(name: string, args: Record<string, unknown>): Promise<{ value: unknown; publish: boolean }> {
  try {
    const resultText = await callMcpTool(name, args);
    return { value: JSON.parse(resultText), publish: true };
  } catch (err) {
    return { value: { error: err instanceof Error ? err.message : "Error ejecutando tool" }, publish: false };
  }
}
