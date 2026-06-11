import { MATCHES, TeamCode } from "@/lib/matches";

// ---------------------------------------------------------------------------
// Marcadores EN VIVO desde la API pública (no oficial) de ESPN.
//  - Gratis, sin API key, CORS abierto. Liga "fifa.world" (Mundial 2026).
//  - Las abreviaturas de equipo de ESPN coinciden con nuestros TeamCode
//    (MEX, RSA, KOR, …), así que el mapeo es directo.
//  - Cada par de equipos es único en fase de grupos → mapeamos por el PAR,
//    sin depender de la fecha (ESPN usa fecha UTC, que puede diferir un día).
//  - Si ESPN falla, devolvemos la última caché (o vacío) y la app sigue
//    funcionando solo con la tabla `results` de la base.
// ---------------------------------------------------------------------------

const SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=950&dates=20260601-20260720";

const TTL_MS = 30_000; // no consultar ESPN más de 1 vez cada 30s

export type LiveState = "pre" | "live" | "final";

export interface LiveScore {
  home: number;
  away: number;
  state: LiveState;
  detail: string; // texto corto de ESPN: "63'", "Half Time", "FT", …
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

const PAIR_TO_MATCH = new Map(MATCHES.map((m) => [pairKey(m.home, m.away), m]));

let cache: { at: number; data: Record<string, LiveScore> } | null = null;

export async function fetchLiveScores(): Promise<Record<string, LiveScore>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  try {
    const res = await fetch(SCOREBOARD, {
      headers: { "User-Agent": "PollaGanadora/1.0 (+https://polla-ganadora.vercel.app)" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("ESPN HTTP " + res.status);
    const data = await res.json();

    const out: Record<string, LiveScore> = {};
    for (const e of data?.events ?? []) {
      const comp = e?.competitions?.[0];
      const cs = comp?.competitors ?? [];
      if (cs.length !== 2) continue;

      const ha = cs[0]?.team?.abbreviation;
      const ab = cs[1]?.team?.abbreviation;
      const match = PAIR_TO_MATCH.get(pairKey(ha, ab));
      if (!match) continue;

      const scoreBy: Record<string, number> = {};
      for (const c of cs) scoreBy[c?.team?.abbreviation] = parseInt(c?.score, 10);

      const type = e?.status?.type ?? comp?.status?.type ?? {};
      const state: LiveState =
        type.state === "post" ? "final" : type.state === "in" ? "live" : "pre";
      const detail: string = type.shortDetail ?? type.detail ?? "";

      const home = scoreBy[match.home as TeamCode];
      const away = scoreBy[match.away as TeamCode];

      if (state === "pre" || !Number.isFinite(home) || !Number.isFinite(away)) {
        out[match.id] = { home: 0, away: 0, state: "pre", detail };
      } else {
        out[match.id] = { home, away, state, detail };
      }
    }

    cache = { at: Date.now(), data: out };
    return out;
  } catch {
    // Resiliencia: si ESPN falla, devolvemos lo último que tuvimos (o vacío).
    return cache?.data ?? {};
  }
}
