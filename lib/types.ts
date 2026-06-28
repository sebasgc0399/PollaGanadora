// Filas tal como se guardan en Supabase.

export interface PredictionRow {
  participant: string; // nombre del participante (clave junto con match_id)
  match_id: string;
  home: number;
  away: number;
}

export interface ResultRow {
  match_id: string;
  home: number;
  away: number;
}

// Equipos asignados a una llave de la fase eliminatoria (los pone el admin).
// home/away son códigos de equipo (TeamCode) o null si aún no se define.
export interface BracketRow {
  match_id: string;
  home: string | null;
  away: string | null;
}
