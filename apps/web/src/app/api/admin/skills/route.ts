import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Skill } from "@portafolio/models";

const skillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["language", "framework", "tool", "database", "soft-skill", "other"]).default("other"),
  proficiency: z.number().min(1).max(100).default(50),
  yearsOfExperience: z.number().optional(),
  iconUrl: z.string().optional().or(z.literal("")),
});

export async function GET() {
  await connectDB();
  const items = await Skill.find().sort({ proficiency: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = skillSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const item = await Skill.create(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
