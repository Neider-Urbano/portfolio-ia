import { z } from "zod";
import { Blog } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  title: z.string().min(1).describe("Título del artículo de blog."),
  description: z.string().min(1).describe("Resumen breve de qué trata el artículo y por qué es relevante."),
  url: z.string().min(1).describe("Link directo al artículo. Debe ser único — si ya existe uno con esta URL, la tool devuelve un error en vez de duplicarlo."),
  source: z.string().optional().describe("Nombre del sitio o publicación de origen (ej. 'Dev.to', 'Smashing Magazine')."),
  relevance: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe("Qué tan relevante es para el perfil profesional del dueño, de 1 (poco) a 10 (muy relevante). Por defecto 5."),
  tags: z.array(z.string()).optional().describe("Temas/categorías del artículo (ej. ['React', 'IA', 'Carrera'])."),
  publishedDate: z.string().optional().describe("Fecha de publicación del artículo, en formato ISO (ej. '2026-08-20')."),
};

/**
 * Tool de ESCRITURA — la única del servidor. Pensada para que una
 * automatización externa (n8n corriendo cada cierto tiempo) registre
 * artículos nuevos automáticamente; siempre entran con reviewed:false, el
 * dueño los cura después desde /admin/blogs. apps/web excluye esta tool del
 * chat público (ver PUBLIC_CHAT_EXCLUDED_TOOLS en lib/llm.ts) — ningún
 * visitante del sitio debe poder crear contenido con solo pedírselo al chat.
 */
export const createBlogTool: ToolDefinition<typeof inputSchema> = {
  name: "create_blog",
  description:
    "Registra un nuevo artículo de blog externo relevante para el perfil profesional del dueño. Queda sin revisar (reviewed:false) hasta que el dueño lo cura desde el dashboard — esta tool solo registra, nunca publica directamente. Pensada para automatizaciones (n8n) que descubren artículos periódicamente, no para uso conversacional normal.",
  inputSchema,
  handler: async ({ title, description, url, source, relevance, tags, publishedDate }) => {
    try {
      const item = await Blog.create({
        title,
        description,
        url,
        source,
        relevance: relevance ?? 5,
        tags: tags ?? [],
        publishedDate: publishedDate ? new Date(publishedDate) : undefined,
        reviewed: false,
      });
      return { created: true, id: String(item._id), title: item.title };
    } catch (err: any) {
      if (err?.code === 11000) {
        return { created: false, message: `Ya existe un blog registrado con la URL: ${url}` };
      }
      throw err;
    }
  },
};
