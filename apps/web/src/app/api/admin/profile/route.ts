import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Profile } from "@portafolio/models";

// Profile es un documento único (singleton): no hay lista ni [id], solo
// "leer el perfil actual" y "actualizarlo" (upsert).
const profileSchema = z.object({
  fullName: z.string().min(1),
  headline: z.string().min(1),
  bio: z.string().min(1),
  avatarUrl: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal("")),
  yearsOfExperience: z.number().default(0),
  socialLinks: z.array(z.object({ platform: z.string(), url: z.string() })).default([]),
  resumeUrl: z.string().optional().or(z.literal("")),
  aiPersona: z.string().optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  hobbies: z.array(z.string()).default([]),
});

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const item = await Profile.findOne().lean();
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  // Mongoose no castea "" a Date: hay que mandar null explícito para poder
  // borrar la fecha de nacimiento desde el formulario.
  const data = { ...parsed.data, birthDate: parsed.data.birthDate || null };
  const item = await Profile.findOneAndUpdate({}, data, { new: true, upsert: true });
  return NextResponse.json({ item });
}
