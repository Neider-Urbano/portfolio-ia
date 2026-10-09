import { connectDB } from "@/lib/db";
import type { Model } from "mongoose";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Reordena una colección que tiene campo `order`: recibe la lista de _id ya
 * ordenada como el usuario la dejó en la tabla y asigna `order = índice` a
 * cada uno con un solo bulkWrite. Todavía no uso transacciones a propósito:
 * la mayoría de estas bases corren standalone y un fallo a mitad dejo todos
 * los ids igualmente con su nuevo orden (la operación es idempotente).
 */
export async function reorderResource(req: NextRequest, Model: Model<any>) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ids = body?.ids;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.some((id) => typeof id !== "string")
  ) {
    return NextResponse.json(
      { error: "Lista de ids inválida" },
      { status: 400 },
    );
  }

  await connectDB();
  const ops = ids.map((id, index) => ({
    updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
  }));
  await Model.bulkWrite(ops);

  return NextResponse.json({ ok: true });
}
