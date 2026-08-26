import type { z } from "zod";

/**
 * Forma común para definir una tool de MCP: nombre, descripción (crítica para que
 * el LLM decida CUÁNDO usarla), el shape de zod para los argumentos, y el handler
 * que ejecuta la consulta Mongoose real.
 */
export interface ToolDefinition<TShape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: TShape;
  handler: (args: z.infer<z.ZodObject<TShape>>) => Promise<unknown>;
}
