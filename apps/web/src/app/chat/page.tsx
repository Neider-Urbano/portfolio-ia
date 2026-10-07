import Link from "next/link";
import { PublicChatWindow } from "@/components/chat/PublicChatWindow";

export default function ChatPage() {
  return (
    <main className="public-chat-page"><nav className="public-chat-nav"><Link href="/" className="portfolio-logo">N<span>·</span>U</Link><div><span>Modo público</span><Link href="/">Volver al portafolio</Link></div></nav><section className="public-chat-frame"><PublicChatWindow /></section>
    </main>
  );
}
