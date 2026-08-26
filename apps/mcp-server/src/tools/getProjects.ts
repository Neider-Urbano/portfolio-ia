import { z } from "zod";
import { Project } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  technology: z.string().optional().describe("Filtra proyectos que usan una tecnología específica (ej: 'MongoDB')."),
  featured: z.boolean().optional().describe("Si es true, devuelve solo proyectos destacados."),
  latest: z.boolean().optional().describe("Si es true, ordena por más reciente primero (por defecto ya es así)."),
  slug: z.string().optional().describe("Busca un único proyecto por su slug exacto para dar detalle completo."),
  limit: z.number().int().min(1).max(50).optional().describe("Máximo de proyectos a devolver (por defecto 10)."),
};

export const getProjectsTool: ToolDefinition<typeof inputSchema> = {
  name: "get_projects",
  description:
    "Busca y lista los proyectos del portafolio, con filtros opcionales por tecnología o destacados, o un proyecto puntual por slug. Úsala para preguntas como '¿cuál fue tu último proyecto?', '¿tienes proyectos con Next.js?' o '¿qué proyectos destacas?'.",
  inputSchema,
  handler: async ({ technology, featured, slug, limit }) => {
    if (slug) {
      // No se incrementa viewCount aquí: el conteo de "proyectos más vistos" refleja
      // vistas reales en la vista tradicional (ver AnalyticsEvent "project_view"),
      // no exploraciones especulativas del LLM.
      const project = await Project.findOne({ slug }).lean();
      if (!project) return { found: false };
      return { found: true, project };
    }

    const query: Record<string, unknown> = {};
    if (technology) query.technologies = { $regex: new RegExp(technology, "i") };
    if (typeof featured === "boolean") query.featured = featured;

    const projects = await Project.find(query)
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit ?? 10)
      .lean();

    return {
      count: projects.length,
      projects: projects.map((p) => ({
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        technologies: p.technologies,
        liveUrl: p.liveUrl,
        repoUrl: p.repoUrl,
        featured: p.featured,
        status: p.status,
      })),
    };
  },
};
