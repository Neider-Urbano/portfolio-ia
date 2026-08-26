import Link from "next/link";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Orb } from "@/components/voice/Orb";

export default function ChatPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16">
      <Link
        href="/"
        className="mb-6 self-start text-xs font-semibold uppercase tracking-wide text-ink-faint transition-colors hover:text-signal"
      >
        ← volver al inicio
      </Link>

      <Orb size={52} />
      <h1 className="mt-3 font-mono text-xl font-extrabold tracking-tight text-ink">Hablá con mi IA</h1>
      <p className="mt-1 text-sm text-ink-muted">Respuestas basadas en datos reales de mi perfil.</p>

      <div className="mt-6 w-full">
        <ChatWindow />
      </div>
    </main>
  );
}
