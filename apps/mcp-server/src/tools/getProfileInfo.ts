import { z } from "zod";
import { Profile, calculateAge } from "@portafolio/models";
import type { ToolDefinition } from "./types";

export const getProfileInfoTool: ToolDefinition = {
  name: "get_profile_info",
  description:
    "Obtiene la información personal y profesional principal del perfil: nombre, titular (headline), biografía, ubicación, contacto, años totales de experiencia, edad, hobbies y enlaces sociales. Úsala para preguntas generales como '¿quién eres?', '¿dónde vives?', '¿cuántos años tienes?' o '¿cuáles son tus hobbies?'.",
  inputSchema: {},
  handler: async () => {
    const profile = await Profile.findOne().lean();
    if (!profile) {
      return { found: false, message: "Aún no se ha configurado el perfil." };
    }
    return {
      found: true,
      fullName: profile.fullName,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      email: profile.email,
      yearsOfExperience: profile.yearsOfExperience,
      // La fecha de nacimiento nunca se expone, solo la edad ya calculada.
      age: profile.birthDate ? calculateAge(profile.birthDate) : undefined,
      hobbies: profile.hobbies,
      socialLinks: profile.socialLinks,
      resumeUrl: profile.resumeUrl,
    };
  },
};

// Exportado por si el zod schema se necesita reutilizar (actualmente sin parámetros)
export const emptyInput = z.object({});
