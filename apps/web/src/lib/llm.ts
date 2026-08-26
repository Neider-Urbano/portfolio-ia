import { GoogleGenAI, type Content, type FunctionDeclaration, type Part } from "@google/genai";
import { listMcpTools, callMcpTool } from "./mcp-client";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
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
};

function statusLabel(toolName: string): string {
  return STATUS_LABELS[toolName] ?? `Ejecutando ${toolName}...`;
}

/**
 * El JSON Schema que produce el MCP SDK (vía zod-to-json-schema) trae claves
 * como "$schema" o "additionalProperties" que la API de Gemini no reconoce y
 * rechaza. Nos quedamos solo con las claves que Gemini sí soporta.
 */
type JsonSchema = Record<string, unknown>;

function sanitizeSchemaForGemini(schema: JsonSchema): JsonSchema {
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
        sanitizeSchemaForGemini(value),
      ])
    );
  }
  if (schema.items) clean.items = sanitizeSchemaForGemini(schema.items as JsonSchema);
  if (Array.isArray(schema.required) && schema.required.length > 0) clean.required = schema.required;

  if (!clean.type) clean.type = "object";
  if (clean.type === "object" && !clean.properties) clean.properties = {};

  return clean;
}

/**
 * Bucle agente: se listan las tools MCP disponibles, se registran como
 * functionDeclarations, y si el modelo responde con functionCalls se
 * ejecutan contra el mcp-server y se le devuelve el resultado, hasta
 * obtener texto final. El SDK envuelve las functionResponse parts en un
 * Content de rol "user" automáticamente (la API ya no acepta rol "function").
 */
export async function* runChatTurn(params: {
  messages: ChatTurnMessage[];
  systemPrompt: string;
}): AsyncGenerator<ChatEvent> {
  const mcpTools = await listMcpTools();

  const functionDeclarations: FunctionDeclaration[] = mcpTools.map((t) => ({
    name: t.name,
    description: t.description ?? "",
    parametersJsonSchema: sanitizeSchemaForGemini(t.inputSchema as JsonSchema),
  }));

  if (params.messages.length === 0) {
    yield { type: "final", text: "", toolsUsed: [] };
    return;
  }

  const history: Content[] = params.messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  const lastMessage = params.messages[params.messages.length - 1];

  const chat = ai.chats.create({
    model: MODEL,
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

      let resultObject: unknown;
      try {
        const resultText = await callMcpTool(name, (call.args ?? {}) as Record<string, unknown>);
        resultObject = JSON.parse(resultText);
        // Se reenvía al frontend además de al modelo: permite que el chat
        // muestre imágenes reales (galería, detalle de proyecto) en vez de
        // solo la descripción en texto que redacta el LLM.
        yield { type: "tool_result", tool: name, data: resultObject };
      } catch (err) {
        resultObject = { error: err instanceof Error ? err.message : "Error ejecutando tool" };
      }

      functionResponseParts.push({
        functionResponse: { name, response: { result: resultObject } },
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
