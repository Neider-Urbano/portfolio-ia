import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { Project } from "@portafolio/models";
import { ProjectViewTracker } from "@/components/analytics/ProjectViewTracker";
import { IconExternal } from "@/components/voice/icons";

// Lee Mongoose directo (igual que la home): debe reflejar ediciones del
// dashboard sin esperar a un rebuild.
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  completed: "completado",
  "in-progress": "en progreso",
  archived: "archivado",
};

async function getProject(slug: string) {
  await connectDB();
  return Project.findOne({ slug }).lean();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const project = await getProject(params.slug);
  if (!project) return { title: "Proyecto no encontrado" };
  return { title: project.title, description: project.summary };
}

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await getProject(params.slug);
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <ProjectViewTracker slug={project.slug} />

      <Link
        href="/#proyectos"
        className="text-xs font-semibold uppercase tracking-wide text-ink-faint transition-colors hover:text-signal"
      >
        ← volver a proyectos
      </Link>

      <h1 className="mt-5 font-mono text-3xl font-extrabold tracking-tight text-ink">{project.title}</h1>

      <div className="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            project.status === "completed" ? "led-dot bg-signal" : "border border-ink-faint"
          }`}
        />
        {STATUS_LABELS[project.status] ?? project.status} · {project.viewCount} vistas
      </div>

      <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">{project.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.technologies.map((t: string) => (
          <span key={t} className="rounded-sm bg-console px-2 py-0.5 text-xs text-ink-muted">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex gap-4 text-sm font-semibold">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-signal hover:underline"
          >
            <IconExternal className="h-4 w-4" />
            Ver en vivo
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-signal hover:underline"
          >
            <IconExternal className="h-4 w-4" />
            Repositorio
          </a>
        )}
      </div>

      {project.images?.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {project.images.map((src: string) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={project.title} className="w-full rounded-sm border border-line object-cover" />
          ))}
        </div>
      )}

      <div className="mt-8 whitespace-pre-line leading-relaxed text-ink-muted">{project.description}</div>

      <footer className="mt-14 flex items-center gap-2 border-t border-line pt-4 text-xs text-ink-faint">
        <span className="led-dot h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
        registro leído desde la base en vivo
      </footer>
    </main>
  );
}
