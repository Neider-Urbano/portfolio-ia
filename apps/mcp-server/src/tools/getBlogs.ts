import { z } from "zod";
import { Blog } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  tag: z.string().optional().describe("Filtra por un tag/tema específico (ej: 'React', 'IA', 'Carrera')."),
  limit: z.number().int().min(1).max(50).optional().describe("Máximo de blogs a devolver (por defecto 20)"),
};

/**
 * Solo devuelve blogs con reviewed:true — los que la automatización de n8n
 * registra vía create_blog empiezan en reviewed:false y quedan invisibles
 * acá hasta que el dueño los cura desde /admin/blogs. Esta tool sí la usa
 * el chat público del sitio (a diferencia de create_blog), porque lo que
 * devuelve ya pasó control de calidad del dueño.
 */
export const getBlogsTool: ToolDefinition<typeof inputSchema> = {
  name: "get_blogs",
  description:
    "Obtiene artículos de blog externos, ya curados, que aportan al perfil profesional del dueño (lecturas relevantes, no posts propios). Si se pasa 'tag', filtra por ese tema. Úsala para preguntas como '¿qué has estado leyendo?' o '¿qué artículos recomendás sobre X?'.",
  inputSchema,
  handler: async ({ tag, limit }) => {
    const query: Record<string, unknown> = { reviewed: true };
    if (tag) query.tags = { $regex: new RegExp(tag, "i") };

    const blogs = await Blog.find(query)
      .sort({ relevance: -1, publishedDate: -1 })
      .limit(limit ?? 20)
      .lean();

    return {
      count: blogs.length,
      tagFilter: tag ?? null,
      blogs: blogs.map((b) => ({
        title: b.title,
        description: b.description,
        url: b.url,
        source: b.source,
        relevance: b.relevance,
        tags: b.tags,
        publishedDate: b.publishedDate,
      })),
    };
  },
};
