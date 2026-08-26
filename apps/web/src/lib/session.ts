/**
 * Id de sesión de visitante, persistido en localStorage. Se comparte entre
 * el tracker de analíticas (page_view) y el chat (ChatLog/chat_question),
 * para poder correlacionar qué preguntó un visitante durante su recorrido.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const key = "portafolio_session_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}
