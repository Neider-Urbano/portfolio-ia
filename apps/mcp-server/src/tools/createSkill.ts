import { z } from "zod";
import { Skill } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  name: z.string().min(1).describe("Nombre de la habilidad (ej. 'TypeScript')."),
  category: z
    .enum(["language", "framework", "tool", "database", "soft-skill", "other"])
    .optional()
    .describe("Categoría. Por defecto 'other'."),
  proficiency: z.number().min(1).max(100).optional().describe("Nivel de dominio, 1-100. Por defecto 50."),
  yearsOfExperience: z.number().optional().describe("Años de experiencia con esta habilidad."),
  iconUrl: z.string().optional().describe("URL de un ícono para mostrarla."),
};

/**
 * Tool de ESCRITURA. Publica directo, mismo criterio que create_project —
 * ver ese archivo para el razonamiento completo. Excluida del chat público.
 */
export const createSkillTool: ToolDefinition<typeof inputSchema> = {
  name: "create_skill",
  description:
    "Agrega una nueva habilidad técnica o blanda al portafolio y la publica de inmediato. Pensada para uso personal del dueño — nunca la usa el chat público del sitio.",
  inputSchema,
  handler: async ({ name, category, proficiency, yearsOfExperience, iconUrl }) => {
    const item = await Skill.create({
      name,
      category: category ?? "other",
      proficiency: proficiency ?? 50,
      yearsOfExperience,
      iconUrl,
    });
    return { created: true, id: String(item._id), name: item.name };
  },
};
