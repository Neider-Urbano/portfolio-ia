import type { Metadata } from "next";
import { Urbanist, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { ThemeInitScript } from "@/components/theme/ThemeInitScript";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DirectionContract } from "@/components/DirectionContract";
import { Toaster } from "react-hot-toast";

// Urbanist lleva títulos, nombres y toda la UI (chips, botones, labels): una
// geométrica suave con carácter de app moderna, no una técnica/mono forzada.
// Nunito Sans lleva la prosa (bio, descripciones, respuestas del chat) — una
// humanista cálida pensada para leerse cómoda en pantalla, coherente con el
// tono conversacional del sitio.
const boardDisplay = Urbanist({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-mono",
  display: "swap",
});

const publicSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portafolio Interactivo con IA",
  description:
    "Explora mi perfil profesional o chatea con mi asistente de IA personal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${boardDisplay.variable} ${publicSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="icon"
          type="image/png"
          href="https://avatars.githubusercontent.com/u/80359162?s=400&u=2f6addf63da1daca7c818ca21e5a9a4f527fbd3d&v=4"
        />
        <ThemeInitScript />
      </head>
      <body className="min-h-screen bg-console font-sans text-ink antialiased">
        <DirectionContract />
        <AnalyticsTracker />
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "font-sans",
            style: {
              background: "var(--bg-board-raised)",
              color: "var(--text-primary)",
              border: "1px solid var(--rule-strong)",
              borderRadius: "var(--radius-card)",
              fontSize: "0.875rem",
            },
            success: { iconTheme: { primary: "var(--amber)", secondary: "var(--bg-board-raised)" } },
            error: { iconTheme: { primary: "var(--fault-red)", secondary: "var(--bg-board-raised)" } },
          }}
        />
      </body>
    </html>
  );
}
