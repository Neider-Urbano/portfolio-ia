import { z } from "zod";
import { Education } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  type: z
    .enum(["degree", "certification", "course"])
    .optional()
    .describe("Filtra por tipo: título universitario (degree), certificación (certification) o curso (course)."),
};

export const getEducationTool: ToolDefinition<typeof inputSchema> = {
  name: "get_education",
  description:
    "Obtiene el historial académico: estudios formales, certificaciones y cursos, con institución, título, fechas y credencial. Úsala para preguntas como '¿qué estudiaste?', '¿tienes certificaciones en AWS?' o '¿dónde te graduaste?'.",
  inputSchema,
  handler: async ({ type }) => {
    const query = type ? { type } : {};
    const items = await Education.find(query).sort({ startDate: -1 }).lean();

    return {
      count: items.length,
      education: items.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
        type: e.type,
        startDate: e.startDate,
        endDate: e.endDate,
        isCurrent: e.isCurrent,
        credentialUrl: e.credentialUrl,
      })),
    };
  },
};
