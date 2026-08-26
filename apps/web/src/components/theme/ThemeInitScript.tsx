const INIT_SCRIPT = `
try {
  var stored = localStorage.getItem("theme");
  var theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
} catch (e) {}
`;

/**
 * Aplica el tema (localStorage, o si no hay preferencia guardada,
 * prefers-color-scheme) ANTES del primer pintado, para evitar el flash de
 * "day ops" seguido de un salto a "night ops" al cargar.
 */
export function ThemeInitScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />;
}
