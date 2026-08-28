import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Blog } from "@portafolio/models";

const blogSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.string().min(1),
  source: z.string().optional().or(z.literal("")),
  relevance: z.number().min(1).max(10).default(5),
  tags: z.array(z.string()).default([]),
  publishedDate: z.string().optional().or(z.literal("")).nullable(),
  reviewed: z.boolean().default(false),
});

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  // A diferencia de get_blogs (la tool MCP pública), acá se listan TODOS —
  // incluidos los sin revisar que dejó la automatización de n8n — es
  // justamente la pantalla donde el dueño los revisa y cura.
  const items = await Blog.find().sort({ reviewed: 1, createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = blogSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const data = { ...parsed.data, publishedDate: parsed.data.publishedDate || null };
  try {
    const item = await Blog.create(data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: "Ya existe un blog registrado con esa URL" }, { status: 409 });
    }
    throw err;
  }
}
