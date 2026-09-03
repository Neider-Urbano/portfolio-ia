import { z } from "zod";
import { Reference } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  name: z.string().min(1).describe("Nombre de la persona que da la referencia."),
  role: z.string().min(1).describe("Cargo de esa persona."),
  company: z.string().optional().describe("Empresa donde trabaja/trabajaba."),
  relationship: z.string().min(1).describe("Relación con el dueño (ej. 'Jefe directo', 'Compañero de equipo')."),
  testimonial: z.string().min(1).describe("El testimonio/referencia en sí."),
  avatarUrl: z.string().optional().describe("URL de foto de la persona."),
  linkedinUrl: z.string().optional().describe("Link al LinkedIn de la persona."),
  isPublished: z
    .boolean()
    .optional()
    .describe("Si se muestra públicamente. Por defecto true, igual que al crearla desde el dashboard."),
};

/**
 * Tool de ESCRITURA. Publica directo por defecto (isPublished:true es el
 * default del propio schema de Reference, igual que crearla a mano desde
 * /admin/referencias) — mismo criterio que create_project, ver ese archivo
 * para el razonamiento completo. Excluida del chat público.
 */
export const createReferenceTool: ToolDefinition<typeof inputSchema> = {
  name: "create_reference",
  description:
    "Agrega un nuevo testimonio/referencia profesional al portafolio. Pensada para uso personal del dueño (ej. 'agregá esta referencia que me mandó X') — nunca la usa el chat público del sitio.",
  inputSchema,
  handler: async ({ name, role, company, relationship, testimonial, avatarUrl, linkedinUrl, isPublished }) => {
    const item = await Reference.create({
      name,
      role,
      company,
      relationship,
      testimonial,
      avatarUrl,
      linkedinUrl,
      ...(isPublished !== undefined ? { isPublished } : {}),
    });
    return { created: true, id: String(item._id), name: item.name, isPublished: item.isPublished };
  },
};
