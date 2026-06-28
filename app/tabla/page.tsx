"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MATCHES,
  matchById,
  sideInfo,
  formatMatchDate,
  formatKickoffTime,
  type AssignedTeams,
  type SideInfo,
} from "@/lib/matches";
import Flag from "@/components/Flag";
import { buildReportMessage, buildLiveMessage, shareReport, type ReportPending } from "@/lib/report";

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

// Banderita segura: usa la bandera del equipo si se conoce, o un chip "?" si la
// llave de eliminatoria aún no tiene equipo asignado.
function SideFlag({ info, width = 22 }: { info: SideInfo; width?: number }) {
  if (info.known) return <Flag team={info.team!} width={width} />;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[3px] bg-slate-200 font-bold text-slate-500 ring-1 ring-black/10"
      style={{ width, height: Math.round(width * 0.7), fontSize: Math.round(width * 0.42) }}
    >
      ?
    </span>
  );
}

export default function TablaPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [results, setResults] = useState<Record<string, EffScore>>({});
  const [bracketTeams, setBracketTeams] = useState<AssignedTeams>({});
  const [live, setLive] = useState<LiveItem[]>([]);
  const [finalCount, setFinalCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [pend, setPend] = useState<ReportPending | null>(null);
  const firstLoad = useRef(true);
  const reqSeq = useRef(0);

  const load = useCallback(async () => {
    if (firstLoad.current) setLoading(true);
    const mine = ++reqSeq.current;
    try {
      const [res, pendRes] = await Promise.all([
        fetch("/api/tabla", { cache: "no-store" }),
        fetch("/api/pendientes", { cache: "no-store" }),
      ]);
      const data = await res.json();
      const pendData = await pendRes.json().catch(() => null);
      // Descartar respuestas que llegan fuera de orden: si ya se disparó una
      // petición más nueva, esta quedó obsoleta y no debe pisar el estado.
      if (mine !== reqSeq.current) return;
      if (!res.ok) throw new Error(data?.error ?? "Error cargando la tabla.");
      setStandings(data.standings ?? []);
      setResults(data.results ?? {});
      setBracketTeams(data.bracketTeams ?? {});
      setLive(data.live ?? []);
      setFinalCount(data.finalCount ?? 0);
      setLiveCount(data.liveCount ?? 0);
      setPend(pendRes.ok ? (pendData as ReportPending) : null);
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

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Tabla de posiciones
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {finalCount}/{MATCHES.length} con resultado
            </span>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-600" />
                {liveCount} en vivo
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {standings.length} participante{standings.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {live.length > 0 && (
            <button
              onClick={() => shareReport(buildLiveMessage(standings, live, bracketTeams))}
              disabled={loading}
              title="Comparte el pronóstico de cada uno en los partidos en juego ahora"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50 sm:flex-none"
            >
              🔴 En juego
            </button>
          )}
          <button
            onClick={() => shareReport(buildReportMessage(standings, pend))}
            disabled={loading || standings.length === 0}
            title="Comparte quién falta por pronosticar hoy y la tabla"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50 sm:flex-none"
          >
            📲 Compartir
          </button>
          <button
            onClick={load}
            disabled={loading}
            aria-label="Actualizar"
            className="shrink-0 rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {loading ? "…" : "↻"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* En vivo, o cuenta regresiva al próximo partido */}
      {live.length > 0 ? (
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
              const h = sideInfo(m, "home", bracketTeams);
              const a = sideInfo(m, "away", bracketTeams);
              return (
                <div
                  key={lv.match_id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <SideFlag info={h} />
                    <span className="truncate text-sm font-medium text-slate-700">{h.label}</span>
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
                    <span className="truncate text-right text-sm font-medium text-slate-700">{a.label}</span>
                    <SideFlag info={a} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <NextMatchCard assigned={bracketTeams} />
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2.5 pl-3 pr-1 text-center font-semibold">#</th>
                <th className="px-2 py-2.5 text-left font-semibold">Participante</th>
                <th className="px-1 py-2.5 text-center font-semibold" title="Marcadores exactos">
                  🎯
                </th>
                <th className="py-2.5 pl-1 pr-3 text-right font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const open = expanded === s.participant;
                return (
                  <FragmentRow
                    key={s.participant}
                    standing={s}
                    index={i}
                    open={open}
                    onToggle={() => setExpanded(open ? null : s.participant)}
                    results={results}
                    assigned={bracketTeams}
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

const PODIUM = ["🥇", "🥈", "🥉"];

function RankBadge({ index }: { index: number }) {
  if (index < 3) {
    return <span className="text-xl leading-none">{PODIUM[index]}</span>;
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
      {index + 1}
    </span>
  );
}

function FragmentRow({
  standing,
  index,
  open,
  onToggle,
  results,
  assigned,
}: {
  standing: Standing;
  index: number;
  open: boolean;
  onToggle: () => void;
  results: Record<string, EffScore>;
  assigned: AssignedTeams;
}) {
  const podium = index < 3;
  const accent =
    index === 0
      ? "border-l-amber-400 bg-amber-50/40"
      : index === 1
      ? "border-l-slate-300 bg-slate-50/60"
      : index === 2
      ? "border-l-orange-300 bg-orange-50/30"
      : "border-l-transparent";
  return (
    <>
      <tr
        onClick={onToggle}
        aria-expanded={open}
        className={
          "cursor-pointer border-b border-l-4 border-slate-100 transition hover:bg-emerald-50/60 " +
          accent +
          (open ? " bg-emerald-50/60" : "")
        }
      >
        <td className="py-2.5 pl-3 pr-1 text-center align-middle">
          <RankBadge index={index} />
        </td>
        <td className="px-2 py-2.5 align-middle">
          <div className="flex items-center gap-1.5">
            <span
              className={
                "truncate font-semibold text-slate-800 " + (podium ? "text-[15px]" : "")
              }
            >
              {standing.participant}
            </span>
            {standing.liveScored > 0 && (
              <span
                className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500"
                title="Tiene puntos en vivo"
              />
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
            <span>{standing.scored} jugados</span>
            <span aria-hidden>·</span>
            <span>{standing.exact} exactos</span>
            <span aria-hidden>·</span>
            <span>{standing.outcomes} ganador</span>
          </div>
        </td>
        <td className="px-1 py-2.5 text-center align-middle tabular-nums text-slate-600">
          {standing.exact}
        </td>
        <td className="py-2.5 pl-1 pr-3 text-right align-middle">
          <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg bg-pitch-50 px-2 py-1 text-base font-extrabold tabular-nums text-pitch-700">
            {standing.points}
          </span>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-slate-100 bg-slate-50">
          <td colSpan={4} className="px-3 py-3">
            <Detail detail={standing.detail} results={results} assigned={assigned} />
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({
  detail,
  results,
  assigned,
}: {
  detail: DetailRow[];
  results: Record<string, EffScore>;
  assigned: AssignedTeams;
}) {
  if (!detail || detail.length === 0) {
    return (
      <p className="text-center text-xs text-slate-400">
        Aún no hay partidos jugados de este participante.
      </p>
    );
  }
  // Más reciente primero (por hora de inicio del partido).
  const rows = [...detail].sort((a, b) => {
    const ka = matchById(a.match_id)?.kickoff ?? "";
    const kb = matchById(b.match_id)?.kickoff ?? "";
    return new Date(kb).getTime() - new Date(ka).getTime();
  });
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-x-2 px-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
        <span>{rows.length} jugados · reciente primero</span>
        <span>
          tu pronóstico <span className="text-slate-300">→</span> resultado
        </span>
      </div>
      {/* Área con scroll para que la lista no empuje la tabla */}
      <div className="max-h-80 space-y-1 overflow-y-auto pr-0.5">
        {rows.map((d) => {
          const m = matchById(d.match_id);
          const res = results[d.match_id];
          if (!m || !res) return null;
          const h = sideInfo(m, "home", assigned);
          const a = sideInfo(m, "away", assigned);
          const live = d.state === "live";
          return (
            <div
              key={d.match_id}
              className="flex flex-col gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-2"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                <SideFlag info={h} width={16} />
                <span className="truncate">
                  {h.label} <span className="text-slate-300">vs</span> {a.label}
                </span>
                <SideFlag info={a} width={16} />
              </span>
              <span className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                {/* Pronóstico: apagado (lo que dijiste) */}
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold tabular-nums text-slate-500">
                  {d.home}-{d.away}
                </span>
                <span className="px-0.5 text-slate-300">→</span>
                {/* Resultado: resaltado (lo que pasó); rojo si va en vivo */}
                <span
                  className={
                    "flex items-center gap-1 rounded px-1.5 py-0.5 font-bold tabular-nums text-white " +
                    (live ? "bg-red-600" : "bg-slate-700")
                  }
                >
                  {live && <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/90" />}
                  {res.home}-{res.away}
                </span>
                <span
                  className={
                    "ml-0.5 min-w-[30px] rounded px-1.5 py-0.5 text-center font-bold " +
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
    </div>
  );
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "¡ya!";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (d > 0 ? `${d}d ` : "") + `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Cuando NO hay partidos en vivo: muestra el próximo partido (quién juega) con
// una cuenta regresiva en tiempo real hasta el pitazo. Ocupa el mismo lugar y
// tamaño que la tarjeta EN VIVO. Tiene su propio tick para no re-renderizar la
// tabla entera cada segundo.
function NextMatchCard({ assigned }: { assigned: AssignedTeams }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => {
    if (!now) return null;
    return (
      MATCHES.filter((m) => new Date(m.kickoff).getTime() > now).sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      )[0] ?? null
    );
  }, [now]);

  if (!now || !next) return null;
  const ms = new Date(next.kickoff).getTime() - now;
  const h = sideInfo(next, "home", assigned);
  const a = sideInfo(next, "away", assigned);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-pitch-700">
        ⏱ PRÓXIMO PARTIDO
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <SideFlag info={h} />
          <span className="truncate text-sm font-medium text-slate-700">{h.label}</span>
        </div>
        <div className="flex shrink-0 flex-col items-center px-1">
          <span className="text-lg font-extrabold tabular-nums text-pitch-700">
            {fmtCountdown(ms)}
          </span>
          <span className="text-[10px] font-semibold uppercase text-slate-400">
            {formatMatchDate(next.date)} · {formatKickoffTime(next.kickoff)}
          </span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-right text-sm font-medium text-slate-700">{a.label}</span>
          <SideFlag info={a} />
        </div>
      </div>
    </div>
  );
}
