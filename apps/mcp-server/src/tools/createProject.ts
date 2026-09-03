import { z } from "zod";
import { Project } from "@portafolio/models";
import { slugify } from "../lib/slugify";
import type { ToolDefinition } from "./types";

const inputSchema = {
  title: z.string().min(1).describe("Título del proyecto."),
  summary: z.string().min(1).describe("Resumen corto (1-2 líneas) para la tarjeta del proyecto."),
  description: z.string().min(1).describe("Descripción completa del proyecto."),
  slug: z
    .string()
    .optional()
    .describe("Slug para la URL (ej. 'mi-proyecto'). Si no se da, se genera automáticamente a partir del título."),
  technologies: z.array(z.string()).optional().describe("Tecnologías usadas (ej. ['Next.js', 'MongoDB'])."),
  images: z.array(z.string()).optional().describe("URLs de imágenes del proyecto."),
  liveUrl: z.string().optional().describe("Link al proyecto en vivo/desplegado."),
  repoUrl: z.string().optional().describe("Link al repositorio."),
  featured: z.boolean().optional().describe("Si es true, aparece destacado. Por defecto false."),
  status: z
    .enum(["completed", "in-progress", "archived"])
    .optional()
    .describe("Estado del proyecto. Por defecto 'completed'."),
};

/**
 * Tool de ESCRITURA. Publica directo (mismo comportamiento que crear un
 * proyecto desde /admin/proyectos) — a diferencia de create_blog, acá no
 * hay automatización externa disparándola sola: es el dueño pidiéndoselo
 * directamente a través de un cliente MCP personal (Claude, n8n), así que
 * no necesita una compuerta de revisión aparte. Excluida del chat público
 * (ver PUBLIC_CHAT_EXCLUDED_TOOLS en apps/web/src/lib/llm.ts).
 */
export const createProjectTool: ToolDefinition<typeof inputSchema> = {
  name: "create_project",
  description:
    "Crea un nuevo proyecto en el portafolio y lo publica de inmediato. Pensada para uso personal del dueño (ej. 'agregá este proyecto que acabo de terminar') — nunca la usa el chat público del sitio.",
  inputSchema,
  handler: async ({ title, summary, description, slug, technologies, images, liveUrl, repoUrl, featured, status }) => {
    try {
      const item = await Project.create({
        title,
        summary,
        description,
        slug: slug?.trim() || slugify(title),
        technologies: technologies ?? [],
        images: images ?? [],
        liveUrl: liveUrl || undefined,
        repoUrl: repoUrl || undefined,
        featured: featured ?? false,
        status: status ?? "completed",
      });
      return { created: true, id: String(item._id), title: item.title, slug: item.slug };
    } catch (err: any) {
      if (err?.code === 11000) {
        return {
          created: false,
          message: `Ya existe un proyecto con ese slug. Probá pasando un 'slug' distinto explícitamente.`,
        };
      }
      throw err;
    }
  },
};
