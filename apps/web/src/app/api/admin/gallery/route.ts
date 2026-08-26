import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { GalleryItem } from "@portafolio/models";

const galleryItemSchema = z.object({
  title: z.string().optional().or(z.literal("")),
  imageUrl: z.string().min(1),
  caption: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  order: z.number().default(0),
});

export async function GET() {
  await connectDB();
  const items = await GalleryItem.find().sort({ order: 1, createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = galleryItemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const item = await GalleryItem.create(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
