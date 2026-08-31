interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Limitador simple en memoria, por IP. Vive mientras la función serverless
 * esté "caliente" (Vercel reutiliza la misma instancia entre requests
 * seguidos) — no es a prueba de un ataque distribuido serio, pero frena de
 * sobra el abuso real que le puede pasar a un portafolio personal (alguien
 * mandando el chat o el formulario de contacto en loop). Para eso no hace
 * falta un servicio externo (Redis, etc.) — sería sobre-ingeniería para esta
 * escala.
 */
const buckets = new Map<string, Bucket>();

// Barrido periódico para no acumular entradas vencidas para siempre en
// memoria en un proceso de larga vida.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  },
  10 * 60 * 1000
).unref?.();

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= opts.limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Vercel/proxies estándar mandan la IP real del visitante en este header. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Misma extracción que getClientIp, pero para el `req.headers` que entrega
 * NextAuth dentro de `authorize()` — ahí no es un `Request` de Fetch API,
 * sino un objeto plano (`Record<string, any>`). Usado por lib/auth.ts para
 * frenar fuerza bruta en el login.
 */
export function getClientIpFromHeaderObject(headers: Record<string, unknown> | undefined): string {
  const forwarded = headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  const real = headers?.["x-real-ip"];
  if (typeof real === "string" && real) return real;
  return "unknown";
}
