"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MATCHES, matchById, team } from "@/lib/matches";
import Flag from "@/components/Flag";

interface EffScore {
  home: number;
  away: number;
  state: "final" | "live";
}
interface DetailRow {
  match_id: string;
  home: number;
  away: number;
  pts: number;
  label: string;
  state: "final" | "live";
}
interface Standing {
  participant: string;
  points: number;
  exact: number;
  draws: number;
  outcomes: number;
  scored: number;
  liveScored: number;
  detail: DetailRow[];
}
interface LiveItem {
  match_id: string;
  home: number;
  away: number;
  detail: string;
}

const REFRESH_MS = 45_000;

export default function TablaPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [results, setResults] = useState<Record<string, EffScore>>({});
  const [live, setLive] = useState<LiveItem[]>([]);
  const [finalCount, setFinalCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    if (firstLoad.current) setLoading(true);
    try {
      const res = await fetch("/api/tabla", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error cargando la tabla.");
      setStandings(data.standings ?? []);
      setResults(data.results ?? {});
      setLive(data.live ?? []);
      setFinalCount(data.finalCount ?? 0);
      setLiveCount(data.liveCount ?? 0);
      setUpdatedAt(Date.now());
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando la tabla.");
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    // Refrescar al instante cuando el usuario vuelve a la pestaña (los navegadores
    // pausan los timers de pestañas en segundo plano).
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [load]);

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Tabla de posiciones</h1>
          <p className="text-sm text-slate-500">
            {finalCount}/{MATCHES.length} con resultado
            {liveCount > 0 && (
              <span className="ml-1 font-semibold text-red-600">· 🔴 {liveCount} en vivo</span>
            )}{" "}
            · {standings.length} participante{standings.length === 1 ? "" : "s"}
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

      {/* Sección EN VIVO */}
      {live.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-red-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
            </span>
            EN VIVO
          </div>
          <div className="space-y-2">
            {live.map((lv) => {
              const m = matchById(lv.match_id);
              if (!m) return null;
              const h = team(m.home);
              const a = team(m.away);
              return (
                <div
                  key={lv.match_id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Flag team={h} width={22} />
                    <span className="truncate text-sm font-medium text-slate-700">{h.name}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-center">
                    <span className="text-lg font-extrabold tabular-nums text-slate-800">
                      {lv.home} – {lv.away}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-red-600">
                      {lv.detail || "En vivo"}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center justify-end gap-2">
                    <span className="truncate text-right text-sm font-medium text-slate-700">{a.name}</span>
                    <Flag team={a} width={22} />
                  </div>
                </div>
              );
            })}
          </div>
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
        {liveCount > 0
          ? "Los puntos en vivo son provisionales y se confirman al terminar el partido. "
          : ""}
        La tabla se actualiza sola cada 45s
        {updatedAt ? ` · últ. ${new Date(updatedAt).toLocaleTimeString("es")}` : ""}.
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
  results: Record<string, EffScore>;
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
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            {standing.participant}
            {standing.liveScored > 0 && (
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" title="Tiene puntos en vivo" />
            )}
          </div>
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
  results: Record<string, EffScore>;
}) {
  if (!detail || detail.length === 0) {
    return (
      <p className="text-center text-xs text-slate-400">
        Aún no hay partidos jugados de este participante.
      </p>
    );
  }
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
              {d.state === "live" && (
                <span className="rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold uppercase text-red-600">
                  vivo
                </span>
              )}
              <span className="text-slate-400">
                Tú {d.home}–{d.away} · {res.home}–{res.away}
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
