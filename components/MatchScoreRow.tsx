"use client";

import { Match, team, formatMatchDate, formatKickoffTime } from "@/lib/matches";
import Flag from "@/components/Flag";

interface Props {
  match: Match;
  home: string;
  away: string;
  onChange: (home: string, away: string) => void;
  disabled?: boolean;
  /** Texto de cuenta regresiva, p.ej. "3h 20m" (se muestra solo si está editable). */
  closesIn?: string;
  /** Contenido extra debajo del marcador (resultado real, puntos, etc.) */
  footer?: React.ReactNode;
}

function clean(v: string): string {
  // Solo dígitos, máximo 2, sin ceros a la izquierda raros.
  const digits = v.replace(/[^0-9]/g, "").slice(0, 2);
  return digits;
}

export default function MatchScoreRow({
  match,
  home,
  away,
  onChange,
  disabled = false,
  closesIn,
  footer,
}: Props) {
  const h = team(match.home);
  const a = team(match.away);

  const inputClass =
    "score-input h-11 w-12 rounded-lg border text-center text-lg font-semibold outline-none transition focus:border-pitch-600 focus:ring-2 focus:ring-pitch-600/30 " +
    (disabled
      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
      : "border-slate-300 bg-white text-slate-900");

  return (
    <div
      className={
        "rounded-xl border p-3 shadow-sm transition " +
        (disabled ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white")
      }
    >
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">
          Grupo {match.group}
        </span>
        <span className="text-right leading-tight">
          <span className="block capitalize">
            {formatMatchDate(match.date)} · {formatKickoffTime(match.kickoff)}
          </span>
          {!disabled && closesIn ? (
            <span className="block text-[11px] font-medium text-amber-600">
              ⏱ Cierra en {closesIn}
            </span>
          ) : null}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center justify-end gap-2 text-right">
          <span className="text-sm font-medium leading-tight sm:text-base">{h.name}</span>
          <Flag team={h} width={28} />
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            aria-label={`Goles ${h.name}`}
            className={inputClass}
            value={home}
            disabled={disabled}
            onChange={(e) => onChange(clean(e.target.value), away)}
          />
          <span className="px-0.5 text-slate-400">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            aria-label={`Goles ${a.name}`}
            className={inputClass}
            value={away}
            disabled={disabled}
            onChange={(e) => onChange(home, clean(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2 text-left">
          <Flag team={a} width={28} />
          <span className="text-sm font-medium leading-tight sm:text-base">{a.name}</span>
        </div>
      </div>

      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}
