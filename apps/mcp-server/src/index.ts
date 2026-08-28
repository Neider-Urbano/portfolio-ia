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

  // Autenticación simple. Acepta DOS formas del mismo secreto:
  // - "x-mcp-api-key: <key>" — la que usa apps/web, un header custom.
  // - "Authorization: Bearer <key>" — el header estándar, para clientes
  //   como el conector remoto de Claude, cuya UI para agregar un servidor
  //   MCP suele tener un campo único de "API key"/token y arma ella misma
  //   un Authorization: Bearer, sin dar forma de elegir el nombre del
  //   header — no hay nada que "agregar" ahí salvo pegar la key.
  app.use("/mcp", (req, res, next) => {
    const bearer = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    const providedKey = req.header("x-mcp-api-key") ?? bearer;
    if (MCP_API_KEY && providedKey !== MCP_API_KEY) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    next();
  });

  // StreamableHTTPServerTransport exige que el cliente mande
  // "Accept: application/json, text/event-stream" exacto — si falta
  // cualquiera de los dos, responde 406 antes de llegar a auth/tools. No
  // todos los clientes MCP (Claude incluido, en algunas integraciones) lo
  // mandan así por defecto, así que lo forzamos acá: da igual lo que haya
  // pedido el cliente, este servidor siempre sabe responder ambos formatos.
  app.use("/mcp", (req, _res, next) => {
    req.headers.accept = "application/json, text/event-stream";
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

  // Este servidor corre en modo "stateless" (sin sessionId), así que no
  // mantiene un stream SSE abierto por GET — algunos clientes MCP prueban
  // GET /mcp antes o en vez de POST; se responde con el 405 + shape JSON-RPC
  // que recomienda la spec, en vez del 404 HTML por default de Express, que
  // varios clientes no saben interpretar.
  app.get("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method Not Allowed: this server is stateless, use POST /mcp" },
      id: null,
    });
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
