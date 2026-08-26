import type { Config } from "tailwindcss";

// Sistema de tokens de la dirección "Modo Voz": el portafolio se siente como
// abrir un asistente de IA — un único acento lila para todo lo interactivo/
// en vivo, un coral cálido reservado para el brillo del orbe, tipografía
// Urbanist para títulos/UI + Nunito Sans para prosa. Todos los valores de
// color viven en globals.css como variables CSS (:root / [data-theme]), para
// que "día" y "noche" compartan una sola fuente de verdad sin duplicar la
// paleta aquí. Las claves de color se conservan desde direcciones anteriores
// a propósito: el resto del sitio (admin, detalle de proyecto) las consume
// sin cambios y hereda la nueva paleta automáticamente. `borderRadius.sm`
// apunta a --radius-card en vez de un valor fijo: es lo que retarget-ea de
// golpe cada `rounded-sm` del sitio (44 usos) de esquina casi recta a
// esquina suave, sin tocar componente por componente.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        console: "var(--bg-hall)",
        panel: "var(--bg-board)",
        "panel-raised": "var(--bg-board-raised)",
        line: "var(--rule)",
        "line-strong": "var(--rule-strong)",
        ink: "var(--text-primary)",
        "ink-muted": "var(--text-secondary)",
        "ink-faint": "var(--text-muted)",
        signal: "var(--amber)",
        "signal-soft": "var(--amber-soft)",
        fault: "var(--fault-red)",
        copper: "var(--copper)",
        "copper-soft": "var(--copper-soft)",
        "on-accent": "var(--on-accent)",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--radius-card)",
      },
    },
  },
  plugins: [],
};

export default config;
