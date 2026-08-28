"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

/**
 * Interruptor de tema claro/oscuro. El valor real ya lo aplicó el script
 * inline en <head> (ver ThemeInitScript) antes del primer pintado, así que
 * este componente solo lee ese estado en el cliente y lo persiste.
 */
export function ThemeToggle() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme | null>(null);

  if (pathname.startsWith("/cv")) return null;

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // localStorage puede fallar (modo privado, cuotas); el toggle sigue
      // funcionando en memoria para esta sesión.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      suppressHydrationWarning
      aria-label={theme === "dark" ? "Cambiar a modo día" : "Cambiar a modo noche"}
      className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-signal hover:text-signal"
    >
      <span
        suppressHydrationWarning
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${theme === "dark" ? "bg-signal" : "bg-ink-faint"}`}
      />
      <span suppressHydrationWarning>{theme === "dark" ? "Oscuro" : "Claro"}</span>
    </button>
  );
}
