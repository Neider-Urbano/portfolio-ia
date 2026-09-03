import { getFullProfile, Preference, Profile, DocumentItem } from "@portafolio/models";
import type { ToolDefinition } from "./types";

/**
 * Vuelca TODO el perfil profesional público en una sola llamada (que ya
 * incluye sex/documentType — ver getFullProfile() en @portafolio/models),
 * MÁS lo estrictamente privado: preferencias personales (equipos de fútbol,
 * géneros musicales, comidas, estado civil, estrato, salario esperado,
 * preferencia de trabajo remoto, herramientas de uso diario), el número de
 * documento (el único dato de identidad que sigue siendo siempre privado),
 * y TODOS los documentos cargados (incluidos los no públicos, como cédula o
 * pase de moto) — pensada para integraciones externas de uso personal
 * (Claude conectado como MCP remoto, n8n) que el dueño controla
 * directamente con su propia MCP_API_KEY.
 *
 * Todo esto se agrega ACÁ, no en getFullProfile() de @portafolio/models —
 * esa función compartida sigue siendo 100% pública (la usan también
 * GET /api/resume y /cv) y nunca debe tocar Preference, `documentNumber`, ni
 * los DocumentItem no públicos. Además, apps/web filtra esta tool antes de
 * ofrecérsela al chat público (ver lib/llm.ts): el visitante del sitio
 * nunca la ve disponible para llamar. Si conectás este mismo servidor MCP
 * desde otro lado (Claude, n8n) sin pasar por ese filtro, SÍ vas a recibir
 * todo esto — es intencional, ese es justamente el uso que pediste para
 * esta tool.
 */
export const getFullProfileTool: ToolDefinition = {
  name: "get_full_profile",
  description:
    "Devuelve el perfil profesional completo en una sola respuesta: datos personales (incluye sexo y tipo de documento), experiencia laboral, educación, habilidades, proyectos, servicios, referencias, galería de fotos, preferencias personales privadas, número de documento, y todos los documentos cargados (cédula, hojas de vida, etc., incluidos los no públicos). Pensada para uso personal del dueño vía integraciones externas (Claude, n8n) — nunca la usa el chat público del sitio.",
  inputSchema: {},
  handler: async () => {
    const [data, preferences, rawProfile, documents] = await Promise.all([
      getFullProfile(),
      Preference.findOne().lean(),
      Profile.findOne().lean(),
      DocumentItem.find().sort({ kind: 1, createdAt: -1 }).lean(),
    ]);
    if (!data) {
      return { found: false, message: "Aún no se ha configurado el perfil." };
    }
    return {
      found: true,
      ...data,
      documentNumber: rawProfile?.documentNumber ?? null,
      documents: documents.map((d) => ({
        label: d.label,
        url: d.url,
        kind: d.kind,
        language: d.language,
        isPublic: d.isPublic,
        isPrimary: d.isPrimary,
      })),
      preferences: preferences
        ? {
            favoriteFootballTeams: preferences.favoriteFootballTeams,
            favoriteMusicGenres: preferences.favoriteMusicGenres,
            favoriteFoods: preferences.favoriteFoods,
            maritalStatus: preferences.maritalStatus,
            socioeconomicStratum: preferences.socioeconomicStratum,
            desiredSalary: preferences.desiredSalary,
            prefersRemoteWork: preferences.prefersRemoteWork,
            dailyTools: preferences.dailyTools,
          }
        : null,
    };
  },
};
