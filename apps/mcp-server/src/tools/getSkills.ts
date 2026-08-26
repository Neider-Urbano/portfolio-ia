import { z } from "zod";
import { Skill } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  category: z
    .enum(["language", "framework", "tool", "database", "soft-skill", "other"])
    .optional()
    .describe("Filtra por categoría de habilidad."),
  minProficiency: z.number().min(1).max(100).optional().describe("Filtra habilidades con nivel mínimo (1-100)."),
};

export const getSkillsTool: ToolDefinition<typeof inputSchema> = {
  name: "get_skills",
  description:
    "Obtiene la lista de habilidades técnicas y blandas, con su categoría y nivel de dominio. Úsala para preguntas como '¿qué tecnologías manejas?' o '¿cuál es tu nivel en TypeScript?'.",
  inputSchema,
  handler: async ({ category, minProficiency }) => {
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (minProficiency) query.proficiency = { $gte: minProficiency };

    const skills = await Skill.find(query).sort({ proficiency: -1 }).lean();

    return {
      count: skills.length,
      skills: skills.map((s) => ({
        name: s.name,
        category: s.category,
        proficiency: s.proficiency,
        yearsOfExperience: s.yearsOfExperience,
      })),
    };
  },
};
