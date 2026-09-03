import { z } from "zod";
import { Service } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  title: z.string().min(1).describe("Título del servicio (ej. 'Desarrollo Web')."),
  description: z.string().min(1).describe("Descripción del servicio."),
  order: z.number().optional().describe("Orden de aparición (menor = primero). Por defecto 0."),
};

/**
 * Tool de ESCRITURA. Publica directo, mismo criterio que create_project —
 * ver ese archivo para el razonamiento completo. Excluida del chat público.
 */
export const createServiceTool: ToolDefinition<typeof inputSchema> = {
  name: "create_service",
  description:
    "Agrega un nuevo servicio profesional ofrecido y lo publica de inmediato. Pensada para uso personal del dueño — nunca la usa el chat público del sitio.",
  inputSchema,
  handler: async ({ title, description, order }) => {
    const item = await Service.create({ title, description, order: order ?? 0 });
    return { created: true, id: String(item._id), title: item.title };
  },
};
