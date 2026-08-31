"use client";

import posthog from "posthog-js";

let initialized = false;

/**
 * Inicializa PostHog una sola vez, del lado del cliente. Si no hay
 * NEXT_PUBLIC_POSTHOG_KEY configurada (dev local, o mientras el dueño
 * todavía no creó su cuenta de PostHog), queda como no-op silencioso — no
 * rompe nada, simplemente no manda datos.
 *
 * Elegido explícitamente "solo analytics": disable_session_recording=true,
 * nada de grabar pantallas de visitantes reales. capture_pageview=false
 * porque en el App Router de Next un cambio de ruta no es una carga de
 * página nueva — el pageview se manda a mano desde PostHogPageView.tsx.
 */
export function initPostHog() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    disable_session_recording: true,
    autocapture: true,
  });
  initialized = true;
}

export { posthog };
