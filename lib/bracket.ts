import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssignedTeams, TeamCode } from "@/lib/matches";
import { TEAMS } from "@/lib/matches";
import { resolveBracket, type ResultsMap } from "@/lib/knockout";
import type { BracketRow, ResultRow } from "@/lib/types";

// Lee de la base los equipos asignados A MANO a las llaves (tabla `brackets`).
// Devuelve un mapa match_id → { home, away } solo con códigos de equipo válidos.
export async function fetchAssignedTeams(sb: SupabaseClient): Promise<AssignedTeams> {
  const { data, error } = await sb.from("brackets").select("match_id,home,away");
  if (error) throw error;
  const out: AssignedTeams = {};
  for (const r of (data ?? []) as BracketRow[]) {
    out[r.match_id] = {
      home: r.home && r.home in TEAMS ? (r.home as TeamCode) : null,
      away: r.away && r.away in TEAMS ? (r.away as TeamCode) : null,
    };
  }
  return out;
}

async function fetchResultsMap(sb: SupabaseClient): Promise<ResultsMap> {
  const { data, error } = await sb.from("results").select("match_id,home,away");
  if (error) throw error;
  const out: ResultsMap = {};
  for (const r of (data ?? []) as ResultRow[]) out[r.match_id] = { home: r.home, away: r.away };
  return out;
}

// Equipos EFECTIVOS de cada llave: los asignados a mano + los que se derivan
// solos de los resultados (octavos→final avanzan según quién gana). Esto es lo
// que usan /jugar, /tabla, el admin y el mapeo de ESPN.
export async function fetchEffectiveTeams(sb: SupabaseClient): Promise<AssignedTeams> {
  const [assigned, results] = await Promise.all([fetchAssignedTeams(sb), fetchResultsMap(sb)]);
  return resolveBracket(assigned, results);
}
