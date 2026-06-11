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
