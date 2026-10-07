import { ChatLog, type ChatChannel } from "@portafolio/models";

/**
 * Historial server-side de una conversación de /api/chat.
 *
 * Antes el cliente mandaba los últimos mensajes en el body: cualquiera podía
 * fabricar turnos con role:"assistant" y meter texto falso en el contexto del
 * modelo. Ahora el historial se reconstruye acá desde los ChatLog ya
 * persistidos, usando la sessionId como única credencial (UUID en
 * localStorage, no adivinable).
 *
 * Ojo con los dos chats: el público (/chat) y el copiloto privado del dueño
 * (/admin/copiloto) comparten sessionId porque usan el mismo localStorage.
 * Por eso la consulta filtra SIEMPRE por sessionId + channel — el historial
 * del copiloto nunca se cuela en el chat público ni viceversa.
 */
const HISTORY_TURNS = 10; // turnos (pregunta+respuesta) que viajan al contexto
const ANSWER_MAX_CHARS = 2000; // tope por respuesta vieja para no inflar el prompt

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function loadChatHistory(
  sessionId: string,
  channel: ChatChannel,
): Promise<HistoryMessage[]> {
  // Los ChatLog anteriores a la existencia del campo no tienen channel:
  // pertenecen al chat público (el único que existía), así que se tratan como "public".
  const filter =
    channel === "public"
      ? { sessionId, $or: [{ channel: "public" }, { channel: { $exists: false } }] }
      : { sessionId, channel: "private" };

  const docs = await ChatLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(HISTORY_TURNS)
    .lean();

  const history: HistoryMessage[] = [];
  // .reverse() → orden cronológico: el contexto debe ir del turno más viejo al más nuevo.
  for (const doc of docs.reverse()) {
    // Un turno sin respuesta (error a mitad del camino) no aporta contexto y
    // dejaría dos mensajes de usuario seguidos: se salta entero.
    if (!doc.answer?.trim()) continue;
    history.push(
      { role: "user", content: doc.question },
      { role: "assistant", content: truncate(doc.answer) },
    );
  }
  return history;
}

function truncate(text: string): string {
  return text.length > ANSWER_MAX_CHARS ? `${text.slice(0, ANSWER_MAX_CHARS)}…` : text;
}
