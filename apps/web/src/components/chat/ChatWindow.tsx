"use client";

import { useChat } from "./useChat";
import { Markdown } from "./Markdown";
import { Orb } from "@/components/voice/Orb";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { useCallback, useEffect, useRef, useState } from "react";

export function ChatWindow() {
  // Canal "public" (default): historial server-side separado del copiloto privado.
  const { messages, status, isLoading, sendMessage } = useChat("public");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);
  const transcript = useCallback((text: string) => {
    setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);
  const {
    recording,
    starting,
    transcribing,
    levels,
    error,
    supported,
    start,
    stop,
  } = useVoiceRecorder(transcript);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  };
  return (
    <div className="flex h-[600px] w-full flex-col rounded-sm border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <Orb size={22} /> Asistente IA
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
          <span className="led-dot h-1.5 w-1.5 rounded-full bg-signal" /> En
          vivo
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-ink-faint">
            Pregúntame sobre mi experiencia, proyectos, estudios, habilidades o
            servicios. Respondo con datos reales de mi perfil.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`message-in flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && <Orb size={22} />}
            <div className="flex max-w-[80%] flex-col gap-1.5">
              <div
                className={`rounded-sm px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-signal text-on-accent" : "border border-line bg-console text-ink"}`}
              >
                {m.role === "assistant" ? (
                  <Markdown text={m.content} />
                ) : (
                  m.content
                )}
              </div>
              {m.images && m.images.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {m.images.map((img, idx) => (
                    <a
                      key={img.url + idx}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square overflow-hidden rounded-sm border border-line"
                    >
                      <img
                        src={img.url}
                        alt={img.caption ?? "Imagen del portafolio"}
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {status && (
          <div className="flex items-center gap-2">
            <Orb size={22} />
            <div className="rounded-sm border border-line bg-console px-3.5 py-2.5 text-xs text-ink-faint">
              ••• {status}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="border-t border-line bg-fault/10 px-4 py-2 text-xs text-fault">
          {error}
        </p>
      )}
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 border-t border-line p-3"
      >
        {(starting || recording || transcribing) && (
          <p
            className="voice-status"
            role="status"
            data-state={
              starting ? "starting" : recording ? "recording" : "transcribing"
            }
          >
            {recording ? (
              <>
                <span className="voice-status-dot" />
                <span className="voice-status-label">Grabando…</span>
                <span className="voice-status-meter">
                  {levels.map((l, i) => (
                    <i
                      key={i}
                      style={{ height: `${Math.max(18, l * 100)}%` }}
                    />
                  ))}
                </span>
                <span className="voice-status-hint">
                  Toca el micrófono para detener
                </span>
              </>
            ) : (
              <>
                <span className="voice-status-spinner" />
                <span className="voice-status-label">
                  {starting ? "Solicitando micrófono…" : "Transcribiendo…"}
                </span>
              </>
            )}
          </p>
        )}
        <div className="flex items-center gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder={
              starting
                ? "Solicitando micrófono…"
                : recording
                  ? "Escuchando…"
                  : transcribing
                    ? "Transcribiendo…"
                    : "Pregúntame sobre mi perfil..."
            }
            disabled={isLoading || transcribing || starting}
            rows={1}
            className="flex-1 resize-none rounded-full border border-line bg-console px-4 py-2.5 text-sm text-ink outline-none focus:border-signal"
          />
          {supported && (
            <button
              type="button"
              onClick={() => (recording ? stop() : start())}
              disabled={starting || transcribing}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${recording ? "border-signal bg-signal text-on-accent voice-recording" : "border-line text-ink-faint"}`}
              aria-label={
                recording ? "Detener grabación" : "Grabar pregunta por voz"
              }
              title={
                recording ? "Detener y transcribir" : "Grabar pregunta por voz"
              }
            >
              {recording ? (
                <span className="flex h-4 items-end gap-px">
                  {levels.map((l, i) => (
                    <i
                      key={i}
                      className="w-0.5 bg-current"
                      style={{ height: `${Math.max(18, l * 100)}%` }}
                    />
                  ))}
                </span>
              ) : (
                "◉"
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Enviar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal text-on-accent disabled:opacity-40"
          >
            ↗
          </button>
        </div>
      </form>
    </div>
  );
}
