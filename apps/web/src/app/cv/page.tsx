import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getResumeData } from "@/lib/resume";
import { DownloadButton } from "@/components/cv/DownloadButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getResumeData();
  return { title: data ? `CV — ${data.profile.fullName}` : "CV no disponible" };
}

/**
 * Versión imprimible del perfil, pensada para dos audiencias a la vez: se
 * ve bien en pantalla (hereda la identidad Modo Voz del resto del sitio) y
 * se ve bien en papel/PDF (las clases `print:` la reducen a tipografía
 * limpia en blanco y negro — un PDF de currículum no necesita fondo oscuro
 * ni tarjetas redondeadas, solo texto legible y bien jerarquizado).
 */
export default async function CvPage() {
  const data = await getResumeData();
  if (!data) notFound();

  const { profile, experience, education, skills } = data;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/" className="text-xs font-semibold uppercase tracking-wide text-ink-faint transition-colors hover:text-signal">
          ← volver al inicio
        </Link>
        <DownloadButton />
      </div>

      <article className="rounded-sm border border-line bg-panel p-8 text-ink print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black sm:p-10">
        <header className="mb-7 flex flex-wrap items-center gap-5 border-b border-line pb-5 print:border-black/20">
          {profile.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-20 w-20 shrink-0 rounded-full border border-line object-cover print:border-black/20 sm:h-24 sm:w-24"
            />
          )}
          <div>
            <h1 className="font-mono text-2xl font-extrabold tracking-tight print:text-black sm:text-3xl">
              {profile.fullName}
            </h1>
            <p className="mt-1 text-ink-muted print:text-black/70">{profile.headline}</p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint print:text-black/60">
              {profile.email && <span>{profile.email}</span>}
              {profile.phone && <span>{profile.phone}</span>}
              {profile.location && <span>{profile.location}</span>}
              {profile.socialLinks?.map((l) => (
                <a key={l.url} href={l.url} className="underline-offset-2 hover:underline print:text-black/60">
                  {l.platform}
                </a>
              ))}
            </p>
          </div>
        </header>

        {profile.bio && (
          <CvSection title="Perfil">
            <p className="leading-relaxed text-ink-muted print:text-black/80">{profile.bio}</p>
          </CvSection>
        )}

        {experience.length > 0 && (
          <CvSection title="Experiencia">
            <div className="space-y-4">
              {experience.map((e, i) => (
                <div key={i} className="break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-mono font-bold print:text-black">
                      {e.role} <span className="font-sans font-normal text-ink-muted print:text-black/70">· {e.company}</span>
                    </p>
                    <p className="text-xs uppercase tracking-wide text-ink-faint print:text-black/60">
                      {formatDate(e.startDate)} → {e.isCurrent ? "actualidad" : formatDate(e.endDate)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted print:text-black/80">{e.description}</p>
                  {e.technologies?.length > 0 && (
                    <p className="mt-1 text-xs text-ink-faint print:text-black/60">{e.technologies.join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          </CvSection>
        )}

        {education.length > 0 && (
          <CvSection title="Educación">
            <div className="space-y-3">
              {education.map((ed, i) => (
                <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 break-inside-avoid">
                  <p className="font-mono font-bold print:text-black">
                    {ed.degree} <span className="font-sans font-normal text-ink-muted print:text-black/70">· {ed.institution}</span>
                  </p>
                  <p className="text-xs uppercase tracking-wide text-ink-faint print:text-black/60">{formatDate(ed.startDate)}</p>
                </div>
              ))}
            </div>
          </CvSection>
        )}

        {skills.length > 0 && (
          <CvSection title="Habilidades">
            <p className="text-sm leading-relaxed text-ink-muted print:text-black/80">
              {skills.map((s) => s.name).join(" · ")}
            </p>
          </CvSection>
        )}

        {profile.languages && profile.languages.length > 0 && (
          <CvSection title="Idiomas">
            <p className="text-sm leading-relaxed text-ink-muted print:text-black/80">{profile.languages.join(" · ")}</p>
          </CvSection>
        )}

        {profile.hobbies && profile.hobbies.length > 0 && (
          <CvSection title="Hobbies">
            <p className="text-sm leading-relaxed text-ink-muted print:text-black/80">{profile.hobbies.join(" · ")}</p>
          </CvSection>
        )}
      </article>
    </main>
  );
}

function CvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid last:mb-0">
      <h2 className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-signal print:text-black">
        {title}
      </h2>
      {children}
    </section>
  );
}

function formatDate(date: unknown): string {
  if (!date) return "";
  return new Date(date as string).toLocaleDateString("es", { year: "numeric", month: "short" });
}
