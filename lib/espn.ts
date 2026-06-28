import { MATCHES, matchById, isKnockout, type AssignedTeams, type TeamCode } from "@/lib/matches";

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

type M = NonNullable<ReturnType<typeof matchById>>;

// Pares de la fase de grupos (equipos fijos). En eliminatoria los equipos llegan
// por asignación del admin, así que esos pares se agregan por llamada.
const GROUP_PAIRS: [string, M][] = MATCHES.filter((m) => m.home && m.away).map(
  (m) => [pairKey(m.home as TeamCode, m.away as TeamCode), m] as [string, M]
);

// Mapa par → lista de partidos. Casi siempre 1, pero un mismo par puede repetirse
// si dos equipos se enfrentan en grupos y otra vez en una llave (revancha): ahí
// guardamos ambos y desambiguamos por la fecha del evento al procesar.
function buildPairMap(assigned?: AssignedTeams): Map<string, M[]> {
  const map = new Map<string, M[]>();
  const add = (key: string, m: M) => {
    const arr = map.get(key);
    if (arr) arr.push(m);
    else map.set(key, [m]);
  };
  for (const [key, m] of GROUP_PAIRS) add(key, m);
  if (assigned) {
    for (const [id, t] of Object.entries(assigned)) {
      const m = matchById(id);
      if (!m || !isKnockout(m) || !t.home || !t.away) continue;
      add(pairKey(t.home, t.away), m);
    }
  }
  return map;
}

// Elige, entre los partidos que comparten un par, el más cercano a la fecha del
// evento de ESPN (así una revancha grupos/eliminatoria no se confunde).
function pickByDate(candidates: M[], eventDate?: string): M | undefined {
  if (candidates.length <= 1) return candidates[0];
  const t = eventDate ? new Date(eventDate).getTime() : NaN;
  if (Number.isNaN(t)) return candidates[0];
  return candidates.reduce((best, m) =>
    Math.abs(new Date(m.kickoff).getTime() - t) < Math.abs(new Date(best.kickoff).getTime() - t)
      ? m
      : best
  );
}

// Cacheamos la respuesta CRUDA de ESPN (no el resultado procesado) porque el
// mapeo depende de los equipos de eliminatoria asignados, que pueden cambiar.
let cache: { at: number; events: any[] } | null = null;

async function fetchEvents(): Promise<any[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.events;
  const res = await fetch(SCOREBOARD, {
    headers: { "User-Agent": "PollaGanadora/1.0 (+https://polla-ganadora.vercel.app)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("ESPN HTTP " + res.status);
  const data = await res.json();
  const events = data?.events ?? [];
  cache = { at: Date.now(), events };
  return events;
}

export async function fetchLiveScores(
  assigned?: AssignedTeams
): Promise<Record<string, LiveScore>> {
  const pairToMatch = buildPairMap(assigned);

  try {
    const events = await fetchEvents();

    const out: Record<string, LiveScore> = {};
    for (const e of events) {
      const comp = e?.competitions?.[0];
      const cs = comp?.competitors ?? [];
      if (cs.length !== 2) continue;

      const ha = cs[0]?.team?.abbreviation;
      const ab = cs[1]?.team?.abbreviation;
      const candidates = pairToMatch.get(pairKey(ha, ab));
      if (!candidates) continue;
      const match = pickByDate(candidates, e?.date ?? comp?.date);
      if (!match) continue;

      const scoreBy: Record<string, number> = {};
      // Number() (no parseInt) para rechazar marcadores no numéricos como
      // "2 (4)" de una tanda de penales; parseInt los truncaría a 2.
      for (const c of cs) scoreBy[c?.team?.abbreviation] = Number(c?.score);

      const type = e?.status?.type ?? comp?.status?.type ?? {};
      // ESPN usa state "post" también para partidos APLAZADOS / SUSPENDIDOS /
      // CANCELADOS (marcados con completed:false). Solo es FINAL de verdad
      // cuando completed !== false; si no, lo tratamos como "pre" para NO
      // persistir ni puntuar un marcador que no es definitivo (la /tabla y el
      // cron guardan los finales en `results`, y esa base manda para siempre).
      const state: LiveState =
        type.state === "post"
          ? type.completed === false
            ? "pre"
            : "final"
          : type.state === "in"
          ? "live"
          : "pre";
      const detail: string = type.shortDetail ?? type.detail ?? "";

      // Código del equipo local/visitante: fijo en grupos, asignado en eliminatoria.
      const homeCode = (match.home ?? assigned?.[match.id]?.home) as TeamCode | undefined;
      const awayCode = (match.away ?? assigned?.[match.id]?.away) as TeamCode | undefined;
      const home = homeCode ? scoreBy[homeCode] : NaN;
      const away = awayCode ? scoreBy[awayCode] : NaN;

      // Solo aceptamos enteros >= 0; cualquier otra cosa (NaN, negativos) hace
      // que el partido cuente como "pre" 0-0 y no se persista ni puntúe.
      const validScore =
        Number.isInteger(home) && Number.isInteger(away) && home >= 0 && away >= 0;

      if (state === "pre" || !validScore) {
        out[match.id] = { home: 0, away: 0, state: "pre", detail };
      } else {
        out[match.id] = { home, away, state, detail };
      }
    }

    return out;
  } catch {
    // Resiliencia: si ESPN falla, devolvemos vacío y la app sigue con `results`.
    return {};
  }
}
