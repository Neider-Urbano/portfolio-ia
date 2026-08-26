import { computePortfolioStats } from "@portafolio/models";
import type { ToolDefinition } from "./types";

export const getPortfolioStatsTool: ToolDefinition = {
  name: "get_portfolio_stats",
  description:
    "Obtiene métricas agregadas del portafolio: años totales de experiencia, cantidad de proyectos, cantidad de tecnologías distintas dominadas, cantidad de cursos/certificaciones, cantidad de títulos formales y cantidad de empresas donde ha trabajado. Úsala para preguntas numéricas generales como '¿cuántos proyectos tienes?', '¿cuántas tecnologías manejas en total?' o '¿cuántos cursos has hecho?', en vez de contar manualmente los resultados de otras tools.",
  inputSchema: {},
  handler: async () => computePortfolioStats(),
};
