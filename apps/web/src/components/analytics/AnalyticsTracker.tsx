"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getSessionId } from "@/lib/session";

/**
 * Registra un evento "page_view" por cada navegación en la vista pública.
 * Se excluyen las rutas /admin/* para que "visitas totales" refleje tráfico
 * de terceros, no las propias visitas del dueño gestionando su contenido.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page_view", sessionId, path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
