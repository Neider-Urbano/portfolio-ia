import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// El SDK de Gemini no corre en el runtime Edge.
export const runtime = "nodejs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // ~10 MB, de sobra para un audio corto

/**
 * Transcribe audio del micrófono vía Gemini en el servidor. Reemplaza el
 * SpeechRecognition nativo del navegador: ese depende del servicio interno
 * (no documentado) de reconocimiento de voz de Google y falla con
 * error "network" de forma frecuente e irresoluble fuera de EE. UU.
 * Transcribir a través de nuestra propia llamada a Gemini evita ese punto
 * de falla por completo.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const audio = formData?.get("audio");

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Falta el audio" }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio demasiado largo" }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = audio.type || "audio/webm";

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe este audio en español. Devuelve únicamente el texto transcrito, sin comillas, sin comentarios y sin explicaciones. Si el audio está vacío o no se entiende, devuelve una cadena vacía.",
            },
            { inlineData: { data: base64, mimeType } },
          ],
        },
      ],
    });

    const text = (response.text ?? "").trim();
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error transcribiendo el audio" },
      { status: 500 }
    );
  }
}
