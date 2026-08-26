import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Service } from "@portafolio/models";

const serviceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().default(0),
});

export async function GET() {
  await connectDB();
  const items = await Service.find().sort({ order: 1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = serviceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const item = await Service.create(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
