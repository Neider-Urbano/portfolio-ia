"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "./useChat";
import { Markdown } from "./Markdown";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { Orb } from "@/components/voice/Orb";

const quickPrompts = ["¿Cómo responderías: cuéntame sobre ti?", "¿Por qué debería contratarte?", "Simula una entrevista técnica"];

export function CareerCopilot() {
  const { messages, status, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, status]);
  const handleTranscript = useCallback((text: string) => sendMessage(text), [sendMessage]);
  const { recording, transcribing, levels, error, supported, start, stop } = useVoiceRecorder(handleTranscript);
  const submit = (e: React.FormEvent) => { e.preventDefault(); const text = input.trim(); if (!text) return; setInput(""); sendMessage(text); };

  return <div className="copilot-shell"><header className="copilot-header"><div className="copilot-heading"><Orb size={34} /><div><p className="copilot-eyebrow">Herramienta privada</p><h1>Copiloto de postulaciones</h1><p>Preguntas de vacantes, respuestas que suenan a ti.</p></div></div><span className="copilot-lock">⌑ Solo tú</span></header><div ref={scrollRef} className="copilot-scroll">
    {messages.length === 0 && <div className="copilot-welcome"><span className="copilot-spark">✦</span><h2>¿Qué te preguntaron?</h2><p>Copia una pregunta de la vacante y te ayudo a construir una respuesta basada en tu perfil, experiencia y proyectos.</p><div className="copilot-prompts">{quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => sendMessage(prompt)}>{prompt}<span>↗</span></button>)}</div></div>}
    {messages.map((m, i) => <div key={i} className={`copilot-message ${m.role === "user" ? "user" : "assistant"}`}>{m.role === "assistant" && <Orb size={25} />}<div><small>{m.role === "user" ? "Tú" : "Nexo"}</small><div className="copilot-bubble">{m.role === "assistant" ? <Markdown text={m.content} /> : m.content}</div></div></div>)}
    {status && <div className="copilot-message assistant"><Orb size={25} /><div><small>Nexo</small><div className="copilot-bubble copilot-typing"><span /><span /><span />{status}</div></div></div>}
  </div>{error && <p className="copilot-error">{error}</p>}<form className="copilot-composer" onSubmit={submit}><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }} placeholder={recording ? "Escuchando..." : transcribing ? "Transcribiendo..." : "Pega aquí la pregunta de la vacante..."} disabled={isLoading || transcribing} rows={2} /><div className="copilot-actions">{supported && <button type="button" onClick={() => recording ? stop() : start()} className={recording ? "recording" : ""} aria-label="Hablar">{recording ? levels.map((l, i) => <i key={i} style={{ height: `${Math.max(20, l * 100)}%` }} />) : "◉"}</button>}<button type="submit" disabled={isLoading || !input.trim()} aria-label="Enviar">↗</button></div><small>Usa Shift + Enter para escribir en varias líneas.</small></form></div>;
}
