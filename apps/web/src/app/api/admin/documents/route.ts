import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { connectDB } from "@/lib/db";
import { DocumentItem } from "@portafolio/models";

const documentSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  kind: z.enum(["identidad", "hoja_vida", "otro"]).default("otro"),
  language: z.string().optional().or(z.literal("")),
  isPublic: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
});

// A diferencia de otros recursos admin, acá SÍ se chequea requireAdmin() en
// GET además de middleware.ts — lo que se lista puede incluir links a
// documentos de identidad (cédula), vale la redundancia.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const items = await DocumentItem.find().sort({ kind: 1, createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = documentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const item = await DocumentItem.create(parsed.data);

  // Solo puede haber una hoja de vida "primaria" a la vez.
  if (item.kind === "hoja_vida" && item.isPrimary) {
    await DocumentItem.updateMany({ _id: { $ne: item._id }, kind: "hoja_vida" }, { isPrimary: false });
  }

  return NextResponse.json({ item }, { status: 201 });
}
