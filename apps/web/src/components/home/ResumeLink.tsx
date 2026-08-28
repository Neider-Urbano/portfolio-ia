"use client";

import { getSessionId } from "@/lib/session";

/**
 * El "Ver CV" que ve un visitante normal abre directo el archivo que el
 * dueño pegó en Profile.resumeUrl (no la versión HTML generada en /cv, que
 * es una herramienta para uso del propio dueño — ver /admin/perfil).
 */
export function ResumeLink({ href }: { href: string }) {
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
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:border-signal hover:text-signal"
    >
      Ver CV
    </a>
  );
}
