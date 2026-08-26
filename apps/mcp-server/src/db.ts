import mongoose from "mongoose";

let isConnected = false;

/**
 * El mcp-server corre como proceso Node.js persistente (no serverless),
 * por eso basta con una conexión única reutilizada entre llamadas a tools.
 */
export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI no está definido en el entorno del mcp-server");
  }

  await mongoose.connect(uri);
  isConnected = true;
  console.log("[mcp-server] Conectado a MongoDB");

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("[mcp-server] Desconectado de MongoDB");
  });
}
