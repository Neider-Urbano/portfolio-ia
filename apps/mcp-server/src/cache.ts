/**
 * Caché en memoria, TTL simple — vive mientras el proceso del mcp-server
 * esté arriba (no es serverless, así que la memoria persiste entre
 * requests). Guarda resultados de tools de LECTURA para no volver a pegarle
 * a MongoDB cuando distintos visitantes preguntan variantes de lo mismo en
 * una ventana corta de tiempo. No invalida por evento (no hay forma barata
 * de que apps/web, en otro servidor, le avise a este proceso cuando el
 * dueño edita algo desde el admin) — solo expira por tiempo, y 5 minutos
 * por defecto es corto a propósito: si el dueño edita y prueba en el chat,
 * la demora en ver el cambio es mínima.
 */
const TTL_MS = Number(process.env.MCP_CACHE_TTL_MS ?? 5 * 60 * 1000);

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export async function getOrSetCache<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  const now = Date.now();

  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const value = await compute();
  store.set(key, { value, expiresAt: now + TTL_MS });
  return value;
}
