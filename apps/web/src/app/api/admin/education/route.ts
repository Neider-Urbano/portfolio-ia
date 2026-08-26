import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Education } from "@portafolio/models";

const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional().or(z.literal("")),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  isCurrent: z.boolean().default(false),
  credentialUrl: z.string().optional().or(z.literal("")),
  type: z.enum(["degree", "certification", "course"]).default("degree"),
  order: z.number().default(0),
});

export async function GET() {
  await connectDB();
  const items = await Education.find().sort({ startDate: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = educationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const item = await Education.create(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
