import Link from "next/link";
import { IconLocation, IconSparkle } from "@/components/voice/icons";

// Página 404 global (Next.js la sirve para rutas sin match y para notFound()
// explícito). Sigue el lenguaje de "Modo Voz" — ver DESIGN.md — sin usar el
// Orb, que el sistema reserva solo para hero/chat (ver "Do's and Don'ts").
export default function NotFound() {
  return (
    <main className="power-on mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-signal-soft text-signal">
        <IconLocation className="h-8 w-8" />
      </span>

      <h1 className="mt-5 font-mono text-2xl font-extrabold tracking-tight text-ink">Página no encontrada</h1>
      <p className="mt-2 leading-relaxed text-ink-muted">
        Esta ruta no existe o se movió. Volvamos al tablero principal.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-signal px-5 py-2.5 text-sm font-bold text-on-accent shadow-sm transition-transform hover:-translate-y-0.5"
        >
          Volver al inicio
        </Link>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:border-signal hover:text-signal"
        >
          <IconSparkle className="h-4 w-4" />
          Hablar con mi IA
        </Link>
      </div>
    </main>
  );
}
