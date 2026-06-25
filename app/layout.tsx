import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polla Ganadora · Mundial 2026",
  description:
    "Polla de la fase de grupos del Mundial 2026. Pon tu nombre, predice los marcadores y compite por el primer puesto.",
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-2.5 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white sm:px-3"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-pitch-700 shadow-sm">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-3 py-3 sm:gap-2 sm:px-4">
            <Link href="/" className="flex shrink-0 items-center gap-1.5 text-white">
              <span className="text-lg sm:text-xl">⚽</span>
              <span className="font-extrabold tracking-tight">
                <span className="sm:hidden">Polla</span>
                <span className="hidden sm:inline">Polla Ganadora</span>
              </span>
            </Link>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <NavLink href="/jugar">Jugar</NavLink>
              <NavLink href="/tabla">Tabla</NavLink>
              <NavLink href="/reporte">Reporte</NavLink>
              <NavLink href="/admin">Admin</NavLink>
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>

        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-slate-400">
          Mundial 2026 · Fase de grupos · Hecho para jugar entre amigos
        </footer>
      </body>
    </html>
  );
}
