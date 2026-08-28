import { connectDB } from "./db";
import { getFullProfile, type FullProfile } from "@portafolio/models";

/**
 * Wrapper delgado: se asegura la conexión (propia de esta app) y delega el
 * armado del objeto a la función compartida en @portafolio/models, la misma
 * que usa la tool MCP get_full_profile — una sola fuente de verdad para
 * "todo mi perfil", consumida por /api/resume, /cv, y el MCP server.
 */
export async function getResumeData(): Promise<FullProfile | null> {
  await connectDB();
  return getFullProfile();
}

export type { FullProfile as ResumeData };
