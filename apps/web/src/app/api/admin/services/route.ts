import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Service } from "@portafolio/models";
import { reorderResource } from "@/lib/reorder";
import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";

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

export async function PATCH(req: NextRequest) {
  return reorderResource(req, Service);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = serviceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  await connectDB();
  const order = await Service.countDocuments();
  const item = await Service.create({ ...parsed.data, order });
  return NextResponse.json({ item }, { status: 201 });
}
