"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";

const STORAGE_KEY = "welcomed";

interface WelcomeModalProps {
  fullName?: string;
  headline?: string;
}

/**
 * Se muestra una sola vez por navegador (localStorage) en la primera visita.
 * El confetti usa el lila de marca + el coral del orbe (ver DESIGN.md), sin
 * sumar un tercer acento.
 */
export function WelcomeModal({ fullName, headline }: WelcomeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    setOpen(true);
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.35 },
      colors: ["#8b5cf6", "#ff9166", "#f1eef7"],
      disableForReducedMotion: true,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage puede fallar en modo privado — no bloquea el cierre.
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bienvenida"
        onClick={(e) => e.stopPropagation()}
        className="message-in w-full max-w-md rounded-sm border border-line-strong bg-panel-raised p-6"
      >
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-signal">
          <span className="led-dot h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
          Bienvenido
        </div>

        <h2 className="font-mono text-xl font-extrabold text-ink">{fullName ?? "Hola, bienvenido"}</h2>
        {headline && <p className="mt-1.5 text-sm text-ink-muted">{headline}</p>}
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Este portafolio incluye un asistente de IA que responde con datos reales sobre mi experiencia,
          proyectos y habilidades — pregúntale lo que quieras saber.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/chat"
            onClick={close}
            className="rounded-full bg-signal px-4 py-2 text-sm font-bold text-on-accent transition-transform hover:-translate-y-0.5"
          >
            Hablar con mi IA
          </Link>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:border-signal hover:text-signal"
          >
            Explorar el portafolio
          </button>
        </div>
      </div>
    </div>
  );
}
