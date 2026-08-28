import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Preference } from "@portafolio/models";

// Preference es un documento único (singleton), igual que Profile. A
// diferencia de Profile, NINGÚN otro route (público ni admin) importa este
// modelo — es la garantía de que esto nunca sale del dashboard.
const preferenceSchema = z.object({
  favoriteFootballTeams: z.array(z.string()).default([]),
  favoriteMusicGenres: z.array(z.string()).default([]),
  favoriteFoods: z.array(z.string()).default([]),
  maritalStatus: z.string().optional().or(z.literal("")),
  socioeconomicStratum: z.number().min(1).max(6).optional(),
  desiredSalary: z.string().optional().or(z.literal("")),
  prefersRemoteWork: z.boolean().optional(),
  dailyTools: z.array(z.string()).default([]),
});

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const item = await Preference.findOne().lean();
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = preferenceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const item = await Preference.findOneAndUpdate({}, parsed.data, { new: true, upsert: true });
  return NextResponse.json({ item });
}
