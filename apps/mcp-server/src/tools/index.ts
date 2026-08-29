import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProfileInfoTool } from "./getProfileInfo";
import { getExperienceTool } from "./getExperience";
import { getEducationTool } from "./getEducation";
import { getProjectsTool } from "./getProjects";
import { getSkillsTool } from "./getSkills";
import { getGalleryTool } from "./getGallery";
import { getReferencesTool } from "./getReferences";
import { getServicesTool } from "./getServices";
import { getPortfolioStatsTool } from "./getPortfolioStats";
import { getFullProfileTool } from "./getFullProfile";
import { getBlogsTool } from "./getBlogs";
import { createBlogTool } from "./createBlog";
import { getOrSetCache } from "../cache";
import type { ToolDefinition } from "./types";

// Tools de ESCRITURA — nunca deben cachearse, cada llamada tiene que
// ejecutar de verdad. Todo lo que no esté acá es una lectura pura y es
// seguro cachearla (ver src/cache.ts).
const NON_CACHEABLE_TOOLS = new Set(["create_blog"]);

const allTools: ToolDefinition<any>[] = [
  getProfileInfoTool,
  getExperienceTool,
  getEducationTool,
  getProjectsTool,
  getSkillsTool,
  getGalleryTool,
  getReferencesTool,
  getServicesTool,
  getPortfolioStatsTool,
  getFullProfileTool,
  getBlogsTool,
  createBlogTool,
];

/**
 * Registra todas las tools del portafolio en una instancia de McpServer.
 * Cada tool queda expuesta vía el protocolo MCP (listTools / callTool) y,
 * en el lado del cliente (apps/web), se traduce 1:1 a una "tool" de la API de Anthropic.
 */
export function registerAllTools(server: McpServer): void {
  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args: any) => {
        try {
          const result = NON_CACHEABLE_TOOLS.has(tool.name)
            ? await tool.handler(args)
            : await getOrSetCache(`${tool.name}:${JSON.stringify(args ?? {})}`, () => tool.handler(args));
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result) }],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error desconocido";
          return {
            isError: true,
            content: [{ type: "text" as const, text: `Error ejecutando ${tool.name}: ${message}` }],
          };
        }
      }
    );
  }
}
