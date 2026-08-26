import type { ToolDefinition } from "./types";
import { Service } from "@portafolio/models";

export const getServicesTool: ToolDefinition = {
  name: "get_services",
  description:
    "Obtiene los servicios profesionales que ofrece el dueño del portafolio (título y descripción). Úsala para preguntas como '¿qué servicios ofreces?' o '¿en qué me puedes ayudar?'.",
  inputSchema: {},
  handler: async () => {
    const services = await Service.find().sort({ order: 1 }).lean();
    return {
      count: services.length,
      services: services.map((s) => ({ title: s.title, description: s.description })),
    };
  },
};
