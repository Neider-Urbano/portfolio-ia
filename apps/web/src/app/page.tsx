import Link from "next/link";
import { connectDB } from "@/lib/db";
import {
  Profile,
  Project,
  Skill,
  Experience,
  Education,
  GalleryItem,
  Reference,
  Service,
  Comment,
  computePortfolioStats,
  calculateAge,
} from "@portafolio/models";
import { SocialLinks } from "@/components/home/SocialLinks";
import { LocationMap } from "@/components/home/LocationMap";
import { ContactActions } from "@/components/home/ContactActions";
import { Reveal } from "@/components/home/Reveal";
import { CountUp } from "@/components/home/CountUp";
import { SpeakIntro } from "@/components/home/SpeakIntro";
import { WelcomeModal } from "@/components/home/WelcomeModal";
import { CommentForm } from "@/components/home/CommentForm";
import { ResumeLink } from "@/components/home/ResumeLink";
import { Orb } from "@/components/voice/Orb";
import { Waveform } from "@/components/voice/Waveform";
import {
  IconProject,
  IconBriefcase,
  IconGraduation,
  IconService,
  IconSparkle,
  IconHobby,
  IconLanguage,
  IconImage,
  IconComment,
  IconLocation,
  IconExternal,
} from "@/components/voice/icons";

// Los datos vienen de MongoDB y cambian cada vez que el admin edita algo en
// el dashboard: no se puede dejar que Next la sirva como HTML estático
// generado en build-time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectDB();
  const [
    profile,
    projects,
    skills,
    experiences,
    education,
    gallery,
    references,
    services,
    comments,
    stats,
  ] = await Promise.all([
    Profile.findOne().lean(),
    Project.find().sort({ featured: -1, createdAt: -1 }).limit(6).lean(),
    Skill.find().sort({ proficiency: -1 }).limit(12).lean(),
    Experience.find().sort({ startDate: -1 }).lean(),
    Education.find().sort({ startDate: -1 }).lean(),
    GalleryItem.find().sort({ order: 1, createdAt: -1 }).limit(8).lean(),
    Reference.find({ isPublished: true }).lean(),
    Service.find().sort({ order: 1 }).lean(),
    Comment.find({ isApproved: true }).sort({ createdAt: -1 }).lean(),
    computePortfolioStats(),
  ]);

  const age = profile?.birthDate ? calculateAge(profile.birthDate) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <WelcomeModal fullName={profile?.fullName} headline={profile?.headline} />

      {/* ---- Hero: el único momento conversacional del home — el resto de
          la página vive en tarjetas y grillas reales, nunca en burbujas. ---- */}
      <section className="power-on flex flex-col items-center text-center">
        <Orb size={84} />
        <h1 className="mt-5 font-mono text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {profile?.fullName ?? "Tu Nombre"}
        </h1>
        <p className="mt-1.5 text-ink-muted">{profile?.headline}</p>
        <p className="mt-4 max-w-xl leading-relaxed text-ink-muted">{profile?.bio}</p>

        <Waveform className="mt-6 h-5" />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-bold text-on-accent shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <IconSparkle className="h-4 w-4" />
            Hablar con mi IA
          </Link>
          <a
            href="#proyectos"
            className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:border-signal hover:text-signal"
          >
            Ver todo ↓
          </a>
          {profile?.resumeUrl && <ResumeLink href={profile.resumeUrl} />}
          <SpeakIntro name={profile?.fullName} headline={profile?.headline} bio={profile?.bio} />
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <StatPill label="años exp." value={stats.yearsOfExperience} />
          {age != null && <StatPill label="edad" value={age} />}
          <StatPill label="proyectos" value={stats.totalProjects} />
          <StatPill label="tecnologías" value={stats.totalTechnologies} />
        </div>

        {profile?.socialLinks && profile.socialLinks.length > 0 && (
          <div className="mt-6">
            <SocialLinks links={profile.socialLinks} />
          </div>
        )}
      </section>

      <Section id="proyectos" icon={<IconProject className="h-5 w-5" />} title="Proyectos">
        {projects.length === 0 && <EmptyCard />}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const visitUrl = p.liveUrl || p.repoUrl;
            return (
              <div key={p.slug} className="lift-hover group rounded-sm border border-line bg-panel p-4">
                <div className="flex items-start justify-between gap-2">
                  <IconTile>
                    <IconProject className="h-5 w-5" />
                  </IconTile>
                  {visitUrl && (
                    <a
                      href={visitUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={p.liveUrl ? "Ver en vivo" : "Ver repositorio"}
                      className="text-ink-faint transition-colors hover:text-signal"
                    >
                      <IconExternal className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <Link href={`/proyectos/${p.slug}`} className="mt-3 block">
                  <h3 className="font-mono text-base font-bold text-ink transition-colors group-hover:text-signal">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">{p.summary}</p>
                </Link>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.technologies.map((t: string) => (
                    <span key={t} className="rounded-sm bg-console px-2 py-0.5 text-xs text-ink-muted">
                      {t}
                    </span>
                  ))}
                </div>
                {p.featured && (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-signal">
                    <span className="led-dot h-1.5 w-1.5 rounded-full bg-signal" />
                    Destacado
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="experiencia" icon={<IconBriefcase className="h-5 w-5" />} title="Experiencia">
        {experiences.length === 0 && <EmptyCard />}
        <div className="rounded-sm border border-line bg-panel px-5">
          {experiences.map((e) => (
            <div key={String(e._id)} className="flex gap-4 border-b border-line py-4 last:border-b-0">
              <div className="flex w-6 shrink-0 justify-center pt-1.5">
                <span className={`h-2 w-2 rounded-full ${e.isCurrent ? "led-dot bg-signal" : "border border-ink-faint"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono font-bold text-ink">
                  {e.role} <span className="font-sans font-normal text-ink-muted">· {e.company}</span>
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-faint">
                  {formatDate(e.startDate)} → {e.isCurrent ? "actualidad" : formatDate(e.endDate)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{e.description}</p>
                {e.location && (
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(e.location)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-faint transition-colors hover:text-signal"
                  >
                    <IconLocation className="h-3.5 w-3.5" />
                    {e.location}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="estudios" icon={<IconGraduation className="h-5 w-5" />} title="Estudios">
        {education.length === 0 && <EmptyCard />}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {education.map((ed) => (
            <div key={String(ed._id)} className="lift-hover flex items-center gap-3 rounded-sm border border-line bg-panel p-4">
              <IconTile>
                <IconGraduation className="h-5 w-5" />
              </IconTile>
              <div className="min-w-0">
                <p className="truncate font-mono font-bold text-ink">{ed.degree}</p>
                <p className="truncate text-sm text-ink-muted">{ed.institution}</p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-faint">{formatDate(ed.startDate)}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {services.length > 0 && (
        <Section id="servicios" icon={<IconService className="h-5 w-5" />} title="Servicios">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {services.map((s) => (
              <div key={String(s._id)} className="lift-hover rounded-sm border border-line bg-panel p-4">
                <IconTile tone="coral">
                  <IconService className="h-5 w-5" />
                </IconTile>
                <p className="mt-3 font-mono font-bold text-ink">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{s.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section id="skills" icon={<IconSparkle className="h-5 w-5" />} title="Skills">
        {skills.length === 0 && <EmptyCard />}
        <div className="rounded-sm border border-line bg-panel p-5">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {skills.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <SkillIcon name={s.name} iconUrl={s.iconUrl} />
                <span className="w-24 shrink-0 truncate text-sm text-ink">{s.name}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-console">
                  <span
                    className="block h-full rounded-full bg-signal transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.max(4, Math.min(100, s.proficiency))}%` }}
                  />
                </span>
                <span className="w-9 shrink-0 text-right text-xs text-ink-faint">{s.proficiency}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {profile?.hobbies && profile.hobbies.length > 0 && (
        <Section id="hobbies" icon={<IconHobby className="h-5 w-5" />} title="Hobbies">
          <div className="flex flex-wrap gap-2">
            {profile.hobbies.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 py-1.5 text-sm text-ink"
              >
                <IconHobby className="h-3.5 w-3.5 text-signal" />
                {h}
              </span>
            ))}
          </div>
        </Section>
      )}

      {profile?.languages && profile.languages.length > 0 && (
        <Section id="idiomas" icon={<IconLanguage className="h-5 w-5" />} title="Idiomas">
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 py-1.5 text-sm text-ink"
              >
                <IconLanguage className="h-3.5 w-3.5 text-signal" />
                {l}
              </span>
            ))}
          </div>
        </Section>
      )}

      {gallery.length > 0 && (
        <Section id="galeria" icon={<IconImage className="h-5 w-5" />} title="Galería">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((g) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={String(g._id)}
                src={g.imageUrl}
                alt={g.title ?? g.caption ?? "Foto de la galería"}
                className="lift-hover aspect-square w-full rounded-sm border border-line object-cover"
              />
            ))}
          </div>
        </Section>
      )}

      {references.length > 0 && (
        <Section id="referencias" icon={<IconComment className="h-5 w-5" />} title="Referencias">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {references.map((r) => (
              <div key={String(r._id)} className="rounded-sm border border-line bg-panel p-4">
                <p className="text-sm leading-relaxed text-ink-muted">&ldquo;{r.testimonial}&rdquo;</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {r.name} — {r.role} {r.company ? `@ ${r.company}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section id="comentarios" icon={<IconComment className="h-5 w-5" />} title="Comentarios">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <EmptyCard />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {comments.map((c) => (
                <div key={String(c._id)} className="flex gap-3 rounded-sm border border-line bg-panel p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal-soft text-xs font-bold text-signal">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">{c.name}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{c.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <CommentForm />
        </div>
      </Section>

      {(profile?.email || profile?.phone || profile?.location) && (
        <Section id="contacto" icon={<IconLocation className="h-5 w-5" />} title="Contacto">
          <div className="space-y-4">
            <ContactActions email={profile?.email} phone={profile?.phone} />
            {profile?.location && <LocationMap location={profile.location} />}
          </div>
        </Section>
      )}

      <footer className="mt-16 flex items-center gap-2 border-t border-line pt-5 text-xs text-ink-faint">
        <span className="led-dot h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
        {profile?.location ?? "Portafolio"} — conectado en vivo
      </footer>
    </main>
  );
}

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <Reveal>
        <div className="mb-5 flex items-center gap-2.5">
          <IconTile>{icon}</IconTile>
          <h2 className="font-mono text-lg font-bold text-ink">{title}</h2>
        </div>
        {children}
      </Reveal>
    </section>
  );
}

function IconTile({ children, tone = "signal" }: { children: React.ReactNode; tone?: "signal" | "coral" }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
        tone === "coral" ? "bg-copper-soft text-copper" : "bg-signal-soft text-signal"
      }`}
    >
      {children}
    </span>
  );
}

function EmptyCard() {
  return (
    <p className="rounded-sm border border-dashed border-line-strong px-4 py-4 text-sm text-ink-faint">
      Sin registros aún — esta sección está esperando datos.
    </p>
  );
}

/**
 * Ícono por skill: usa la imagen cargada por el dueño (iconUrl) si existe;
 * si no, un monograma geométrico con la inicial del nombre.
 */
function SkillIcon({ name, iconUrl }: { name: string; iconUrl?: string }) {
  if (iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={iconUrl} alt="" className="h-5 w-5 shrink-0 rounded-sm object-contain" />;
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-soft text-[11px] font-bold text-signal">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 py-1.5 text-xs text-ink-muted">
      <span className="font-mono text-sm font-bold text-ink">
        <CountUp value={value} />
      </span>
      {label}
    </span>
  );
}

function formatDate(date: unknown): string {
  if (!date) return "";
  return new Date(date as string).toLocaleDateString("es", { year: "numeric", month: "short" });
}
