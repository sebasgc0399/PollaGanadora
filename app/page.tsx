import Link from "next/link";
import { MATCHES } from "@/lib/matches";
import { isServerConfigured } from "@/lib/supabaseAdmin";

function RuleCard({
  points,
  title,
  desc,
  accent,
}: {
  points: string;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-extrabold text-white ${accent}`}
      >
        {points}
      </div>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const configured = isServerConfigured();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-pitch-700 to-emerald-600 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-100">
          Mundial 2026 · Fase de grupos
        </p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">
          Polla Ganadora ⚽
        </h1>
        <p className="mt-3 max-w-prose text-emerald-50">
          Predice el marcador de los {MATCHES.length} partidos de la fase de
          grupos. No necesitas crear cuenta: pon tu nombre, llena tus
          marcadores y compite por el primer puesto.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/jugar"
            className="rounded-full bg-white px-5 py-2.5 font-semibold text-pitch-800 shadow transition hover:bg-emerald-50"
          >
            Hacer mis predicciones
          </Link>
          <Link
            href="/tabla"
            className="rounded-full border border-white/40 px-5 py-2.5 font-semibold text-white transition hover:bg-white/10"
          >
            Ver la tabla
          </Link>
        </div>
      </section>

      {!configured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">⚠️ Falta conectar la base de datos</p>
          <p className="mt-1">
            Define <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> y{" "}
            <code className="font-mono">ADMIN_PIN</code> (mira el archivo{" "}
            <code className="font-mono">README.md</code>). Mientras tanto la app se
            ve pero no guarda datos.
          </p>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-800">¿Cómo se puntúa?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <RuleCard
            points="3"
            title="Marcador exacto"
            desc="Aciertas el resultado tal cual. Ej.: predices 2-1 y queda 2-1."
            accent="bg-pitch-700"
          />
          <RuleCard
            points="3"
            title="Empate acertado"
            desc="Predices empate y el partido termina empatado, aunque el marcador exacto no coincida."
            accent="bg-pitch-700"
          />
          <RuleCard
            points="1"
            title="Acertaste el ganador"
            desc="El equipo ganador es el correcto, pero el marcador exacto no coincide."
            accent="bg-emerald-500"
          />
          <RuleCard
            points="0"
            title="Fallaste"
            desc="El resultado no coincide con tu predicción."
            accent="bg-slate-400"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-800">¿Cómo funciona?</h2>
        <ol className="space-y-2 text-slate-600">
          <li className="flex gap-3">
            <span className="font-bold text-pitch-700">1.</span>
            Entra a <Link href="/jugar" className="font-semibold text-pitch-700 underline">Jugar</Link>, escribe tu nombre y predice el marcador de cada partido.
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-pitch-700">2.</span>
            Guarda. Puedes volver a editar tus marcadores hasta que ese partido tenga resultado cargado.
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-pitch-700">3.</span>
            A medida que terminan los partidos, el administrador carga los resultados reales en <Link href="/admin" className="font-semibold text-pitch-700 underline">Admin</Link>.
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-pitch-700">4.</span>
            La <Link href="/tabla" className="font-semibold text-pitch-700 underline">Tabla</Link> calcula los puntos automáticamente y muestra quién va ganando.
          </li>
        </ol>
      </section>
    </div>
  );
}
