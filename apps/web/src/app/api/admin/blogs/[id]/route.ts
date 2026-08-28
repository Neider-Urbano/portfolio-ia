import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { Blog } from "@portafolio/models";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  await connectDB();
  const item = await Blog.findByIdAndUpdate(params.id, body, { new: true });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const deleted = await Blog.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
