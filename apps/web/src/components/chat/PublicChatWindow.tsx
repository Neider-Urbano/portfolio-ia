"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "./useChat";
import { Markdown } from "./Markdown";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { Orb } from "@/components/voice/Orb";
import { CHAT_COMMANDS } from "@/lib/chat-commands";

const prompts = ["¿Qué experiencia tiene?", "¿Qué proyectos ha construido?", "¿Qué tecnologías domina?"];
const commandPrompts = CHAT_COMMANDS.filter((command) => ["/help", "/skills", "/projects", "/experience"].includes(command.name));

export function PublicChatWindow() {
  const { messages, status, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, status]);
  const transcript = useCallback((text: string) => sendMessage(text), [sendMessage]);
  const { recording, transcribing, levels, error, supported, start, stop } = useVoiceRecorder(transcript);
  const submit = (e: React.FormEvent) => { e.preventDefault(); const text = input.trim(); if (!text) return; setInput(""); sendMessage(text); };
  return <div className="public-chat-shell"><header className="public-chat-header"><div className="public-chat-title"><Orb size={34} /><div><span>Asistente del portafolio</span><h1>Conoce mi trabajo</h1></div></div><span className="public-chat-status"><i /> disponible</span></header><div ref={scrollRef} className="public-chat-scroll">{messages.length === 0 && <div className="public-chat-welcome"><p className="public-chat-kicker">Pregúntame lo que quieras</p><h2>La información está<br /><em>en el sistema.</em></h2><p>Respondo usando datos reales del perfil: experiencia, proyectos, estudios y habilidades.</p><div>{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>{prompt}<span>↗</span></button>)}</div><div className="public-chat-commands"><p>También puedes escribir comandos</p>{commandPrompts.map((command) => <button key={command.name} type="button" onClick={() => sendMessage(command.name)}>{command.name}</button>)}</div></div>}{messages.map((m, i) => <div key={i} className={`public-chat-message ${m.role}`}>{m.role === "assistant" && <Orb size={25} />}<div><small>{m.role === "user" ? "Tú" : "Asistente"}</small><div className="public-chat-bubble">{m.role === "assistant" ? <Markdown text={m.content} /> : m.content}</div></div></div>)}{status && <div className="public-chat-message assistant"><Orb size={25} /><div><small>Asistente</small><div className="public-chat-bubble public-typing"><span /> <span /> <span /> {status}</div></div></div>}</div>{error && <p className="public-chat-error">{error}</p>}<form className="public-chat-composer" onSubmit={submit}><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }} placeholder={recording ? "Escuchando..." : transcribing ? "Transcribiendo..." : "Pregunta o escribe /help /skills..."} disabled={isLoading || transcribing} rows={1} /> <div>{supported && <button type="button" onClick={() => recording ? stop() : start()} className={recording ? "recording" : ""} aria-label="Hablar">{recording ? levels.map((l, i) => <i key={i} style={{ height: `${Math.max(20, l * 100)}%` }} />) : "◉"}</button>}<button type="submit" disabled={isLoading || !input.trim()} aria-label="Enviar">↗</button></div><small>Información pública del portafolio · comandos: /help, /skills · Shift + Enter para varias líneas.</small></form></div>;
}
