import { getFullProfile, Preference } from "@portafolio/models";
import type { ToolDefinition } from "./types";

/**
 * Vuelca TODO el perfil profesional público en una sola llamada, MÁS las
 * preferencias personales privadas (equipos de fútbol, géneros musicales,
 * comidas, estado civil, estrato, salario esperado, preferencia de trabajo
 * remoto, herramientas de uso diario) — pensada para integraciones externas
 * de uso personal (Claude conectado como MCP remoto, n8n) que el dueño
 * controla directamente con su propia MCP_API_KEY.
 *
 * Las preferencias se agregan ACÁ, no en getFullProfile() de
 * @portafolio/models — esa función compartida sigue siendo 100% pública
 * (la usan también GET /api/resume y /cv) y nunca debe tocar el modelo
 * Preference. Además, apps/web filtra esta tool antes de ofrecérsela al
 * chat público (ver lib/llm.ts): el visitante del sitio nunca la ve
 * disponible para llamar, así que nunca puede pedirle al chat estos datos.
 * Si conectás este mismo servidor MCP desde otro lado (Claude, n8n) sin
 * pasar por ese filtro, SÍ vas a recibir las preferencias — es intencional,
 * ese es justamente el uso que pediste para esta tool.
 */
export const getFullProfileTool: ToolDefinition = {
  name: "get_full_profile",
  description:
    "Devuelve el perfil profesional completo en una sola respuesta: datos personales, experiencia laboral, educación, habilidades, proyectos, servicios, referencias, galería de fotos y preferencias personales privadas (equipos, música, comida, estado civil, estrato, salario esperado, preferencia de trabajo remoto, herramientas de uso diario). Pensada para uso personal del dueño vía integraciones externas (Claude, n8n) — nunca la usa el chat público del sitio.",
  inputSchema: {},
  handler: async () => {
    const [data, preferences] = await Promise.all([getFullProfile(), Preference.findOne().lean()]);
    if (!data) {
      return { found: false, message: "Aún no se ha configurado el perfil." };
    }
    return {
      found: true,
      ...data,
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
