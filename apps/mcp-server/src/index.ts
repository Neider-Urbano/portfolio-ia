import "dotenv/config";
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { connectDB } from "./db";
import { registerAllTools } from "./tools";

const PORT = Number(process.env.PORT ?? 4002);
const MCP_API_KEY = process.env.MCP_API_KEY; // secreto compartido con apps/web

function buildServer(): McpServer {
  const server = new McpServer({
    name: "portafolio-mcp-server",
    version: "1.0.0",
  });
  registerAllTools(server);
  return server;
}

async function main() {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Autenticación simple entre apps/web (cliente MCP) y este servidor.
  // El servidor NUNCA se expone directamente al navegador del visitante.
  app.use("/mcp", (req, res, next) => {
    if (MCP_API_KEY && req.header("x-mcp-api-key") !== MCP_API_KEY) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    next();
  });

  // Modo "stateless": se crea un server+transport nuevo por request.
  // Es el patrón recomendado para desplegar MCP detrás de funciones serverless
  // o balanceadores sin afinidad de sesión — encaja con el uso puntual de tools
  // que hace la ruta /api/chat de Next.js en cada turno de conversación.
  app.post("/mcp", async (req, res) => {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("[mcp-server] Error manejando request MCP:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error interno del servidor MCP" });
      }
    }
  });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.listen(PORT, () => {
    console.log(`[mcp-server] Escuchando en http://localhost:${PORT}/mcp`);
  });
}

main().catch((err) => {
  console.error("[mcp-server] Fallo al iniciar:", err);
  process.exit(1);
});
