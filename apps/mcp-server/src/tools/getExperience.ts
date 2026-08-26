import { z } from "zod";
import { Experience } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  technology: z
    .string()
    .optional()
    .describe(
      "Filtra por una tecnología específica mencionada en las experiencias (ej: 'Node.js', 'React'). Si se provee, también se calcula el total de años trabajados con esa tecnología."
    ),
  limit: z.number().int().min(1).max(50).optional().describe("Máximo de experiencias a devolver (por defecto 20)"),
};

function diffInYears(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

export const getExperienceTool: ToolDefinition<typeof inputSchema> = {
  name: "get_experience",
  description:
    "Obtiene el historial de experiencia laboral (empresas, cargos, fechas, descripción y tecnologías usadas). Si se pasa 'technology', filtra las experiencias que usaron esa tecnología y calcula el total de años de experiencia con ella. Úsala para preguntas como '¿dónde has trabajado?', '¿cuál fue tu último puesto?' o '¿cuántos años de experiencia tienes en Node.js?'.",
  inputSchema,
  handler: async ({ technology, limit }) => {
    const query = technology ? { technologies: { $regex: new RegExp(technology, "i") } } : {};

    const experiences = await Experience.find(query)
      .sort({ startDate: -1 })
      .limit(limit ?? 20)
      .lean();

    let totalYearsWithTechnology: number | undefined;
    if (technology) {
      const now = new Date();
      totalYearsWithTechnology = experiences.reduce((acc, exp) => {
        const end = exp.isCurrent || !exp.endDate ? now : exp.endDate;
        return acc + diffInYears(exp.startDate, end);
      }, 0);
      totalYearsWithTechnology = Math.round(totalYearsWithTechnology * 10) / 10;
    }

    return {
      count: experiences.length,
      technologyFilter: technology ?? null,
      totalYearsWithTechnology: totalYearsWithTechnology ?? null,
      experiences: experiences.map((e) => ({
        company: e.company,
        role: e.role,
        startDate: e.startDate,
        endDate: e.endDate,
        isCurrent: e.isCurrent,
        description: e.description,
        technologies: e.technologies,
        location: e.location,
      })),
    };
  },
};
