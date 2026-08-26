import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Experience } from "@portafolio/models";

const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().min(1),
  technologies: z.array(z.string()).default([]),
  location: z.string().optional().or(z.literal("")),
  companyLogoUrl: z.string().optional().or(z.literal("")),
  order: z.number().default(0),
});

export async function GET() {
  await connectDB();
  const items = await Experience.find().sort({ startDate: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = experienceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const item = await Experience.create(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
