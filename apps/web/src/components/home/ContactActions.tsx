"use client";

import { useEffect, useState } from "react";
import { ContactForm } from "./ContactForm";

/**
 * Botones de contacto directo (email / WhatsApp). Iconos dibujados en la
 * misma gramática geométrica de un solo trazo que el resto del sistema —
 * sin el verde de marca de WhatsApp, para no introducir un segundo acento
 * saturado (ver DESIGN.md, "Don't introduce a second saturated accent").
 * El botón de email abre el ContactForm en un modal en vez de un mailto:
 * (que saca al visitante del sitio hacia su cliente de correo) — WhatsApp
 * sigue siendo un wa.me directo a propósito.
 */
function waLink(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

interface ContactActionsProps {
  email?: string;
  phone?: string;
}

export function ContactActions({ email, phone }: ContactActionsProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!email && !phone) return null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {email && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group flex items-center gap-2.5 rounded-sm border border-line px-4 py-2.5 text-sm text-ink-muted transition-colors hover:border-signal hover:text-signal"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
              <path d="M1.5 2.5h13a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm.5 1.8v7.7h12V4.3L8 8.9 2 4.3Zm.66-.8L8 7.5l4.84-3H3.16Z" />
            </svg>
            {email}
          </button>
        )}
        {phone && (
          <a
            href={waLink(phone)}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2.5 rounded-sm border border-line px-4 py-2.5 text-sm text-ink-muted transition-colors hover:border-signal hover:text-signal"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
              <path d="M8 0a8 8 0 0 0-6.9 12.02L0 16l4.1-1.07A8 8 0 1 0 8 0Zm0 1.5a6.5 6.5 0 0 1 5.5 9.96l-.2.33.46 1.7-1.75-.46-.32.19A6.5 6.5 0 1 1 8 1.5Zm-2.6 3.1c-.15 0-.4.06-.6.28-.21.22-.8.78-.8 1.9s.82 2.2.94 2.36c.11.15 1.6 2.55 3.98 3.44 1.97.73 2.37.59 2.8.55.42-.04 1.36-.55 1.55-1.09.19-.53.19-.99.13-1.09-.06-.1-.21-.15-.44-.27-.23-.11-1.36-.67-1.57-.75-.21-.08-.36-.11-.51.11-.15.23-.59.75-.72.9-.13.15-.27.17-.5.06-.23-.11-.96-.35-1.83-1.13-.68-.6-1.13-1.35-1.27-1.58-.13-.23-.01-.35.1-.47.11-.11.23-.27.35-.4.11-.14.15-.23.23-.38.08-.15.04-.29-.02-.4-.06-.11-.5-1.24-.7-1.69-.18-.44-.37-.38-.51-.38h-.44Z" />
            </svg>
            WhatsApp — {phone}
          </a>
        )}
      </div>

      {open && (
        <div
          className="message-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Enviar un mensaje"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-sm border border-line-strong bg-panel-raised p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-signal">Escribime</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="text-ink-faint transition-colors hover:text-signal"
              >
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M3 3l10 10M13 3 3 13" />
                </svg>
              </button>
            </div>
            <ContactForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
