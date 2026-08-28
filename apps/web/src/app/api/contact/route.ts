import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Profile, AnalyticsEvent } from "@portafolio/models";
import { sendContactEmail, sendTelegramNotification } from "@/lib/notify";

// Público, sin auth: cualquier visitante puede escribir. El email es el
// canal "requerido" (si falla, se le avisa al visitante); Telegram es un
// aviso extra best-effort — si falla o no está configurado, el mensaje
// igual llegó por email y el visitante no ve ningún error.
const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1),
  // Honeypot: campo invisible para humanos, igual que en /api/comments.
  website: z.string().max(200).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const { name, email, message, sessionId } = parsed.data;

  await connectDB();
  const profile = await Profile.findOne().lean();
  if (!profile?.email) {
    return NextResponse.json({ error: "El sitio no tiene un email de contacto configurado todavía." }, { status: 503 });
  }

  // Sin dominio propio verificado en Resend, el modo sandbox SOLO entrega a
  // la dirección con la que se creó la cuenta de Resend — que puede no ser
  // la misma que Profile.email (el contacto público del sitio). CONTACT_TO_EMAIL
  // permite apuntar los envíos a esa dirección de cuenta mientras tanto, sin
  // tocar el email público que ve el visitante.
  const to = process.env.CONTACT_TO_EMAIL || profile.email;

  try {
    const { sent } = await sendContactEmail({ to, visitorName: name, visitorEmail: email, message });
    // sent:false (sin lanzar excepción) significa que RESEND_API_KEY no está
    // configurada todavía — no es un error del visitante, pero tampoco hay
    // que decirle "enviado" cuando en realidad nadie lo recibió.
    if (!sent) {
      return NextResponse.json(
        { error: "El envío de mensajes todavía no está activado en el sitio, escribime directo por email o WhatsApp." },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("[contact] Falló el envío del email:", err);
    return NextResponse.json({ error: "No se pudo enviar tu mensaje, intenta de nuevo en un momento." }, { status: 502 });
  }

  sendTelegramNotification(`📩 Nuevo contacto desde el portafolio\n\n${name} (${email}):\n${message}`).catch((err) =>
    console.error("[contact] Falló la notificación de Telegram (no bloqueante):", err)
  );

  await AnalyticsEvent.create({
    type: "contact_message",
    sessionId,
    metadata: { name, email },
  });

  return NextResponse.json({ ok: true });
}
