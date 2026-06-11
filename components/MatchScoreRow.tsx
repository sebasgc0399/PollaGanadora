"use client";

import { useRef } from "react";
import { Match, team, formatMatchDate, formatKickoffTime } from "@/lib/matches";
import Flag from "@/components/Flag";

type Status = "saved" | "unsaved" | "incomplete" | null;

interface Props {
  match: Match;
  home: string;
  away: string;
  onChange: (home: string, away: string) => void;
  disabled?: boolean;
  closesIn?: string;
  urgent?: boolean; // cierra pronto → resaltar la cuenta regresiva
  status?: Status; // indicador guardado / sin guardar / incompleto
  footer?: React.ReactNode;
}

function clean(v: string): string {
  return v.replace(/[^0-9]/g, "").slice(0, 2);
}
function clamp(n: number): number {
  return Math.max(0, Math.min(99, n));
}

export default function MatchScoreRow({
  match,
  home,
  away,
  onChange,
  disabled = false,
  closesIn,
  urgent = false,
  status = null,
  footer,
}: Props) {
  const h = team(match.home);
  const a = team(match.away);
  const homeRef = useRef<HTMLInputElement>(null);
  const awayRef = useRef<HTMLInputElement>(null);

  const inputClass =
    "score-input h-11 w-12 rounded-lg border text-center text-lg font-bold outline-none transition focus:border-pitch-600 focus:ring-2 focus:ring-pitch-600/30 " +
    (disabled
      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
      : "border-slate-300 bg-white text-slate-900");

  const btnClass =
    "flex h-11 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg font-bold text-slate-500 transition hover:bg-slate-100 active:scale-95 disabled:opacity-40";

  function setHome(v: string) {
    onChange(v, away);
  }
  function setAway(v: string) {
    onChange(home, v);
  }
  function onHomeType(v: string) {
    const c = clean(v);
    setHome(c);
    if (c.length >= 1 && away === "") awayRef.current?.focus(); // auto-salto
  }

  function stepper(
    value: string,
    onSet: (v: string) => void,
    ref: React.RefObject<HTMLInputElement>,
    label: string,
    onType?: (v: string) => void
  ) {
    const n = parseInt(value || "0", 10) || 0;
    return (
      <div className="flex items-center gap-1">
        {!disabled && (
          <button
            type="button"
            aria-label={`menos ${label}`}
            className={btnClass}
            onClick={() => onSet(String(clamp(n - 1)))}
          >
            −
          </button>
        )}
        <input
          ref={ref}
          type="number"
          inputMode="numeric"
          min={0}
          max={99}
          aria-label={label}
          className={inputClass}
          value={value}
          disabled={disabled}
          onChange={(e) => (onType ? onType(e.target.value) : onSet(clean(e.target.value)))}
        />
        {!disabled && (
          <button
            type="button"
            aria-label={`más ${label}`}
            className={btnClass}
            onClick={() => onSet(String(clamp(n + 1)))}
          >
            +
          </button>
        )}
      </div>
    );
  }

  const statusPill =
    status === "saved" ? (
      <span className="text-[10px] font-semibold text-emerald-600">✓ guardado</span>
    ) : status === "unsaved" ? (
      <span className="text-[10px] font-semibold text-amber-600">• sin guardar</span>
    ) : status === "incomplete" ? (
      <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold uppercase text-amber-700">
        incompleto
      </span>
    ) : null;

  return (
    <div
      className={
        "rounded-xl border p-3 shadow-sm transition " +
        (status === "incomplete"
          ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200"
          : disabled
          ? "border-slate-200 bg-slate-50"
          : "border-slate-200 bg-white")
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">
            Grupo {match.group}
          </span>
          {statusPill}
        </span>
        <span className="text-right leading-tight">
          <span className="block capitalize">
            {formatMatchDate(match.date)} · {formatKickoffTime(match.kickoff)}
          </span>
          {!disabled && closesIn ? (
            <span
              className={
                "block text-[11px] font-semibold " +
                (urgent ? "text-red-600" : "text-amber-600")
              }
            >
              ⏱ Cierra en {closesIn}
            </span>
          ) : null}
        </span>
      </div>

      {/* Fila de equipos */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Flag team={h} width={26} />
          <span className="truncate text-sm font-semibold sm:text-base">{h.name}</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <span className="truncate text-sm font-semibold sm:text-base">{a.name}</span>
          <Flag team={a} width={26} />
        </div>
      </div>

      {/* Fila de marcadores (steppers) */}
      <div className="mt-2 flex items-center justify-center gap-2">
        {stepper(home, setHome, homeRef, `Goles ${h.name}`, onHomeType)}
        <span className="px-1 text-lg font-bold text-slate-300">–</span>
        {stepper(away, setAway, awayRef, `Goles ${a.name}`)}
      </div>

      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}
