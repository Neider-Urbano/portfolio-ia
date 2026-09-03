import { z } from "zod";
import { Education } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  institution: z.string().min(1).describe("Nombre de la institución."),
  degree: z.string().min(1).describe("Título/nombre del programa (ej. 'Ingeniería de Sistemas')."),
  fieldOfStudy: z.string().optional().describe("Campo de estudio, si es distinto del título."),
  startDate: z.string().describe("Fecha de inicio, formato ISO (ej. '2020-01-15')."),
  endDate: z.string().optional().describe("Fecha de fin, formato ISO. Omitila si sigue en curso."),
  isCurrent: z.boolean().optional().describe("Si está en curso actualmente. Por defecto false."),
  credentialUrl: z.string().optional().describe("URL del certificado/credencial."),
  type: z
    .enum(["degree", "certification", "course"])
    .optional()
    .describe("Tipo: título formal, certificación, o curso. Por defecto 'degree'."),
};

/**
 * Tool de ESCRITURA. Publica directo, mismo criterio que create_project —
 * ver ese archivo para el razonamiento completo. Excluida del chat público.
 */
export const createEducationTool: ToolDefinition<typeof inputSchema> = {
  name: "create_education",
  description:
    "Agrega un nuevo estudio, certificación o curso al portafolio y lo publica de inmediato. Pensada para uso personal del dueño (ej. 'agregá esta certificación que acabo de sacar') — nunca la usa el chat público del sitio.",
  inputSchema,
  handler: async ({ institution, degree, fieldOfStudy, startDate, endDate, isCurrent, credentialUrl, type }) => {
    const item = await Education.create({
      institution,
      degree,
      fieldOfStudy,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isCurrent: isCurrent ?? false,
      credentialUrl,
      type: type ?? "degree",
    });
    return { created: true, id: String(item._id), institution: item.institution, degree: item.degree };
  },
};
