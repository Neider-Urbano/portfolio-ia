import { z } from "zod";
import { connectDB } from "@/lib/db";
import { reorderResource } from "@/lib/reorder";
import { GalleryItem } from "@portafolio/models";
import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";

const galleryItemSchema = z.object({
  title: z.string().optional().or(z.literal("")),
  imageUrl: z.string().min(1),
  caption: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  order: z.number().default(0),
});

export async function GET() {
  await connectDB();
  const items = await GalleryItem.find()
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  return reorderResource(req, GalleryItem);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = galleryItemSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  await connectDB();
  const order = await GalleryItem.countDocuments();
  const item = await GalleryItem.create({ ...parsed.data, order });
  return NextResponse.json({ item }, { status: 201 });
}
