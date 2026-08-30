import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Comment } from "@portafolio/models";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Público, sin auth: cualquier visitante puede enviar un comentario, pero
// queda con isApproved=false hasta que el dueño lo publique desde
// /admin/comentarios (ver Comment.ts).
const commentSchema = z.object({
  name: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  // Honeypot: campo invisible para humanos. Los bots de formularios sí lo
  // rellenan, así que si llega con contenido descartamos el envío en
  // silencio (200 falso-positivo) en vez de decirle al bot que fue detectado.
  website: z.string().max(200).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`comments:${getClientIp(req)}`, {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Mandaste varios comentarios seguidos, esperá un rato." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const parsed = commentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  if (parsed.data.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  await connectDB();
  await Comment.create({ name: parsed.data.name, message: parsed.data.message, isApproved: false });
  return NextResponse.json({ ok: true }, { status: 201 });
}
