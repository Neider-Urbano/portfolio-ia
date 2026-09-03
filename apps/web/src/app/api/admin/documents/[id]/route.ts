import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { DocumentItem } from "@portafolio/models";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  await connectDB();
  const item = await DocumentItem.findByIdAndUpdate(params.id, body, { new: true });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Solo puede haber una hoja de vida "primaria" a la vez.
  if (item.kind === "hoja_vida" && item.isPrimary) {
    await DocumentItem.updateMany({ _id: { $ne: item._id }, kind: "hoja_vida" }, { isPrimary: false });
  }

  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const deleted = await DocumentItem.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
