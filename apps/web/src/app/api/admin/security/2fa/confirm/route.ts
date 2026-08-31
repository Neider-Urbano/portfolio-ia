import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@portafolio/models";
import { buildTotp } from "@/lib/totp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({ code: z.string().min(6).max(6) });

/**
 * Confirma el setup iniciado en /2fa/init: recién acá totpEnabled pasa a true.
 * Rate-limited: aunque esta ruta ya exige sesión, un código de 6 dígitos es
 * adivinable por fuerza bruta (~3 códigos válidos en cualquier momento con
 * window:1) si alguien la golpea sin límite.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { allowed, retryAfterSeconds } = checkRateLimit(`2fa-confirm:${getClientIp(req)}`, {
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos, esperá unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Código inválido" }, { status: 400 });

  await connectDB();
  const user = await AdminUser.findOne({ email: session.user.email.toLowerCase() }).select("+totpSecret");
  if (!user?.totpSecret) {
    return NextResponse.json({ error: "No hay un setup de 2FA en curso. Empezá de nuevo." }, { status: 400 });
  }

  const totp = buildTotp(user.totpSecret, user.email);
  const delta = totp.validate({ token: parsed.data.code, window: 1 });
  if (delta === null) return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });

  user.totpEnabled = true;
  await user.save();

  return NextResponse.json({ ok: true });
}
