import { NextResponse } from "next/server";
import { getResumeData } from "@/lib/resume";

export const dynamic = "force-dynamic";

/**
 * Endpoint público con toda la información profesional en un solo JSON —
 * deliberadamente separado de las tools MCP (que están pensadas para que el
 * chat consulte un tema a la vez, no para volcar el perfil completo). Sirve
 * como fuente de datos para /cv y para cualquier integración externa que
 * quiera el currículum completo de una sola consulta (import a un ATS,
 * generador de PDF de terceros, etc.).
 *
 * Todo lo que devuelve ya es público en el sitio — no expone nada que no se
 * vea navegando el home (se excluyen a propósito aiPersona y birthDate del
 * perfil, que son campos internos/privados; ver lib/resume.ts).
 */
export async function GET() {
  const data = await getResumeData();
  if (!data) {
    return NextResponse.json({ error: "El perfil todavía no está configurado." }, { status: 404 });
  }
  return NextResponse.json(data);
}
