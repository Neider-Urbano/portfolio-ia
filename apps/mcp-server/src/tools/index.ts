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
import { createProjectTool } from "./createProject";
import { createSkillTool } from "./createSkill";
import { createExperienceTool } from "./createExperience";
import { createEducationTool } from "./createEducation";
import { createReferenceTool } from "./createReference";
import { createServiceTool } from "./createService";
import { getOrSetCache } from "../cache";
import type { ToolDefinition } from "./types";

// Tools de ESCRITURA — nunca deben cachearse, cada llamada tiene que
// ejecutar de verdad (si no, un segundo "create_project" con los mismos
// argumentos devolvería el resultado cacheado del primero en vez de crear
// uno nuevo). Todo lo que no esté acá es una lectura pura y es seguro
// cachearla (ver src/cache.ts).
const NON_CACHEABLE_TOOLS = new Set([
  "create_blog",
  "create_project",
  "create_skill",
  "create_experience",
  "create_education",
  "create_reference",
  "create_service",
]);

// Tools reservadas al dueño: get_full_profile devuelve datos privados
// (preferencias, documentos) y las create_* escriben en la base. Este set es
// la fuente de verdad del SERVIDOR: cuando una petición llega con la key de
// scope público, ni siquiera se registran — el cliente no las ve ni puede
// invocarlas, es una barrera estructural y no un pedido en el prompt (que un
// LLM se salta). apps/web mantiene además su propio filtro
// (PUBLIC_CHAT_EXCLUDED_TOOLS en lib/llm.ts) como defensa en profundidad:
// una tool nueva acá TIENE que sumarse también al otro lado.
export const OWNER_ONLY_TOOLS = new Set([
  "get_full_profile",
  "create_blog",
  "create_project",
  "create_skill",
  "create_experience",
  "create_education",
  "create_reference",
  "create_service",
]);

/**
 * Alcance de una petición MCP, definido por la key con la que autenticó:
 * - "public": solo tools de lectura — lo que usa el chat del sitio.
 * - "owner": todo — el dueño vía integraciones externas (Claude, n8n).
 */
export type McpScope = "public" | "owner";

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
  createProjectTool,
  createSkillTool,
  createExperienceTool,
  createEducationTool,
  createReferenceTool,
  createServiceTool,
];

/**
 * Registra las tools del portafolio en una instancia de McpServer,
 * respetando el scope del request: con "public" se omiten las reservadas al
 * dueño (OWNER_ONLY_TOOLS), así que ni se anuncian en listTools ni pueden
 * invocarse con callTool. El filtrado vive acá, del lado del servidor — el
 * filtro de apps/web es solo la primera línea, no la garantía.
 */
export function registerAllTools(server: McpServer, scope: McpScope = "owner"): void {
  for (const tool of allTools) {
    if (scope === "public" && OWNER_ONLY_TOOLS.has(tool.name)) continue;
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
