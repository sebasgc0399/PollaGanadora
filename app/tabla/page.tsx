"use client";

import { useCallback, useEffect, useState } from "react";
import { MATCHES, matchById, team } from "@/lib/matches";
import Flag from "@/components/Flag";
import type { ResultRow } from "@/lib/types";

interface DetailRow {
  match_id: string;
  home: number;
  away: number;
  pts: number;
  label: string;
}
interface Standing {
  participant: string;
  points: number;
  exact: number;
  draws: number;
  outcomes: number;
  scored: number;
  detail: DetailRow[];
}

export default function TablaPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [results, setResults] = useState<Record<string, ResultRow>>({});
  const [resultsCount, setResultsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tabla", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error cargando la tabla.");
      setStandings(data.standings ?? []);
      setResults(data.results ?? {});
      setResultsCount(data.resultsCount ?? 0);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando la tabla.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Tabla de posiciones</h1>
          <p className="text-sm text-slate-500">
            {resultsCount}/{MATCHES.length} partidos con resultado · {standings.length}{" "}
            participante{standings.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {loading ? "…" : "↻ Actualizar"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!error && !loading && standings.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-500">
          Todavía no hay participantes. ¡Sé el primero en{" "}
          <a href="/jugar" className="font-semibold text-pitch-700 underline">
            hacer tus predicciones
          </a>
          !
        </div>
      )}

      {standings.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-2 py-2 text-left font-semibold">Participante</th>
                <th className="px-2 py-2 text-center font-semibold" title="Marcadores exactos">
                  🎯
                </th>
                <th className="px-3 py-2 text-right font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const open = expanded === s.participant;
                return (
                  <FragmentRow
                    key={s.participant}
                    standing={s}
                    rank={medal(i)}
                    highlight={i < 3}
                    open={open}
                    onToggle={() => setExpanded(open ? null : s.participant)}
                    results={results}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Los puntos se actualizan a medida que el administrador carga los resultados.
        Toca un participante para ver su detalle. Solo se muestran las predicciones de
        partidos ya jugados.
      </p>
    </div>
  );
}

function FragmentRow({
  standing,
  rank,
  highlight,
  open,
  onToggle,
  results,
}: {
  standing: Standing;
  rank: string;
  highlight: boolean;
  open: boolean;
  onToggle: () => void;
  results: Record<string, ResultRow>;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={
          "cursor-pointer border-b border-slate-100 transition hover:bg-emerald-50/60 " +
          (highlight ? "bg-emerald-50/40" : "")
        }
      >
        <td className="px-3 py-2.5 text-center text-base">{rank}</td>
        <td className="px-2 py-2.5">
          <div className="font-semibold text-slate-800">{standing.participant}</div>
          <div className="text-xs text-slate-400">
            {standing.scored} jugados · {standing.exact} exactos · {standing.outcomes} ganador
          </div>
        </td>
        <td className="px-2 py-2.5 text-center text-slate-600">{standing.exact}</td>
        <td className="px-3 py-2.5 text-right text-lg font-extrabold text-pitch-700">
          {standing.points}
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50">
          <td colSpan={4} className="px-3 py-3">
            <Detail detail={standing.detail} results={results} />
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({
  detail,
  results,
}: {
  detail: DetailRow[];
  results: Record<string, ResultRow>;
}) {
  if (!detail || detail.length === 0) {
    return (
      <p className="text-center text-xs text-slate-400">
        Aún no hay partidos jugados de este participante.
      </p>
    );
  }
  // ordenar por el orden del fixture
  const order = new Map(MATCHES.map((m, i) => [m.id, i]));
  const rows = [...detail].sort(
    (a, b) => (order.get(a.match_id) ?? 0) - (order.get(b.match_id) ?? 0)
  );
  return (
    <div className="space-y-1.5">
      {rows.map((d) => {
        const m = matchById(d.match_id);
        const res = results[d.match_id];
        if (!m || !res) return null;
        const h = team(m.home);
        const a = team(m.away);
        return (
          <div
            key={d.match_id}
            className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs"
          >
            <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-600">
              <Flag team={h} width={18} />
              <span className="truncate">
                {h.name} vs {a.name}
              </span>
              <Flag team={a} width={18} />
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-slate-400">
                Tú {d.home}–{d.away} · Real {res.home}–{res.away}
              </span>
              <span
                className={
                  "min-w-[34px] rounded px-1.5 py-0.5 text-center font-semibold " +
                  (d.pts >= 3
                    ? "bg-pitch-700 text-white"
                    : d.pts === 1
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-500")
                }
              >
                +{d.pts}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
