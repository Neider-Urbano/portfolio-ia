"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initPostHog, posthog } from "@/lib/posthog-client";

/**
 * Mismo criterio que AnalyticsTracker.tsx (nuestro tracker propio en Mongo):
 * se excluyen las rutas /admin/* para que la analítica de PostHog también
 * refleje tráfico de visitantes, no la propia navegación del dueño en el
 * dashboard.
 */
export function PostHogPageView() {
  const pathname = usePathname();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);

  return null;
}
