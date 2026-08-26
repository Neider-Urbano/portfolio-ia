import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Reference } from "@portafolio/models";

const referenceSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  company: z.string().optional().or(z.literal("")),
  relationship: z.string().min(1),
  testimonial: z.string().min(1),
  avatarUrl: z.string().optional().or(z.literal("")),
  linkedinUrl: z.string().optional().or(z.literal("")),
  isPublished: z.boolean().default(true),
});

export async function GET() {
  await connectDB();
  const items = await Reference.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = referenceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const item = await Reference.create(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
