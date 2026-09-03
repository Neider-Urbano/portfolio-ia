"use client";

import { getSessionId } from "@/lib/session";
import { toDriveDirectDownloadUrl } from "@/lib/drive";

/**
 * El "Ver CV" que ve un visitante normal abre directo el link que el dueño
 * cargó en /admin/documentos (kind:"hoja_vida", isPublic:true) — no la
 * versión HTML generada en /cv, que es una herramienta para uso del propio
 * dueño (ver /admin/perfil). Si hay más de una hoja de vida (ej. ES/EN), la
 * home renderiza un ResumeLink por cada una con su propio label.
 */
export function ResumeLink({ href, label = "Ver CV" }: { href: string; label?: string }) {
  const handleClick = () => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "resume_download", sessionId, path: "/" }),
    }).catch(() => {});
  };

  return (
    <a
      href={toDriveDirectDownloadUrl(href)}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:border-signal hover:text-signal"
    >
      {label}
    </a>
  );
}
