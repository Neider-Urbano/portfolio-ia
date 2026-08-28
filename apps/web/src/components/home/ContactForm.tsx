"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { getSessionId } from "@/lib/session";

const inputClass =
  "w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal";

/**
 * Formulario de contacto: envía un email real al dueño (con replyTo al
 * visitante) y, si está configurado, una notificación de Telegram — ver
 * apps/web/src/app/api/contact/route.ts. Vive dentro del modal que abre el
 * botón de email en ContactActions (en vez de un mailto: que saca al
 * visitante del sitio hacia su cliente de correo).
 */
export function ContactForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: debe quedar vacío
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const sessionId = getSessionId();
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website, sessionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Error");
      }

      toast.success("¡Mensaje enviado! Te voy a responder pronto.");
      setName("");
      setEmail("");
      setMessage("");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error && err.message !== "Error" ? err.message : "No se pudo enviar tu mensaje, intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          required
          maxLength={100}
          className={inputClass}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu email"
          required
          maxLength={200}
          className={inputClass}
        />
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Contame en qué puedo ayudarte"
        required
        maxLength={2000}
        rows={4}
        className={inputClass}
      />

      {/* Honeypot: invisible para personas, los bots de formularios sí lo rellenan. */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <button
        type="submit"
        disabled={sending}
        className="rounded-full bg-signal px-4 py-2 text-sm font-bold text-on-accent transition-transform hover:-translate-y-0.5 disabled:opacity-40"
      >
        {sending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
