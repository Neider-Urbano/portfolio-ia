import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@portafolio/models";
import { buildTotp, generateTotpSecret } from "@/lib/totp";

/**
 * Genera un secreto nuevo y lo guarda en AdminUser, pero totpEnabled sigue
 * en false hasta que /2fa/confirm reciba un código válido — así un setup a
 * medias (usuario cierra la pestaña antes de escanear) nunca deja la cuenta
 * en un estado raro, y se puede reintentar llamando a /init de nuevo.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const user = await AdminUser.findOne({ email: session.user.email.toLowerCase() });
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const secret = generateTotpSecret();
  user.totpSecret = secret;
  user.totpEnabled = false;
  await user.save();

  const totp = buildTotp(secret, user.email);
  const otpauthUrl = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ secret, otpauthUrl, qrDataUrl });
}
