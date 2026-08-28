"use client";

import { useCallback } from "react";
import { getSessionId } from "@/lib/session";

/**
 * "Descargable" sin depender de un generador de PDF en el servidor: dispara
 * el diálogo de impresión nativo del navegador sobre la versión print-only
 * de /cv (ver los estilos `print:` en esa página) — el visitante elige
 * "Guardar como PDF" y obtiene un archivo real, sin librerías extra ni
 * funciones serverless pesadas.
 */
export function DownloadButton() {
  const handleClick = useCallback(() => {
    const sessionId = getSessionId();
    if (sessionId) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "resume_download", sessionId, path: "/cv" }),
      }).catch(() => {});
    }
    window.print();
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-sm font-bold text-on-accent transition-transform hover:-translate-y-0.5"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12m0 0-4-4m4 4 4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      Descargar CV
    </button>
  );
}
