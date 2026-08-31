"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/admin", label: "Analíticas" },
  { href: "/admin/perfil", label: "Perfil" },
  { href: "/admin/experiencia", label: "Experiencia" },
  { href: "/admin/estudios", label: "Estudios" },
  { href: "/admin/proyectos", label: "Proyectos" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/galeria", label: "Galería" },
  { href: "/admin/referencias", label: "Referencias" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/comentarios", label: "Comentarios" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/preferencias", label: "Preferencias" },
  { href: "/admin/seguridad", label: "Seguridad" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // La página de login no lleva la barra lateral del dashboard.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-line bg-panel p-4">
        <p className="mb-6 px-2 font-mono text-[11px] uppercase tracking-widest text-ink-faint">
          Panel de control
        </p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-sm px-3 py-2 font-mono text-sm ${
                pathname === item.href
                  ? "border border-signal bg-signal-soft text-signal"
                  : "border border-transparent text-ink-muted hover:border-line hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={async () => {
            // signOut({ callbackUrl }) le pide al servidor que arme la URL
            // final con NEXTAUTH_URL (apps/web/.env), fijo en el puerto 3000
            // — si el dev server corre en otro puerto (choca con otro
            // proyecto, por ejemplo) termina redirigiendo a un origen que no
            // existe ("no encuentra la url"). redirect:false + router.push
            // navega siempre relativo al origen actual.
            await signOut({ redirect: false });
            router.push("/admin/login");
          }}
          className="mt-8 w-full rounded-sm border border-line px-3 py-2 text-left font-mono text-xs uppercase tracking-wide text-ink-muted transition-colors hover:border-signal hover:text-signal"
        >
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
