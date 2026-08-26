/**
 * Comandos "/" del chat: atajos que se traducen a una pregunta en lenguaje
 * natural y siguen el mismo camino que cualquier mensaje normal (LLM +
 * tools MCP), para no duplicar formato de respuesta ni extracción de
 * imágenes. /help es la única excepción: se resuelve en el cliente sin
 * llamar al backend.
 */
export interface ChatCommand {
  name: string;
  description: string;
  prompt: string;
}

export const CHAT_COMMANDS: ChatCommand[] = [
  { name: "/projects", description: "Ver los proyectos", prompt: "Muéstrame todos tus proyectos." },
  { name: "/experience", description: "Ver experiencia laboral", prompt: "Cuéntame tu experiencia laboral completa." },
  { name: "/education", description: "Ver estudios y certificaciones", prompt: "Cuéntame tus estudios y certificaciones." },
  { name: "/skills", description: "Ver habilidades técnicas", prompt: "¿Cuáles son tus habilidades técnicas?" },
  { name: "/gallery", description: "Ver galería de fotos", prompt: "Muéstrame tu galería de fotos." },
  { name: "/references", description: "Ver referencias", prompt: "¿Qué referencias tienes?" },
  { name: "/stats", description: "Ver el portafolio en números", prompt: "Dame las estadísticas de tu portafolio en números." },
  { name: "/help", description: "Ver los comandos disponibles", prompt: "" },
];

export function resolveCommand(input: string): ChatCommand | undefined {
  const name = input.trim().split(/\s+/)[0]?.toLowerCase();
  return CHAT_COMMANDS.find((c) => c.name === name);
}

export function helpText(): string {
  const lines = CHAT_COMMANDS.filter((c) => c.name !== "/help").map((c) => `- \`${c.name}\` — ${c.description}`);
  return ["Comandos disponibles:", ...lines, "- `/help` — ver esta lista"].join("\n");
}
