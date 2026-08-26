"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Lee en voz alta el nombre, titular y bio del perfil usando la Web Speech
 * API nativa del navegador (sin dependencias). Se oculta si el navegador no
 * soporta síntesis de voz (p. ej. Firefox en algunas plataformas).
 */
export function SpeakIntro({
  name,
  headline,
  bio,
}: {
  name?: string;
  headline?: string;
  bio?: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (!supported) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const text = [name, headline, bio].filter(Boolean).join(". ");
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [speaking, supported, name, headline, bio]);

  if (!supported) return null;

  return (
    <button type="button" onClick={handleToggle} aria-pressed={speaking}>
      <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-ink-faint">
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            speaking
              ? "led-dot animate-pulse bg-signal"
              : "border border-ink-faint"
          }`}
        />
        {speaking ? "Detener audio" : "Escuchar presentación"}
      </span>
    </button>
  );
}
