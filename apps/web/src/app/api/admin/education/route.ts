import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Education } from "@portafolio/models";
import { reorderResource } from "@/lib/reorder";
import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";

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
  const items = await Education.find().sort({ order: 1, startDate: -1 }).lean();
  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  return reorderResource(req, Education);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = educationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  await connectDB();
  const order = await Education.countDocuments();
  const item = await Education.create({ ...parsed.data, order });
  return NextResponse.json({ item }, { status: 201 });
}
