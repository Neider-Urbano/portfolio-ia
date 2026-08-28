import { Resend } from "resend";

// Los dos canales son opcionales e independientes: sin su variable de
// entorno configurada, la función correspondiente solo loggea y devuelve
// sent:false — nunca tira el request de contacto entero por un canal que
// todavía no se configuró.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Portafolio <onboarding@resend.dev>";

/**
 * Envía el mensaje de contacto por email al dueño del portafolio, con
 * replyTo apuntando al visitante — así alcanza con hacer "responder" desde
 * cualquier cliente de correo. Sin dominio propio verificado en Resend,
 * "onboarding@resend.dev" (el remitente de prueba de Resend) igual entrega
 * a cualquier destinatario, así que funciona desde el primer día.
 */
export async function sendContactEmail(params: {
  to: string;
  visitorName: string;
  visitorEmail: string;
  message: string;
}): Promise<{ sent: boolean }> {
  if (!resend) {
    console.warn("[notify] RESEND_API_KEY no configurada — se omite el email de contacto.");
    return { sent: false };
  }

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: params.visitorEmail,
    subject: `Nuevo mensaje de contacto de ${params.visitorName}`,
    text: `${params.visitorName} (${params.visitorEmail}) te escribió desde el portafolio:\n\n${params.message}`,
  });

  if (result.error) throw new Error(result.error.message);
  return { sent: true };
}

/**
 * Notificación por Telegram — un simple POST a la Bot API oficial, sin SDK.
 * Solo notifica AL DUEÑO (no es un canal para responderle al visitante); ver
 * .env.example para cómo conseguir TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID.
 * Reemplaza al intento anterior con CallMeBot (WhatsApp no oficial) — su bot
 * de activación estaba con cupo lleno y sin fecha de vuelta, así que se
 * descartó como opción viable; el botón wa.me directo del sitio sigue
 * intacto para quien prefiera escribir por WhatsApp.
 */
export async function sendTelegramNotification(text: string): Promise<{ sent: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[notify] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID no configuradas — se omite la notificación.");
    return { sent: false };
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram respondió ${res.status}: ${body}`);
  }
  return { sent: true };
}
