import { z } from "zod";
import { Profile, DocumentItem, calculateAge } from "@portafolio/models";
import type { ToolDefinition } from "./types";

export const getProfileInfoTool: ToolDefinition = {
  name: "get_profile_info",
  description:
    "Obtiene la información personal y profesional principal del perfil: nombre, titular (headline), biografía, ubicación, contacto, años totales de experiencia, edad, sexo, tipo de documento, hobbies, idiomas, enlaces sociales y hoja(s) de vida disponibles. Úsala para preguntas generales como '¿quién eres?', '¿dónde vives?', '¿cuántos años tienes?', '¿cuáles son tus hobbies?', '¿qué idiomas hablas?' o '¿tenés tu CV/resume?'.",
  inputSchema: {},
  handler: async () => {
    const [profile, resumeDocs] = await Promise.all([
      Profile.findOne().lean(),
      DocumentItem.find({ kind: "hoja_vida", isPublic: true }).sort({ isPrimary: -1, language: 1 }).lean(),
    ]);
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
      // El número de documento tampoco se expone nunca acá — ver el
      // comentario en Profile.ts. sex/documentType sí, a pedido del dueño.
      age: profile.birthDate ? calculateAge(profile.birthDate) : undefined,
      sex: profile.sex,
      documentType: profile.documentType,
      hobbies: profile.hobbies,
      languages: profile.languages,
      socialLinks: profile.socialLinks,
      resumes: resumeDocs.map((d) => ({ label: d.label, url: d.url, language: d.language, isPrimary: d.isPrimary })),
    };
  },
};

// Exportado por si el zod schema se necesita reutilizar (actualmente sin parámetros)
export const emptyInput = z.object({});
