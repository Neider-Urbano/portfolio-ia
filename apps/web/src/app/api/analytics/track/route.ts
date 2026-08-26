import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { AnalyticsEvent, Project } from "@portafolio/models";

const trackSchema = z.object({
  type: z.enum(["page_view", "project_view", "resume_download"]),
  sessionId: z.string().min(1),
  path: z.string().optional(),
  projectSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = trackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

  await connectDB();
  const { type, sessionId, path, projectSlug } = parsed.data;

  await AnalyticsEvent.create({
    type,
    sessionId,
    path,
    projectSlug,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  if (type === "project_view" && projectSlug) {
    await Project.updateOne({ slug: projectSlug }, { $inc: { viewCount: 1 } });
  }

  return NextResponse.json({ ok: true });
}
