import { z } from "zod";
import { Experience } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  company: z.string().min(1).describe("Nombre de la empresa."),
  role: z.string().min(1).describe("Cargo/puesto."),
  startDate: z.string().describe("Fecha de inicio, formato ISO (ej. '2024-01-15')."),
  endDate: z.string().optional().describe("Fecha de fin, formato ISO. Omitila si sigue trabajando ahí."),
  isCurrent: z.boolean().optional().describe("Si es el trabajo actual. Por defecto false."),
  description: z.string().min(1).describe("Descripción de las responsabilidades/logros en ese puesto."),
  technologies: z.array(z.string()).optional().describe("Tecnologías usadas en ese puesto."),
  location: z.string().optional().describe("Ubicación (ciudad, país, o 'Remoto')."),
  companyLogoUrl: z.string().optional().describe("URL del logo de la empresa."),
};

/**
 * Tool de ESCRITURA. Publica directo, mismo criterio que create_project —
 * ver ese archivo para el razonamiento completo. Excluida del chat público.
 */
export const createExperienceTool: ToolDefinition<typeof inputSchema> = {
  name: "create_experience",
  description:
    "Agrega una nueva experiencia laboral al historial del portafolio y la publica de inmediato. Pensada para uso personal del dueño (ej. 'agregá mi nuevo trabajo en X') — nunca la usa el chat público del sitio.",
  inputSchema,
  handler: async ({ company, role, startDate, endDate, isCurrent, description, technologies, location, companyLogoUrl }) => {
    const item = await Experience.create({
      company,
      role,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isCurrent: isCurrent ?? false,
      description,
      technologies: technologies ?? [],
      location,
      companyLogoUrl,
    });
    return { created: true, id: String(item._id), company: item.company, role: item.role };
  },
};
