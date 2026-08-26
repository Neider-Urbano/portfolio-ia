import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Comment } from "@portafolio/models";

const commentSchema = z.object({
  name: z.string().min(1),
  message: z.string().min(1),
  isApproved: z.boolean().default(false),
});

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const items = await Comment.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = commentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const item = await Comment.create(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
