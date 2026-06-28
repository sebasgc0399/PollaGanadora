import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssignedTeams, TeamCode } from "@/lib/matches";
import { TEAMS } from "@/lib/matches";
import type { BracketRow } from "@/lib/types";

// Lee de la base los equipos asignados a las llaves de la fase eliminatoria.
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
