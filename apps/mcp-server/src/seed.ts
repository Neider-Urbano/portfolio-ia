import "dotenv/config";
import { connectDB } from "./db";
import { Profile, Experience, Skill, Project } from "@portafolio/models";
import mongoose from "mongoose";

/**
 * Script de siembra mínimo para tener datos de prueba.
 * Ejecutar con: npm run seed --workspace=apps/mcp-server
 */
async function seed() {
  await connectDB();

  await Profile.deleteMany({});
  await Profile.create({
    fullName: "Nedier Julian Urbano Bastilla",
    headline: "Desarrollador Full Stack | IA & MERN",
    bio: "Ingeniero de sistemas especializado en aplicaciones full-stack con integraciones de IA.",
    location: "Paz de Ariporo, Casanare, Colombia",
    email: "julianur012b@gmail.com",
    yearsOfExperience: 5,
    socialLinks: [
      { platform: "github", url: "https://github.com/tu-usuario" },
      { platform: "linkedin", url: "https://linkedin.com/in/tu-usuario" },
    ],
    aiPersona:
      "Responde en primera persona, tono cercano y profesional, en español.",
  });

  await Experience.deleteMany({});
  await Experience.create({
    company: "Empresa Ejemplo",
    role: "Full Stack Developer",
    startDate: new Date("2022-01-01"),
    isCurrent: true,
    description: "Desarrollo de aplicaciones MERN con integraciones de IA.",
    technologies: ["Node.js", "React", "MongoDB", "Next.js"],
  });

  await Skill.deleteMany({});
  await Skill.create([
    {
      name: "Node.js",
      category: "framework",
      proficiency: 90,
      yearsOfExperience: 4,
    },
    { name: "React", category: "framework", proficiency: 88 },
    { name: "MongoDB", category: "database", proficiency: 85 },
  ]);

  await Project.deleteMany({});
  await Project.create({
    title: "Portafolio Interactivo con IA",
    slug: "portafolio-ia",
    summary: "Portafolio con chatbot IA conectado a MongoDB vía MCP.",
    description:
      "Un asistente conversacional que responde preguntas sobre mi perfil consultando datos reales.",
    technologies: ["Next.js", "MongoDB", "Anthropic API", "MCP"],
    images: [],
    featured: true,
    status: "in-progress",
  });

  console.log("Seed completado.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
