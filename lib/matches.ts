// ---------------------------------------------------------------------------
// Fixture de la fase de grupos del Mundial 2026 (Canadá / México / EE.UU.)
//
// Fuente del sorteo (5 dic 2025) y calendario: FIFA / ESPN / Al Jazeera.
// Si algún enfrentamiento o fecha cambia, edita este archivo: es la única
// fuente de verdad de los partidos. Los `id` (m01..m72) deben permanecer
// estables porque las predicciones y resultados guardados los referencian.
// ---------------------------------------------------------------------------

export type TeamCode = keyof typeof TEAMS;

export interface Team {
  name: string;
  flag: string; // emoji (respaldo)
  iso: string;  // código para la imagen de bandera (flagcdn): ISO-3166 alpha-2 o "gb-sct"/"gb-eng"
}

export interface Match {
  id: string;       // identificador estable (NO cambiar una vez en uso)
  group: string;    // A..L
  matchday: 1 | 2 | 3;
  date: string;     // ISO (YYYY-MM-DD) — solo para mostrar
  kickoff: string;  // instante exacto del pitazo inicial (ISO con offset ET -04:00)
  home: TeamCode;
  away: TeamCode;
}

export const TEAMS = {
  MEX: { name: "México", flag: "🇲🇽", iso: "mx" },
  KOR: { name: "Corea del Sur", flag: "🇰🇷", iso: "kr" },
  CZE: { name: "Chequia", flag: "🇨🇿", iso: "cz" },
  RSA: { name: "Sudáfrica", flag: "🇿🇦", iso: "za" },
  CAN: { name: "Canadá", flag: "🇨🇦", iso: "ca" },
  BIH: { name: "Bosnia y Herzegovina", flag: "🇧🇦", iso: "ba" },
  QAT: { name: "Catar", flag: "🇶🇦", iso: "qa" },
  SUI: { name: "Suiza", flag: "🇨🇭", iso: "ch" },
  BRA: { name: "Brasil", flag: "🇧🇷", iso: "br" },
  MAR: { name: "Marruecos", flag: "🇲🇦", iso: "ma" },
  HAI: { name: "Haití", flag: "🇭🇹", iso: "ht" },
  SCO: { name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", iso: "gb-sct" },
  USA: { name: "Estados Unidos", flag: "🇺🇸", iso: "us" },
  PAR: { name: "Paraguay", flag: "🇵🇾", iso: "py" },
  AUS: { name: "Australia", flag: "🇦🇺", iso: "au" },
  TUR: { name: "Turquía", flag: "🇹🇷", iso: "tr" },
  GER: { name: "Alemania", flag: "🇩🇪", iso: "de" },
  CUW: { name: "Curazao", flag: "🇨🇼", iso: "cw" },
  CIV: { name: "Costa de Marfil", flag: "🇨🇮", iso: "ci" },
  ECU: { name: "Ecuador", flag: "🇪🇨", iso: "ec" },
  NED: { name: "Países Bajos", flag: "🇳🇱", iso: "nl" },
  JPN: { name: "Japón", flag: "🇯🇵", iso: "jp" },
  SWE: { name: "Suecia", flag: "🇸🇪", iso: "se" },
  TUN: { name: "Túnez", flag: "🇹🇳", iso: "tn" },
  BEL: { name: "Bélgica", flag: "🇧🇪", iso: "be" },
  EGY: { name: "Egipto", flag: "🇪🇬", iso: "eg" },
  IRN: { name: "Irán", flag: "🇮🇷", iso: "ir" },
  NZL: { name: "Nueva Zelanda", flag: "🇳🇿", iso: "nz" },
  ESP: { name: "España", flag: "🇪🇸", iso: "es" },
  CPV: { name: "Cabo Verde", flag: "🇨🇻", iso: "cv" },
  KSA: { name: "Arabia Saudita", flag: "🇸🇦", iso: "sa" },
  URU: { name: "Uruguay", flag: "🇺🇾", iso: "uy" },
  FRA: { name: "Francia", flag: "🇫🇷", iso: "fr" },
  SEN: { name: "Senegal", flag: "🇸🇳", iso: "sn" },
  IRQ: { name: "Irak", flag: "🇮🇶", iso: "iq" },
  NOR: { name: "Noruega", flag: "🇳🇴", iso: "no" },
  ARG: { name: "Argentina", flag: "🇦🇷", iso: "ar" },
  ALG: { name: "Argelia", flag: "🇩🇿", iso: "dz" },
  AUT: { name: "Austria", flag: "🇦🇹", iso: "at" },
  JOR: { name: "Jordania", flag: "🇯🇴", iso: "jo" },
  POR: { name: "Portugal", flag: "🇵🇹", iso: "pt" },
  COD: { name: "RD Congo", flag: "🇨🇩", iso: "cd" },
  UZB: { name: "Uzbekistán", flag: "🇺🇿", iso: "uz" },
  COL: { name: "Colombia", flag: "🇨🇴", iso: "co" },
  ENG: { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", iso: "gb-eng" },
  CRO: { name: "Croacia", flag: "🇭🇷", iso: "hr" },
  GHA: { name: "Ghana", flag: "🇬🇭", iso: "gh" },
  PAN: { name: "Panamá", flag: "🇵🇦", iso: "pa" },
} as const;

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

// `kickoff` = pitazo inicial en hora del Este de EE.UU. (ET, en junio = EDT = UTC-04:00).
// Es un instante absoluto, así el bloqueo funciona igual sin importar la zona del jugador.
// Horarios cotejados entre ESPN y worldcupwiki (best-effort); edítalos si la FIFA cambia algo.
export const MATCHES: Match[] = [
  // ---- Jornada 1 (11–17 jun) ----
  { id: "m01", group: "A", matchday: 1, date: "2026-06-11", kickoff: "2026-06-11T15:00:00-04:00", home: "MEX", away: "RSA" },
  { id: "m02", group: "A", matchday: 1, date: "2026-06-11", kickoff: "2026-06-11T22:00:00-04:00", home: "KOR", away: "CZE" },
  { id: "m03", group: "B", matchday: 1, date: "2026-06-12", kickoff: "2026-06-12T15:00:00-04:00", home: "CAN", away: "BIH" },
  { id: "m04", group: "D", matchday: 1, date: "2026-06-12", kickoff: "2026-06-12T21:00:00-04:00", home: "USA", away: "PAR" },
  { id: "m05", group: "B", matchday: 1, date: "2026-06-13", kickoff: "2026-06-13T15:00:00-04:00", home: "QAT", away: "SUI" },
  { id: "m06", group: "C", matchday: 1, date: "2026-06-13", kickoff: "2026-06-13T18:00:00-04:00", home: "BRA", away: "MAR" },
  { id: "m07", group: "C", matchday: 1, date: "2026-06-13", kickoff: "2026-06-13T21:00:00-04:00", home: "HAI", away: "SCO" },
  { id: "m08", group: "D", matchday: 1, date: "2026-06-13", kickoff: "2026-06-14T00:00:00-04:00", home: "AUS", away: "TUR" },
  { id: "m09", group: "E", matchday: 1, date: "2026-06-14", kickoff: "2026-06-14T13:00:00-04:00", home: "GER", away: "CUW" },
  { id: "m10", group: "F", matchday: 1, date: "2026-06-14", kickoff: "2026-06-14T16:00:00-04:00", home: "NED", away: "JPN" },
  { id: "m11", group: "E", matchday: 1, date: "2026-06-14", kickoff: "2026-06-14T19:00:00-04:00", home: "CIV", away: "ECU" },
  { id: "m12", group: "F", matchday: 1, date: "2026-06-14", kickoff: "2026-06-14T22:00:00-04:00", home: "SWE", away: "TUN" },
  { id: "m13", group: "H", matchday: 1, date: "2026-06-15", kickoff: "2026-06-15T12:00:00-04:00", home: "ESP", away: "CPV" },
  { id: "m14", group: "G", matchday: 1, date: "2026-06-15", kickoff: "2026-06-15T15:00:00-04:00", home: "BEL", away: "EGY" },
  { id: "m15", group: "H", matchday: 1, date: "2026-06-15", kickoff: "2026-06-15T18:00:00-04:00", home: "KSA", away: "URU" },
  { id: "m16", group: "G", matchday: 1, date: "2026-06-15", kickoff: "2026-06-15T21:00:00-04:00", home: "IRN", away: "NZL" },
  { id: "m17", group: "I", matchday: 1, date: "2026-06-16", kickoff: "2026-06-16T15:00:00-04:00", home: "FRA", away: "SEN" },
  { id: "m18", group: "I", matchday: 1, date: "2026-06-16", kickoff: "2026-06-16T18:00:00-04:00", home: "IRQ", away: "NOR" },
  { id: "m19", group: "J", matchday: 1, date: "2026-06-16", kickoff: "2026-06-16T21:00:00-04:00", home: "ARG", away: "ALG" },
  { id: "m20", group: "J", matchday: 1, date: "2026-06-16", kickoff: "2026-06-17T00:00:00-04:00", home: "AUT", away: "JOR" },
  { id: "m21", group: "K", matchday: 1, date: "2026-06-17", kickoff: "2026-06-17T13:00:00-04:00", home: "POR", away: "COD" },
  { id: "m22", group: "L", matchday: 1, date: "2026-06-17", kickoff: "2026-06-17T16:00:00-04:00", home: "ENG", away: "CRO" },
  { id: "m23", group: "L", matchday: 1, date: "2026-06-17", kickoff: "2026-06-17T19:00:00-04:00", home: "GHA", away: "PAN" },
  { id: "m24", group: "K", matchday: 1, date: "2026-06-17", kickoff: "2026-06-17T22:00:00-04:00", home: "UZB", away: "COL" },

  // ---- Jornada 2 (18–23 jun) ----
  { id: "m25", group: "A", matchday: 2, date: "2026-06-18", kickoff: "2026-06-18T12:00:00-04:00", home: "CZE", away: "RSA" },
  { id: "m26", group: "B", matchday: 2, date: "2026-06-18", kickoff: "2026-06-18T15:00:00-04:00", home: "SUI", away: "BIH" },
  { id: "m27", group: "B", matchday: 2, date: "2026-06-18", kickoff: "2026-06-18T18:00:00-04:00", home: "CAN", away: "QAT" },
  { id: "m28", group: "A", matchday: 2, date: "2026-06-18", kickoff: "2026-06-18T21:00:00-04:00", home: "MEX", away: "KOR" },
  { id: "m29", group: "C", matchday: 2, date: "2026-06-19", kickoff: "2026-06-19T18:00:00-04:00", home: "SCO", away: "MAR" },
  { id: "m30", group: "D", matchday: 2, date: "2026-06-19", kickoff: "2026-06-19T15:00:00-04:00", home: "USA", away: "AUS" },
  { id: "m31", group: "C", matchday: 2, date: "2026-06-19", kickoff: "2026-06-19T21:00:00-04:00", home: "BRA", away: "HAI" },
  { id: "m32", group: "D", matchday: 2, date: "2026-06-19", kickoff: "2026-06-20T00:00:00-04:00", home: "TUR", away: "PAR" },
  { id: "m33", group: "F", matchday: 2, date: "2026-06-20", kickoff: "2026-06-20T13:00:00-04:00", home: "NED", away: "SWE" },
  { id: "m34", group: "E", matchday: 2, date: "2026-06-20", kickoff: "2026-06-20T16:00:00-04:00", home: "GER", away: "CIV" },
  { id: "m35", group: "E", matchday: 2, date: "2026-06-20", kickoff: "2026-06-20T20:00:00-04:00", home: "ECU", away: "CUW" },
  { id: "m36", group: "F", matchday: 2, date: "2026-06-20", kickoff: "2026-06-21T00:00:00-04:00", home: "TUN", away: "JPN" },
  { id: "m37", group: "H", matchday: 2, date: "2026-06-21", kickoff: "2026-06-21T12:00:00-04:00", home: "ESP", away: "KSA" },
  { id: "m38", group: "G", matchday: 2, date: "2026-06-21", kickoff: "2026-06-21T15:00:00-04:00", home: "BEL", away: "IRN" },
  { id: "m39", group: "H", matchday: 2, date: "2026-06-21", kickoff: "2026-06-21T18:00:00-04:00", home: "URU", away: "CPV" },
  { id: "m40", group: "G", matchday: 2, date: "2026-06-21", kickoff: "2026-06-21T21:00:00-04:00", home: "NZL", away: "EGY" },
  { id: "m41", group: "J", matchday: 2, date: "2026-06-22", kickoff: "2026-06-22T13:00:00-04:00", home: "ARG", away: "AUT" },
  { id: "m42", group: "I", matchday: 2, date: "2026-06-22", kickoff: "2026-06-22T17:00:00-04:00", home: "FRA", away: "IRQ" },
  { id: "m43", group: "I", matchday: 2, date: "2026-06-22", kickoff: "2026-06-22T20:00:00-04:00", home: "NOR", away: "SEN" },
  { id: "m44", group: "J", matchday: 2, date: "2026-06-22", kickoff: "2026-06-22T23:00:00-04:00", home: "JOR", away: "ALG" },
  { id: "m45", group: "K", matchday: 2, date: "2026-06-23", kickoff: "2026-06-23T13:00:00-04:00", home: "POR", away: "UZB" },
  { id: "m46", group: "L", matchday: 2, date: "2026-06-23", kickoff: "2026-06-23T16:00:00-04:00", home: "ENG", away: "GHA" },
  { id: "m47", group: "L", matchday: 2, date: "2026-06-23", kickoff: "2026-06-23T19:00:00-04:00", home: "PAN", away: "CRO" },
  { id: "m48", group: "K", matchday: 2, date: "2026-06-23", kickoff: "2026-06-23T22:00:00-04:00", home: "COL", away: "COD" },

  // ---- Jornada 3 (24–27 jun) · los dos partidos de cada grupo arrancan a la misma hora ----
  { id: "m49", group: "B", matchday: 3, date: "2026-06-24", kickoff: "2026-06-24T15:00:00-04:00", home: "SUI", away: "CAN" },
  { id: "m50", group: "B", matchday: 3, date: "2026-06-24", kickoff: "2026-06-24T15:00:00-04:00", home: "BIH", away: "QAT" },
  { id: "m51", group: "C", matchday: 3, date: "2026-06-24", kickoff: "2026-06-24T18:00:00-04:00", home: "SCO", away: "BRA" },
  { id: "m52", group: "C", matchday: 3, date: "2026-06-24", kickoff: "2026-06-24T18:00:00-04:00", home: "MAR", away: "HAI" },
  { id: "m53", group: "A", matchday: 3, date: "2026-06-24", kickoff: "2026-06-24T21:00:00-04:00", home: "CZE", away: "MEX" },
  { id: "m54", group: "A", matchday: 3, date: "2026-06-24", kickoff: "2026-06-24T21:00:00-04:00", home: "RSA", away: "KOR" },
  { id: "m55", group: "E", matchday: 3, date: "2026-06-25", kickoff: "2026-06-25T16:00:00-04:00", home: "ECU", away: "GER" },
  { id: "m56", group: "E", matchday: 3, date: "2026-06-25", kickoff: "2026-06-25T16:00:00-04:00", home: "CUW", away: "CIV" },
  { id: "m57", group: "F", matchday: 3, date: "2026-06-25", kickoff: "2026-06-25T19:00:00-04:00", home: "JPN", away: "SWE" },
  { id: "m58", group: "F", matchday: 3, date: "2026-06-25", kickoff: "2026-06-25T19:00:00-04:00", home: "TUN", away: "NED" },
  { id: "m59", group: "D", matchday: 3, date: "2026-06-25", kickoff: "2026-06-25T22:00:00-04:00", home: "TUR", away: "USA" },
  { id: "m60", group: "D", matchday: 3, date: "2026-06-25", kickoff: "2026-06-25T22:00:00-04:00", home: "PAR", away: "AUS" },
  { id: "m61", group: "I", matchday: 3, date: "2026-06-26", kickoff: "2026-06-26T15:00:00-04:00", home: "NOR", away: "FRA" },
  { id: "m62", group: "I", matchday: 3, date: "2026-06-26", kickoff: "2026-06-26T15:00:00-04:00", home: "SEN", away: "IRQ" },
  { id: "m63", group: "H", matchday: 3, date: "2026-06-26", kickoff: "2026-06-26T20:00:00-04:00", home: "CPV", away: "KSA" },
  { id: "m64", group: "H", matchday: 3, date: "2026-06-26", kickoff: "2026-06-26T20:00:00-04:00", home: "URU", away: "ESP" },
  { id: "m65", group: "G", matchday: 3, date: "2026-06-26", kickoff: "2026-06-26T23:00:00-04:00", home: "EGY", away: "IRN" },
  { id: "m66", group: "G", matchday: 3, date: "2026-06-26", kickoff: "2026-06-26T23:00:00-04:00", home: "NZL", away: "BEL" },
  { id: "m67", group: "L", matchday: 3, date: "2026-06-27", kickoff: "2026-06-27T17:00:00-04:00", home: "PAN", away: "ENG" },
  { id: "m68", group: "L", matchday: 3, date: "2026-06-27", kickoff: "2026-06-27T17:00:00-04:00", home: "CRO", away: "GHA" },
  { id: "m69", group: "K", matchday: 3, date: "2026-06-27", kickoff: "2026-06-27T19:30:00-04:00", home: "COL", away: "POR" },
  { id: "m70", group: "K", matchday: 3, date: "2026-06-27", kickoff: "2026-06-27T19:30:00-04:00", home: "COD", away: "UZB" },
  { id: "m71", group: "J", matchday: 3, date: "2026-06-27", kickoff: "2026-06-27T22:00:00-04:00", home: "ALG", away: "AUT" },
  { id: "m72", group: "J", matchday: 3, date: "2026-06-27", kickoff: "2026-06-27T22:00:00-04:00", home: "JOR", away: "ARG" },
];

export function team(code: TeamCode): Team {
  return TEAMS[code];
}

export function matchById(id: string): Match | undefined {
  return MATCHES.find((m) => m.id === id);
}

/** Fecha legible en español, p.ej. "jue 11 jun". */
export function formatMatchDate(iso: string): string {
  // Construye la fecha en horario local sin desfase de zona.
  const [y, mo, d] = iso.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

// ---------------------------------------------------------------------------
// Bloqueo de predicciones
// ---------------------------------------------------------------------------

/** Minutos antes del pitazo en que se cierra la edición de la predicción. */
export const LOCK_MINUTES_BEFORE = 10;

/** Instante (ms epoch) a partir del cual el partido queda cerrado por tiempo. */
export function lockTimeMs(m: Match): number {
  return new Date(m.kickoff).getTime() - LOCK_MINUTES_BEFORE * 60_000;
}

/**
 * ¿El partido está cerrado para editar la predicción?
 * Cerrado si: ya hay resultado cargado (fallback del admin) O falta < 1h para el pitazo.
 */
export function isMatchLocked(m: Match, nowMs: number, hasResult: boolean): boolean {
  return hasResult || nowMs >= lockTimeMs(m);
}

/** Hora del pitazo en la zona horaria del dispositivo del usuario, p.ej. "14:00". */
export function formatKickoffTime(iso: string): string {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Tiempo restante legible: "2d 3h", "3h 20m", "8m" o "<1m". */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "cerrado";
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "<1m";
}
