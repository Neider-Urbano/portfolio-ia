"use client";

import { useChat } from "./useChat";
import { Markdown } from "./Markdown";
import { Orb } from "@/components/voice/Orb";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { useCallback, useEffect, useRef, useState } from "react";

const quickPrompts = [
  "¿Cómo responderías: cuéntame sobre ti?",
  "¿Por qué debería contratarte?",
  "Simula una entrevista técnica",
];

export function CareerCopilot() {
  // Canal "private": el servidor exige sesión de admin y reconstruye el
  // historial aparte del chat público (misma sessionId, otro channel).
  const { messages, status, isLoading, sendMessage } = useChat("private");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);
  const handleTranscript = useCallback((text: string) => {
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
  } = useVoiceRecorder(handleTranscript);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="copilot-shell">
      <header className="copilot-header">
        <div className="copilot-heading">
          <Orb size={34} />
          <div>
            <p className="copilot-eyebrow">Herramienta privada</p>
            <h1>Copiloto de postulaciones</h1>
            <p>Preguntas de vacantes, respuestas que suenan a ti.</p>
          </div>
        </div>
        <span className="copilot-lock">⌑ Solo tú</span>
      </header>
      <div ref={scrollRef} className="copilot-scroll">
        {messages.length === 0 && (
          <div className="copilot-welcome">
            <span className="copilot-spark">✦</span>
            <h2>¿Qué te preguntaron?</h2>
            <p>
              Copia una pregunta de la vacante y te ayudo a construir una
              respuesta basada en tu perfil, experiencia y proyectos.
            </p>
            <div className="copilot-prompts">
              {quickPrompts.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                  <span>↗</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`copilot-message ${m.role === "user" ? "user" : "assistant"}`}
          >
            {m.role === "assistant" && <Orb size={25} />}
            <div>
              <small>{m.role === "user" ? "Tú" : "Nexo"}</small>
              <div className="copilot-bubble">
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
          <div className="copilot-message assistant">
            <Orb size={25} />
            <div>
              <small>Nexo</small>
              <div className="copilot-bubble copilot-typing">
                <span />
                <span />
                <span />
                {status}
              </div>
            </div>
          </div>
        )}
      </div>
      {error && <p className="copilot-error">{error}</p>}
      <form className="copilot-composer" onSubmit={submit}>
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
                  : "Pega aquí la pregunta de la vacante..."
          }
          disabled={isLoading || transcribing || starting}
          rows={2}
        />
        <div className="copilot-actions">
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
        <small>Usa Shift + Enter para escribir en varias líneas.</small>
      </form>
    </div>
  );
}
