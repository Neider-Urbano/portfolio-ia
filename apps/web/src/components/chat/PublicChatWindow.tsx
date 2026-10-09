"use client";

import { useChat } from "./useChat";
import { Markdown } from "./Markdown";
import { Orb } from "@/components/voice/Orb";
import { CHAT_COMMANDS } from "@/lib/chat-commands";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { useCallback, useEffect, useRef, useState } from "react";

const prompts = [
  "¿Qué experiencia tiene?",
  "¿Qué proyectos ha construido?",
  "¿Qué tecnologías domina?",
];
const commandPrompts = CHAT_COMMANDS.filter((command) =>
  ["/help", "/skills", "/projects", "/experience"].includes(command.name),
);

export function PublicChatWindow() {
  const { messages, status, isLoading, sendMessage } = useChat();
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
    <div className="public-chat-shell">
      <header className="public-chat-header">
        <div className="public-chat-title">
          <Orb size={34} />
          <div>
            <span>Asistente del portafolio</span>
            <h1>Conoce mi trabajo</h1>
          </div>
        </div>
        <span className="public-chat-status">
          <i /> disponible
        </span>
      </header>
      <div ref={scrollRef} className="public-chat-scroll">
        {messages.length === 0 && (
          <div className="public-chat-welcome">
            <p className="public-chat-kicker">Pregúntame lo que quieras</p>
            <h2>
              La información está
              <br />
              <em>en el sistema.</em>
            </h2>
            <p>
              Respondo usando datos reales del perfil: experiencia, proyectos,
              estudios y habilidades.
            </p>
            <div>
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                  <span>↗</span>
                </button>
              ))}
            </div>
            <div className="public-chat-commands">
              <p>También puedes escribir comandos</p>
              {commandPrompts.map((command) => (
                <button
                  key={command.name}
                  type="button"
                  onClick={() => sendMessage(command.name)}
                >
                  {command.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`public-chat-message ${m.role}`}>
            {m.role === "assistant" && <Orb size={25} />}
            <div>
              <small>{m.role === "user" ? "Tú" : "Asistente"}</small>
              <div className="public-chat-bubble">
                {m.role === "assistant" ? (
                  <Markdown text={m.content} />
                ) : (
                  m.content
                )}
              </div>
            </div>
          </div>
        ))}
        {status && (
          <div className="public-chat-message assistant">
            <Orb size={25} />
            <div>
              <small>Asistente</small>
              <div className="public-chat-bubble public-typing">
                <span /> <span /> <span /> {status}
              </div>
            </div>
          </div>
        )}
      </div>
      {error && <p className="public-chat-error">{error}</p>}
      <form className="public-chat-composer" onSubmit={submit}>
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
                  : "Pregunta o escribe /help /skills..."
          }
          disabled={isLoading || transcribing || starting}
          rows={1}
        />{" "}
        <div>
          {supported && (
            <button
              type="button"
              onClick={() => (recording ? stop() : start())}
              disabled={starting || transcribing}
              className={recording ? "recording voice-recording" : ""}
              aria-label={
                recording ? "Detener grabación" : "Grabar pregunta por voz"
              }
              title={
                recording ? "Detener y transcribir" : "Grabar pregunta por voz"
              }
            >
              {recording
                ? levels.map((l, i) => (
                    <i
                      key={i}
                      style={{ height: `${Math.max(18, l * 100)}%` }}
                    />
                  ))
                : "◉"}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Enviar"
          >
            ↗
          </button>
        </div>
        <small>
          Información pública del portafolio · comandos: /help, /skills · Shift
          + Enter para varias líneas.
        </small>
      </form>
    </div>
  );
}
