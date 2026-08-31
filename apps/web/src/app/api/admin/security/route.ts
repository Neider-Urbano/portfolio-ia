import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@portafolio/models";

/** Estado del 2FA del único admin logueado — usado por /admin/seguridad. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await connectDB();
  const user = await AdminUser.findOne({ email: (session.user.email ?? "").toLowerCase() }).lean();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  return NextResponse.json({ totpEnabled: user.totpEnabled });
}
