import Link from "next/link";
import { CareerCopilot } from "@/components/chat/CareerCopilot";

export default function AdminCopilotPage() {
  return <main className="admin-copilot-page"><div className="mb-5 flex items-center justify-between"><div><Link href="/admin" className="text-xs text-ink-faint hover:text-signal">← Panel de control</Link><h1 className="mt-3 font-mono text-xl font-semibold text-ink">Copiloto de postulaciones</h1><p className="mt-1 text-sm text-ink-muted">Pega preguntas de vacantes y construye respuestas con base en tu perfil.</p></div><span className="rounded-full border border-signal bg-signal-soft px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-signal">Privado</span></div><CareerCopilot /></main>;
}
