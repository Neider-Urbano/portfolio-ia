import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Cliente MCP que apps/web usa para hablar con apps/mcp-server.
 * Se crea una conexión nueva y corta por request de chat (modo stateless,
 * simétrico con el servidor) — evita mantener estado de sesión MCP entre
 * invocaciones serverless de Next.js.
 */
export async function withMcpClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const serverUrl = process.env.MCP_SERVER_URL;
  // El chat manda la key de scope PÚBLICO si existe: con ella el servidor MCP
  // ni siquiera registra las tools reservadas al dueño (escritura y
  // get_full_profile) — la verificación es server-side. Fallback a la key
  // completa para despliegues que todavía no configuren la nueva variable
  // (ahí el filtro de PUBLIC_CHAT_EXCLUDED_TOOLS en llm.ts sigue siendo la
  // única barrera, como antes). Se usa `||` y no `??`: una variable definida
  // pero vacía cuenta como no definida, para que un .env a medio cargar no
  // rompa el chat mandando una key en blanco.
  const apiKey = process.env.MCP_PUBLIC_API_KEY || process.env.MCP_API_KEY;
  if (!serverUrl) throw new Error("MCP_SERVER_URL no está definido");

  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    requestInit: {
      headers: apiKey ? { "x-mcp-api-key": apiKey } : undefined,
    },
  });

  const client = new Client({ name: "portafolio-web-client", version: "1.0.0" });
  await client.connect(transport);

  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

export interface McpToolSummary {
  name: string;
  description?: string;
  inputSchema: unknown;
}

export async function listMcpTools(): Promise<McpToolSummary[]> {
  return withMcpClient(async (client) => {
    const { tools } = await client.listTools();
    return tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
  });
}

export async function callMcpTool(name: string, args: Record<string, unknown>): Promise<string> {
  return withMcpClient(async (client) => {
    const result = await client.callTool({ name, arguments: args });
    const content = result.content as Array<{ type: string; text?: string }>;
    const textPart = content.find((c) => c.type === "text");
    return textPart?.text ?? JSON.stringify(result);
  });
}
