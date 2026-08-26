import mongoose from "mongoose";

/**
 * Patrón de conexión cacheada en global, necesario en Next.js porque en dev
 * (hot reload) y en serverless cada invocación podría re-importar el módulo
 * y abrir conexiones nuevas si no se reutiliza la promesa de conexión.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI no está definido");

  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(uri);
  }
  return global._mongooseConn;
}
