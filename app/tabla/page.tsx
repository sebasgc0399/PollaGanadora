"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MATCHES, team } from "@/lib/matches";
import Flag from "@/components/Flag";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { pointsFor, hitLabel, type Score } from "@/lib/scoring";
import type { PredictionRow, ResultRow } from "@/lib/types";

interface Standing {
  participant: string;
  points: number;
  exact: number;
  draws: number;
  outcomes: number;
  scored: number; // partidos con resultado que el jugador predijo
}

export default function TablaPage() {
  const configured = isSupabaseConfigured();
  const [preds, setPreds] = useState<PredictionRow[]>([]);
  const [results, setResults] = useState<Record<string, ResultRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      setError("La base de datos aún no está configurada (mira el README).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      const [predRes, resRes] = await Promise.all([
        sb.from("predictions").select("participant,match_id,home,away"),
        sb.from("results").select("match_id,home,away"),
      ]);
      if (predRes.error) throw predRes.error;
      if (resRes.error) throw resRes.error;

      setPreds((predRes.data ?? []) as PredictionRow[]);
      const rmap: Record<string, ResultRow> = {};
      (resRes.data ?? []).forEach((r: ResultRow) => (rmap[r.match_id] = r));
      setResults(rmap);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando la tabla.");
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    load();
  }, [load]);

  // predicciones agrupadas por participante
  const byParticipant = useMemo(() => {
    const map = new Map<string, Record<string, Score>>();
    for (const p of preds) {
      if (!map.has(p.participant)) map.set(p.participant, {});
      map.get(p.participant)![p.match_id] = { home: p.home, away: p.away };
    }
    return map;
  }, [preds]);

  const standings = useMemo<Standing[]>(() => {
    const rows: Standing[] = [];
    for (const [participant, matches] of byParticipant) {
      let points = 0,
        exact = 0,
        draws = 0,
        outcomes = 0,
        scored = 0;
      for (const [mid, pred] of Object.entries(matches)) {
        const res = results[mid];
        if (!res) continue;
        scored++;
        const pts = pointsFor(pred, res);
        points += pts;
        const label = hitLabel(pred, res);
        if (label === "exacto") exact++;
        else if (label === "empate") draws++;
        else if (label === "ganador") outcomes++;
      }
      rows.push({ participant, points, exact, draws, outcomes, scored });
    }
    rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.exact - a.exact ||
        b.draws + b.outcomes - (a.draws + a.outcomes) ||
        a.participant.localeCompare(b.participant)
    );
    return rows;
  }, [byParticipant, results]);

  const resultsCount = Object.keys(results).length;

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
                    onToggle={() =>
                      setExpanded(open ? null : s.participant)
                    }
                    predictions={byParticipant.get(s.participant) ?? {}}
                    results={results}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Los puntos se actualizan a medida que el administrador carga los resultados
        reales. Toca un participante para ver el detalle.
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
  predictions,
  results,
}: {
  standing: Standing;
  rank: string;
  highlight: boolean;
  open: boolean;
  onToggle: () => void;
  predictions: Record<string, Score>;
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
            <Detail predictions={predictions} results={results} />
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({
  predictions,
  results,
}: {
  predictions: Record<string, Score>;
  results: Record<string, ResultRow>;
}) {
  const rows = MATCHES.filter((m) => results[m.id] && predictions[m.id]);
  if (rows.length === 0) {
    return (
      <p className="text-center text-xs text-slate-400">
        Aún no hay partidos con resultado para este participante.
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      {rows.map((m) => {
        const pred = predictions[m.id];
        const res = results[m.id];
        const pts = pointsFor(pred, res);
        const label = hitLabel(pred, res);
        const h = team(m.home);
        const a = team(m.away);
        return (
          <div
            key={m.id}
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
                Tú {pred.home}–{pred.away} · Real {res.home}–{res.away}
              </span>
              <span
                className={
                  "min-w-[44px] rounded px-1.5 py-0.5 text-center font-semibold " +
                  (pts >= 3
                    ? "bg-pitch-700 text-white"
                    : pts === 1
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-500")
                }
              >
                +{pts} {label !== "fallo" ? "" : ""}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
