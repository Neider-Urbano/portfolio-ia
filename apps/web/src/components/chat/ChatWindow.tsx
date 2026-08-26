"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "./useChat";
import { Markdown } from "./Markdown";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { Orb } from "@/components/voice/Orb";
import { CHAT_COMMANDS } from "@/lib/chat-commands";

export function ChatWindow() {
  const { messages, status, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const handleTranscript = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const {
    recording,
    transcribing,
    levels: micLevels,
    error: micError,
    supported: micSupported,
    start,
    stop,
  } = useVoiceRecorder(handleTranscript);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="flex h-[600px] w-full flex-col rounded-sm border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <Orb size={22} />
          Asistente IA
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
          <span className="led-dot h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
          En vivo
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-ink-faint">
            Pregúntame sobre mi experiencia, proyectos, estudios, habilidades o mi galería de fotos — respondo con
            datos reales de mi perfil. Escribe <code className="text-signal">/help</code> para ver los comandos
            rápidos.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`message-in flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <Orb size={22} />}
            <div className="flex max-w-[80%] flex-col gap-1.5">
              <div
                className={`rounded-sm px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-signal text-on-accent" : "border border-line bg-console text-ink"
                }`}
              >
                {m.role === "assistant" ? <Markdown text={m.content} /> : m.content}
              </div>

              {m.images && m.images.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                  {m.images.map((img, idx) => (
                    <a
                      key={img.url + idx}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square overflow-hidden rounded-sm border border-line"
                      title={img.caption}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.caption ?? "Imagen del portafolio"}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
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
            <div className="flex items-center gap-2 rounded-sm border border-line bg-console px-3.5 py-2.5 text-xs text-ink-faint">
              <span className="flex items-center gap-0.5" aria-hidden>
                <span className="typing-dot led-dot h-1.5 w-1.5 rounded-full bg-signal" style={{ animationDelay: "0ms" }} />
                <span className="typing-dot led-dot h-1.5 w-1.5 rounded-full bg-signal" style={{ animationDelay: "150ms" }} />
                <span className="typing-dot led-dot h-1.5 w-1.5 rounded-full bg-signal" style={{ animationDelay: "300ms" }} />
              </span>
              {status}
            </div>
          </div>
        )}
      </div>

      {micError && <p className="border-t border-line bg-fault/10 px-4 py-2 text-xs text-fault">{micError}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            recording ? "Escuchando..." : transcribing ? "Transcribiendo..." : "Escribe tu pregunta o un comando /"
          }
          list="chat-commands"
          disabled={isLoading || transcribing}
          className="flex-1 rounded-full border border-line bg-console px-4 py-2.5 text-sm text-ink outline-none focus:border-signal"
        />
        <datalist id="chat-commands">
          {CHAT_COMMANDS.map((c) => (
            <option key={c.name} value={c.name}>
              {c.description}
            </option>
          ))}
        </datalist>
        {micSupported && (
          <button
            type="button"
            onClick={() => (recording ? stop() : start())}
            disabled={isLoading || transcribing}
            aria-pressed={recording}
            title={recording ? "Detener y enviar" : "Hablar"}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40 ${
              recording ? "border-signal bg-signal text-on-accent" : "border-line text-ink-faint hover:border-signal hover:text-signal"
            }`}
          >
            {recording ? <VoiceLevelMeter levels={micLevels} /> : <MicIcon />}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Enviar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal text-on-accent transition-transform hover:-translate-y-0.5 disabled:opacity-40"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

/**
 * Ecualizador de 5 barras que refleja el volumen del micrófono en vivo
 * mientras se dicta — la señal visual de "te estoy escuchando", separada
 * del ícono estático del botón.
 */
function VoiceLevelMeter({ levels }: { levels: number[] }) {
  return (
    <span className="flex h-4 w-4 items-end justify-center gap-[1px]" aria-hidden>
      {levels.map((lvl, i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-on-accent transition-[height] duration-75 ease-out"
          style={{ height: `${Math.max(15, Math.min(100, lvl * 100))}%` }}
        />
      ))}
    </span>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l16-8-6 16-3-7-7-1Z" />
    </svg>
  );
}
