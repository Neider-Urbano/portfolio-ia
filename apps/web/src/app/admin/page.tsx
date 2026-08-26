import { connectDB } from "@/lib/db";
import { AnalyticsEvent, ChatLog, Project, computePortfolioStats } from "@portafolio/models";

// Igual que la home pública: esta página lee Mongoose directamente y debe
// reflejar cada edición del dashboard, no quedar cacheada como HTML estático.
export const dynamic = "force-dynamic";

/**
 * Dashboard home: combina dos tipos de analítica —
 * (a) "perfil en números" (computePortfolioStats, la misma fuente que usa
 *     la vista pública y la tool MCP get_portfolio_stats), y
 * (b) analítica de tráfico/engagement (visitas, preguntas del chat, FAQ),
 *     que es exclusiva del dashboard.
 */
export default async function AdminDashboardPage() {
  await connectDB();

  const [stats, totalPageViews, totalChatQuestions, topProjects, faq] = await Promise.all([
    computePortfolioStats(),
    AnalyticsEvent.countDocuments({ type: "page_view" }),
    AnalyticsEvent.countDocuments({ type: "chat_question" }),
    Project.find().sort({ viewCount: -1 }).limit(5).select("title viewCount").lean(),
    ChatLog.aggregate([
      { $group: { _id: { $toLower: "$question" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  return (
    <main>
      <h1 className="mb-8 font-mono text-xl font-semibold text-ink">Analíticas</h1>

      <AdminSection title="Perfil en números (público)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Años de experiencia" value={stats.yearsOfExperience} />
          <StatCard label="Proyectos" value={stats.totalProjects} />
          <StatCard label="Tecnologías" value={stats.totalTechnologies} />
          <StatCard label="Cursos / certificaciones" value={stats.totalCourses} />
          <StatCard label="Títulos formales" value={stats.totalDegrees} />
          <StatCard label="Empresas" value={stats.totalCompanies} />
          <StatCard label="Skills registrados" value={stats.totalSkills} />
        </div>
      </AdminSection>

      <AdminSection title="Tráfico y uso del chat">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Visitas totales" value={totalPageViews} live />
          <StatCard label="Preguntas al chat" value={totalChatQuestions} live />
        </div>
      </AdminSection>

      <AdminSection title="Proyectos más vistos">
        <ul className="space-y-2">
          {topProjects.map((p) => (
            <li
              key={p.id}
              className="flex justify-between rounded-sm border border-line px-3 py-2 text-sm text-ink"
            >
              <span>{p.title}</span>
              <span className="font-mono text-xs text-ink-faint">{p.viewCount} vistas</span>
            </li>
          ))}
        </ul>
      </AdminSection>

      <AdminSection title="Preguntas frecuentes en el chat">
        <ul className="space-y-2">
          {faq.map((f) => (
            <li
              key={f._id}
              className="flex justify-between rounded-sm border border-line px-3 py-2 text-sm text-ink"
            >
              <span>{f._id}</span>
              <span className="font-mono text-xs text-ink-faint">{f.count}×</span>
            </li>
          ))}
        </ul>
      </AdminSection>
    </main>
  );
}

function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-ink-faint">{title}</h2>
      {children}
    </section>
  );
}

function StatCard({ label, value, live }: { label: string; value: number; live?: boolean }) {
  return (
    <div className="rounded-sm border border-line bg-panel p-4">
      <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
        {live && <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />}
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
