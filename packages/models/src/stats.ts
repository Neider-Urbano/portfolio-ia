import Profile from "./Profile";
import Experience from "./Experience";
import Education from "./Education";
import Project from "./Project";
import Skill from "./Skill";

export interface PortfolioStats {
  yearsOfExperience: number;
  totalProjects: number;
  totalSkills: number;
  totalTechnologies: number;
  totalCourses: number;
  totalDegrees: number;
  totalCompanies: number;
}

function yearsBetween(start: Date, end: Date): number {
  const ms = end.getTime() - new Date(start).getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

/**
 * Edad en años completos a partir de la fecha de nacimiento. Vive junto al
 * resto de las métricas derivadas para que apps/web (franja de stats) y
 * apps/mcp-server (tool get_profile_info) compartan un único cálculo — la
 * fecha de nacimiento en sí nunca se expone, solo este número.
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

/**
 * Métricas agregadas del portafolio ("el perfil en números"). Se calculan a
 * partir de las colecciones reales para que tanto la vista pública como la
 * tool MCP get_portfolio_stats (usada por el chat) devuelvan siempre el mismo
 * dato — una única fuente de verdad, sin duplicar la lógica en cada app.
 */
export async function computePortfolioStats(): Promise<PortfolioStats> {
  const [profile, experiences, educations, projects, skills] = await Promise.all([
    Profile.findOne().lean(),
    Experience.find().lean(),
    Education.find().lean(),
    Project.find().lean(),
    Skill.find().lean(),
  ]);

  const technologySet = new Set<string>();
  for (const exp of experiences) for (const t of exp.technologies ?? []) technologySet.add(t.toLowerCase());
  for (const p of projects) for (const t of p.technologies ?? []) technologySet.add(t.toLowerCase());
  for (const s of skills) technologySet.add(s.name.toLowerCase());

  const companySet = new Set(experiences.map((e) => e.company));

  // yearsOfExperience prioriza el valor editado a mano en Profile (el dueño
  // puede querer contar experiencia previa no cargada como Experience); si no
  // está definido, se calcula desde la experiencia laboral más antigua.
  let years = profile?.yearsOfExperience ?? 0;
  if (!years && experiences.length > 0) {
    const now = new Date();
    const earliestStart = experiences.reduce(
      (min, e) => (new Date(e.startDate) < new Date(min) ? e.startDate : min),
      experiences[0].startDate
    );
    years = Math.round(yearsBetween(earliestStart, now) * 10) / 10;
  }

  return {
    yearsOfExperience: years,
    totalProjects: projects.length,
    totalSkills: skills.length,
    totalTechnologies: technologySet.size,
    totalCourses: educations.filter((e) => e.type === "course" || e.type === "certification").length,
    totalDegrees: educations.filter((e) => e.type === "degree").length,
    totalCompanies: companySet.size,
  };
}
