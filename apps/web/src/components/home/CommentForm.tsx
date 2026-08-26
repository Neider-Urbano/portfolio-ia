"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";

const inputClass =
  "w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal";

/**
 * Formulario público para dejar un comentario. Queda pendiente de revisión
 * (isApproved=false) hasta que el dueño lo publique desde /admin/comentarios
 * — ver apps/web/src/app/api/comments/route.ts.
 */
export function CommentForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: debe quedar vacío
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, website }),
      });

      if (!res.ok) throw new Error();

      toast.success("Gracias, tu comentario será revisado antes de publicarse.");
      setName("");
      setMessage("");
    } catch {
      toast.error("No se pudo enviar tu comentario, intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border border-line bg-panel p-4">
      <p className="text-sm font-bold text-ink">Dejar un comentario</p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        required
        maxLength={80}
        className={inputClass}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tu comentario"
        required
        maxLength={500}
        rows={3}
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
        {sending ? "Enviando…" : "Enviar comentario"}
      </button>
    </form>
  );
}
