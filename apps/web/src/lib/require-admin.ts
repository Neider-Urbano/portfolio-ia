import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Defensa en profundidad: src/middleware.ts ya protege todo /api/admin/*,
 * pero cada route handler valida la sesión también, por si algún día se
 * llama a estas funciones fuera de esa ruta protegida.
 */
export async function requireAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session;
}
