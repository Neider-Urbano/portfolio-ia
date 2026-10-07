import {
  type Part,
  GoogleGenAI,
  type Content,
  type FunctionCall,
  type FunctionDeclaration,
} from "@google/genai";
import type {
  ChatCompletionTool,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import OpenAI, { APIUserAbortError } from "openai";
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
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;
// "openai/gpt-oss-120b" es el modelo gratuito con mejor calidad que hoy da
// Groq (y con soporte de tools, lo único que le pedimos en este rol de
// tercer respaldo). El slug anterior, "llama-3.3-70b-versatile", salió del
// free tier de Groq el 16/08/2026 (verificado contra /v1/models con la key
// del proyecto: ni aparece), así que el último eslabón de la cadena devolvía
// "404 The model does not exist or you do not have access" y el chat caía en
// el mensaje de error final. Alternativas gratuitas vía env var si hiciera
// falta: "qwen/qwen3.8-27b" o "openai/gpt-oss-20b".
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

// Timeout por llamada al modelo: si un proveedor se cuelga (no tira error,
// solo deja de responder), AbortSignal lo aborta y ese intento cae al
// siguiente de la cadena en vez de comerse los 60s del maxDuration de la
// ruta entera. Cubre cada llamada al modelo por separado (una ronda de
// herramientas puede tardar lo suyo en total, pero una request no se cuelga).
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 20_000);

const MAX_AGENT_TURNS = 6;

export interface ChatTurnMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatEvent =
  | { type: "status"; message: string; tool: string }
  | { type: "tool_result"; tool: string; data: unknown }
  // Fragmento del texto final, tal como lo va emitiendo el modelo: se
  // reenvía al frontend para pintarlo en vivo en vez de esperar a tener la
  // respuesta completa (el `final` de cierre igual manda el texto entero).
  | { type: "delta"; text: string }
  // Descartá el texto parcial emitido hasta ahora: se emite cuando un
  // proveedor falla a mitad de la respuesta y el siguiente reintenta desde
  // cero (el frontend tira lo parcial para no duplicar texto).
  | { type: "delta_reset" }
  // Trazabilidad: provider/modelo/usage solo los completa el intento que
  // respondió (runChatTurn los agrega al finalizar) — es lo que ChatLog
  // persiste para poder auditar costos y detectar fallbacks en producción.
  | {
      type: "final";
      text: string;
      toolsUsed: string[];
      provider?: string;
      model?: string;
      usage?: { inputTokens: number; outputTokens: number };
    };

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
  if (!schema || typeof schema !== "object")
    return { type: "object", properties: {} };

  const clean: JsonSchema = {};
  if (schema.type) clean.type = schema.type;
  if (schema.description) clean.description = schema.description;
  if (schema.enum) clean.enum = schema.enum;
  if (schema.format) clean.format = schema.format;

  if (schema.properties && typeof schema.properties === "object") {
    clean.properties = Object.fromEntries(
      Object.entries(schema.properties as Record<string, JsonSchema>).map(
        ([key, value]) => [key, sanitizeSchema(value)],
      ),
    );
  }
  if (schema.items) clean.items = sanitizeSchema(schema.items as JsonSchema);
  if (Array.isArray(schema.required) && schema.required.length > 0)
    clean.required = schema.required;

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
// real es que el modelo ni siquiera sepa que la tool existe. Todas las
// demás acá son tools de ESCRITURA (crean contenido en la base: blogs,
// proyectos, skills, experiencia, estudios, referencias, servicios) —
// pensadas para que el propio dueño se las pida a un cliente MCP personal
// (Claude, n8n), nunca para que un visitante cree contenido con solo
// pedírselo al chat público. CUALQUIER tool nueva que escriba en la base
// tiene que sumarse acá también — no es opcional.
const PUBLIC_CHAT_EXCLUDED_TOOLS = new Set([
  "get_full_profile",
  "create_blog",
  "create_project",
  "create_skill",
  "create_experience",
  "create_education",
  "create_reference",
  "create_service",
]);

export async function* runChatTurn(
  params: TurnParams,
): AsyncGenerator<ChatEvent> {
  const mcpTools = (await listMcpTools()).filter(
    (t) => !PUBLIC_CHAT_EXCLUDED_TOOLS.has(t.name),
  );

  if (params.messages.length === 0) {
    yield { type: "final", text: "", toolsUsed: [] };
    return;
  }

  const fallbacks: { name: string; client: OpenAI | null; model: string }[] = [
    { name: "OpenRouter", client: openrouter, model: OPENROUTER_MODEL },
    { name: "Groq", client: groq, model: GROQ_MODEL },
  ];

  try {
    yield* withProvider(
      runGeminiTurn(params, mcpTools),
      "Gemini",
      GEMINI_MODEL,
    );
    return;
  } catch (err) {
    console.error(`[llm] Gemini falló${timeoutHint(err)}:`, err);
  }

  for (const fallback of fallbacks) {
    if (!fallback.client) continue;
    // El intento anterior pudo dejar deltas a mitad de camino en el stream;
    // se avisa al frontend que los descarte antes de reintentar con otro
    // proveedor, que arma la respuesta desde cero.
    yield { type: "delta_reset" };
    try {
      yield* withProvider(
        runOpenAiCompatibleTurn(
          fallback.client,
          fallback.model,
          params,
          mcpTools,
        ),
        fallback.name,
        fallback.model,
      );
      return;
    } catch (err) {
      console.error(
        `[llm] ${fallback.name} (respaldo) también falló${timeoutHint(err)}:`,
        err,
      );
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
async function* runGeminiTurn(
  params: TurnParams,
  mcpTools: McpToolInfo[],
): AsyncGenerator<ChatEvent> {
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

  // La config por-request del SDK no hereda la del chat (ver SendMessageParameters
  // en @google/genai), así que se guarda aparte y se copia en cada llamada —
  // es donde se engancha el abortSignal del timeout.
  const baseConfig = {
    systemInstruction: params.systemPrompt,
    tools:
      functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
  };
  const chat = gemini.chats.create({
    model: GEMINI_MODEL,
    history,
    config: baseConfig,
  });

  const toolsUsed: string[] = [];
  let pending: string | Part[] = lastMessage.content;
  let inputTokens = 0;
  let outputTokens = 0;

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    // Streaming: en vez de esperar la respuesta completa, cada chunk que
    // llega del SDK se reenvía al frontend como evento `delta`, así el texto
    // va apareciendo mientras el modelo lo escribe. `chunk.text` del SDK
    // trae solo el texto de ese chunk (no el acumulado), o sea que ya es un
    // delta directo; si el chunk trae functionCalls se acumulan para el
    // mismo manejo de tools de siempre.
    const stream = await chat.sendMessageStream({
      message: pending,
      config: {
        ...baseConfig,
        abortSignal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      },
    });
    const functionCalls: FunctionCall[] = [];
    let streamed = "";
    let roundInput = 0;
    let roundOutput = 0;

    for await (const chunk of stream) {
      const calls = chunk.functionCalls;
      if (calls && calls.length > 0) functionCalls.push(...calls);
      const piece = chunk.text;
      if (piece) {
        streamed += piece;
        yield { type: "delta", text: piece };
      }
      // La metadata de uso del ÚLTIMO chunk que la trae resume la request
      // completa de esta ronda — sumarla por chunk duplicaría contadores.
      if (chunk.usageMetadata) {
        roundInput = chunk.usageMetadata.promptTokenCount ?? 0;
        roundOutput =
          (chunk.usageMetadata.candidatesTokenCount ?? 0) +
          (chunk.usageMetadata.thoughtsTokenCount ?? 0);
      }
    }
    inputTokens += roundInput;
    outputTokens += roundOutput;

    if (functionCalls.length === 0) {
      // Contenido vacío sin tools = respuesta rota del proveedor (hoy pasa
      // con Gemini bajo demanda). Se trata como falla para que la cadena de
      // fallback siga con el siguiente proveedor en vez de entregar un final
      // vacío — si TODOS fallan, runChatTurn cierra con el mensaje honesto.
      if (!streamed.trim()) {
        throw new Error(`${GEMINI_MODEL} devolvió una respuesta vacía`);
      }
      yield {
        type: "final",
        text: streamed,
        toolsUsed,
        usage: { inputTokens, outputTokens },
      };
      return;
    }

    // El modelo no debería mezclar texto final con tool calls en la misma
    // respuesta, pero si ocurriera el parcial ya emitido no es la respuesta
    // definitiva: se descarta antes de seguir con el siguiente turno.
    if (streamed) yield { type: "delta_reset" };

    const functionResponseParts: Part[] = [];
    for (const call of functionCalls) {
      const name = call.name ?? "";
      toolsUsed.push(name);
      yield { type: "status", message: statusLabel(name), tool: name };

      const result = await runTool(
        name,
        (call.args ?? {}) as Record<string, unknown>,
      );
      // Se reenvía al frontend además de al modelo: permite que el chat
      // muestre imágenes reales (galería, detalle de proyecto) en vez de
      // solo la descripción en texto que redacta el LLM.
      if (result.publish)
        yield { type: "tool_result", tool: name, data: result.value };

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
  mcpTools: McpToolInfo[],
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
      }),
    ),
  ];

  const toolsUsed: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    // Streaming: mismo esquema que el bucle de Gemini — el texto sale en
    // eventos `delta` y los tool_calls, que en streaming llegan partidos por
    // chunk (id / nombre / argumentos en fragmentos), se re-acumulan por
    // index para armar el mismo objeto que devolvía la llamada síncrona.
    const stream = await client.chat.completions.create(
      {
        model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        stream: true,
        // Sin esto el stream no trae el resumen de tokens en el último chunk
        // (es el dato que alimenta la trazabilidad de ChatLog).
        stream_options: { include_usage: true },
      },
      { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) },
    );

    const pendingCalls = new Map<
      number,
      { id: string; name: string; args: string }
    >();
    let streamed = "";
    let roundInput = 0;
    let roundOutput = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const piece = delta?.content;
      if (piece) {
        streamed += piece;
        yield { type: "delta", text: piece };
      }
      // El chunk de uso viene solo al final de la ronda (include_usage).
      if (chunk.usage) {
        roundInput = chunk.usage.prompt_tokens;
        roundOutput = chunk.usage.completion_tokens;
      }
      for (const tc of delta?.tool_calls ?? []) {
        // Igual que antes: solo nos interesan las tools de tipo "function"
        // (las únicas que registramos en `tools` arriba).
        if (tc.type && tc.type !== "function") continue;
        const acc = pendingCalls.get(tc.index) ?? {
          id: "",
          name: "",
          args: "",
        };
        if (tc.id) acc.id = tc.id;
        if (tc.function?.name) acc.name += tc.function.name;
        if (tc.function?.arguments) acc.args += tc.function.arguments;
        pendingCalls.set(tc.index, acc);
      }
    }

    inputTokens += roundInput;
    outputTokens += roundOutput;

    const toolCalls = [...pendingCalls.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, acc], i) => ({
        id: acc.id || `call_${i}`,
        type: "function" as const,
        function: { name: acc.name, arguments: acc.args || "{}" },
      }));

    if (toolCalls.length === 0) {
      // Mismo criterio que en el bucle de Gemini: una respuesta vacía es un
      // fallo del proveedor, no una respuesta — throw para que el siguiente
      // respaldo de la cadena tome el turno.
      if (!streamed.trim()) {
        throw new Error(`${model} devolvió una respuesta vacía`);
      }
      yield {
        type: "final",
        text: streamed,
        toolsUsed,
        usage: { inputTokens, outputTokens },
      };
      return;
    }

    // Igual que en el bucle de Gemini: si llegó texto junto con tool calls,
    // el parcial emitido no es la respuesta final y se descarta.
    if (streamed) yield { type: "delta_reset" };

    messages.push({
      role: "assistant",
      content: streamed || null,
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
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
      if (result.publish)
        yield { type: "tool_result", tool: name, data: result.value };
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result.value),
      });
    }
  }

  yield {
    type: "final",
    text: "No pude completar la respuesta en este momento, ¿puedes reformular tu pregunta?",
    toolsUsed,
  };
}

/**
 * Envuelve el intento de un proveedor para etiquetar su evento `final` con el
 * proveedor/modelo que lo sirvió. Es la trazabilidad que después persiste la
 * ruta /api/chat en ChatLog: sin esto, en producción no hay forma de saber
 * que la cadena de fallback se estaba disparando (ni qué modelo respondió).
 */
async function* withProvider(
  gen: AsyncGenerator<ChatEvent>,
  provider: string,
  model: string,
): AsyncGenerator<ChatEvent> {
  for await (const event of gen) {
    yield event.type === "final" ? { ...event, provider, model } : event;
  }
}

/** Deja claro en el log cuando un fallo fue en realidad un timeout. */
function timeoutHint(err: unknown): string {
  if (!(err instanceof Error)) return "";
  // TimeoutError/AbortError vienen del AbortSignal de Gemini. El abort del
  // SDK de OpenAI es APIUserAbortError: su .name es "Error" (solo Node lo
  // imprime con el nombre de la clase), así que se comprueba con instanceof
  // — el único signal que le pasamos es el del timeout, así que la etiqueta
  // es correcta.
  const esAbort =
    err.name === "TimeoutError" ||
    err.name === "AbortError" ||
    err instanceof APIUserAbortError;
  return esAbort
    ? ` (timeout de ${LLM_TIMEOUT_MS}ms: se abortó la llamada al modelo)`
    : "";
}

/**
 * Ejecuta una tool MCP y devuelve tanto el resultado (para el modelo) como
 * si debe reenviarse al frontend (`publish`: solo cuando la tool respondió
 * bien — un error de tool se le informa al modelo para que lo explique, pero
 * no tiene datos reales que mostrarle al visitante). Compartido entre los
 * tres proveedores para no duplicar el manejo de errores de tools.
 */
async function runTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ value: unknown; publish: boolean }> {
  try {
    const resultText = await callMcpTool(name, args);
    return { value: JSON.parse(resultText), publish: true };
  } catch (err) {
    return {
      value: {
        error: err instanceof Error ? err.message : "Error ejecutando tool",
      },
      publish: false,
    };
  }
}
