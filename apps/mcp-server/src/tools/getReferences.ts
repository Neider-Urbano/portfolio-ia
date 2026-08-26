import type { ToolDefinition } from "./types";
import { Reference } from "@portafolio/models";

export const getReferencesTool: ToolDefinition = {
  name: "get_references",
  description:
    "Obtiene testimonios y referencias profesionales publicadas (nombre, cargo, relación y testimonio). Úsala para preguntas como '¿qué dicen tus excompañeros de ti?' o '¿tienes referencias?'.",
  inputSchema: {},
  handler: async () => {
    const refs = await Reference.find({ isPublished: true }).lean();
    return {
      count: refs.length,
      references: refs.map((r) => ({
        name: r.name,
        role: r.role,
        company: r.company,
        relationship: r.relationship,
        testimonial: r.testimonial,
      })),
    };
  },
};
