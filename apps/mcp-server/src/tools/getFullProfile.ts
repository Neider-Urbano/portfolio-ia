import { getFullProfile } from "@portafolio/models";
import type { ToolDefinition } from "./types";

/**
 * Vuelca TODO el perfil profesional público en una sola llamada: datos
 * personales, experiencia, educación, skills, proyectos, servicios,
 * referencias y galería. Pensada para integraciones externas (n8n, otros
 * agentes) que quieran conocer el perfil completo sin encadenar una llamada
 * por tema — las demás tools (get_experience, get_projects, etc.) siguen
 * existiendo para cuando el chat solo necesita un tema puntual.
 *
 * Comparte la función de agregación con GET /api/resume y /cv en apps/web
 * (ver @portafolio/models/resume.ts) — una sola fuente de verdad. Nunca
 * incluye nada sensible: el schema del perfil no tiene ni tuvo campos de
 * contraseñas, credenciales ni datos bancarios, y esta tool además excluye
 * a propósito lo interno (aiPersona, la fecha de nacimiento cruda).
 */
export const getFullProfileTool: ToolDefinition = {
  name: "get_full_profile",
  description:
    "Devuelve el perfil profesional completo en una sola respuesta: datos personales, experiencia laboral, educación, habilidades, proyectos, servicios, referencias y galería de fotos. Úsala cuando te pidan un resumen completo o 'todo sobre ti' en vez de encadenar varias tools puntuales.",
  inputSchema: {},
  handler: async () => {
    const data = await getFullProfile();
    if (!data) {
      return { found: false, message: "Aún no se ha configurado el perfil." };
    }
    return { found: true, ...data };
  },
};
