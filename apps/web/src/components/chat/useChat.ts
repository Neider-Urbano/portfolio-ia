"use client";

import { useCallback, useRef, useState } from "react";
import { getSessionId } from "@/lib/session";
import { resolveCommand, helpText } from "@/lib/chat-commands";

export interface ChatImage {
  url: string;
  caption?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  images?: ChatImage[];
}

/**
 * Extrae imágenes mostrables de un resultado de tool crudo. Cubre las dos
 * formas que hoy pueden traer imágenes: get_gallery ({ items: [...] }) y
 * get_projects en modo detalle ({ project: { images: [...] } }).
 * Deliberadamente no intenta cubrir cualquier forma futura de tool — solo
 * las que hoy pueden traer fotos reales.
 */
function extractImages(tool: string, data: unknown): ChatImage[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;

  if (tool === "get_gallery" && Array.isArray(record.items)) {
    return record.items
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => ({
        url: String(item.imageUrl ?? ""),
        caption: (item.title as string) ?? (item.caption as string) ?? undefined,
      }))
      .filter((img) => img.url);
  }

  if (tool === "get_projects" && record.project && typeof record.project === "object") {
    const project = record.project as Record<string, unknown>;
    if (Array.isArray(project.images)) {
      return project.images
        .filter((url): url is string => typeof url === "string" && url.length > 0)
        .map((url) => ({ url, caption: project.title as string | undefined }));
    }
  }

  return [];
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string>();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // Comandos "/": /help se resuelve localmente, el resto se traduce a
      // una pregunta natural y sigue el flujo normal de LLM + tools MCP.
      if (trimmed.startsWith("/")) {
        const command = resolveCommand(trimmed);
        if (!command) {
          setMessages((prev) => [
            ...prev,
            { role: "user", content: trimmed },
            { role: "assistant", content: `Comando no reconocido. ${helpText()}` },
          ]);
          return;
        }
        if (command.name === "/help") {
          setMessages((prev) => [
            ...prev,
            { role: "user", content: trimmed },
            { role: "assistant", content: helpText() },
          ]);
          return;
        }
        text = command.prompt;
      }

      if (!sessionIdRef.current) sessionIdRef.current = getSessionId();

      const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setIsLoading(true);
      setStatus("Pensando...");

      const pendingImages: ChatImage[] = [];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionIdRef.current, message: text, history }),
        });

        if (!res.body) throw new Error("Sin respuesta del servidor");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk.replace(/^data:\s*/, "");
            if (!line) continue;
            const event = JSON.parse(line);

            if (event.type === "status") {
              setStatus(event.message);
            } else if (event.type === "tool_result") {
              // dedup por url: si el backend cambió de Gemini a Groq a mitad
              // de turno, la misma tool puede haberse ejecutado dos veces.
              const seen = new Set(pendingImages.map((img) => img.url));
              for (const img of extractImages(event.tool, event.data)) {
                if (!seen.has(img.url)) {
                  pendingImages.push(img);
                  seen.add(img.url);
                }
              }
            } else if (event.type === "final") {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: event.text, images: pendingImages.slice(0, 8) },
              ]);
              setStatus(null);
            } else if (event.type === "error") {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Ocurrió un error, intenta de nuevo." },
              ]);
              setStatus(null);
            }
          }
        }
      } finally {
        setIsLoading(false);
        setStatus(null);
      }
    },
    [messages, isLoading]
  );

  return { messages, status, isLoading, sendMessage };
}
