import Profile from "./Profile";
import Experience from "./Experience";
import Education from "./Education";
import Skill from "./Skill";
import Project from "./Project";
import Service from "./Service";
import Reference from "./Reference";
import GalleryItem from "./GalleryItem";
import { calculateAge } from "./stats";

/**
 * Agrega todo el perfil profesional público en un solo objeto — una única
 * fuente de verdad compartida por apps/web (GET /api/resume, la página /cv)
 * y apps/mcp-server (tool get_full_profile), para no duplicar las mismas
 * ocho consultas en dos apps distintas. Ninguno de los dos llama a
 * connectDB() acá adentro: cada app ya garantiza la conexión antes de
 * invocar esta función (ver sus propios lib/db.ts).
 *
 * Deliberadamente excluye lo interno/privado que nunca debe salir de la
 * base: `aiPersona` (instrucciones de tono para el LLM, no un dato "sobre"
 * la persona) y `birthDate` (solo se expone la edad ya calculada). El
 * schema del proyecto no tiene ni tuvo nunca campos de contraseñas,
 * credenciales ni datos bancarios — no hay nada de eso que filtrar.
 */
export async function getFullProfile() {
  const [profile, experience, education, skills, projects, services, references, gallery] = await Promise.all([
    Profile.findOne().lean(),
    Experience.find().sort({ startDate: -1 }).lean(),
    Education.find().sort({ startDate: -1 }).lean(),
    Skill.find().sort({ proficiency: -1 }).lean(),
    Project.find().sort({ featured: -1, createdAt: -1 }).lean(),
    Service.find().sort({ order: 1 }).lean(),
    Reference.find({ isPublished: true }).lean(),
    GalleryItem.find().sort({ order: 1, createdAt: -1 }).lean(),
  ]);

  if (!profile) return null;

  return {
    profile: {
      fullName: profile.fullName,
      headline: profile.headline,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      location: profile.location,
      email: profile.email,
      phone: profile.phone,
      yearsOfExperience: profile.yearsOfExperience,
      age: profile.birthDate ? calculateAge(profile.birthDate) : undefined,
      hobbies: profile.hobbies,
      socialLinks: profile.socialLinks,
      resumeUrl: profile.resumeUrl,
    },
    experience: experience.map((e) => ({
      role: e.role,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      description: e.description,
      technologies: e.technologies,
    })),
    education: education.map((ed) => ({
      degree: ed.degree,
      institution: ed.institution,
      type: ed.type,
      startDate: ed.startDate,
      endDate: ed.endDate,
    })),
    skills: skills.map((s) => ({ name: s.name, proficiency: s.proficiency, category: s.category })),
    projects: projects.map((p) => ({
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      description: p.description,
      technologies: p.technologies,
      status: p.status,
      featured: p.featured,
      liveUrl: p.liveUrl,
      repoUrl: p.repoUrl,
    })),
    services: services.map((s) => ({ title: s.title, description: s.description })),
    references: references.map((r) => ({
      name: r.name,
      role: r.role,
      company: r.company,
      testimonial: r.testimonial,
    })),
    gallery: gallery.map((g) => ({ title: g.title, imageUrl: g.imageUrl, caption: g.caption, tags: g.tags })),
  };
}

export type FullProfile = NonNullable<Awaited<ReturnType<typeof getFullProfile>>>;
