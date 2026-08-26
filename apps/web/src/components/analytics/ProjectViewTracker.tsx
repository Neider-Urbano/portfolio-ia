"use client";

import { useEffect } from "react";
import { getSessionId } from "@/lib/session";

/**
 * Se monta en la página de detalle de un proyecto y dispara un evento
 * "project_view" con el slug — es lo que hace que Project.viewCount y
 * "proyectos más vistos" en el dashboard admin reflejen tráfico real, y no
 * las exploraciones especulativas del chat (que deliberadamente NO
 * incrementan viewCount, ver apps/mcp-server/src/tools/getProjects.ts).
 */
export function ProjectViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "project_view", sessionId, projectSlug: slug }),
    }).catch(() => {});
  }, [slug]);

  return null;
}
