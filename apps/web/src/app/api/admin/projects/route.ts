import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Project } from "@portafolio/models";

/**
 * Patrón CRUD replicable para el resto de colecciones del dashboard: validar
 * el body con zod, proteger con requireAdmin, y usar los métodos de Mongoose.
 * Respuestas estandarizadas como { items } / { item } para que el componente
 * genérico AdminCrudPage (components/admin) funcione igual con cualquier
 * recurso.
 */

const projectSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  liveUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  status: z.enum(["completed", "in-progress", "archived"]).default("completed"),
});

export async function GET() {
  await connectDB();
  const items = await Project.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = projectSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const item = await Project.create(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
