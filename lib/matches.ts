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

// Etapas del torneo. "group" = fase de grupos; el resto son rondas de la
// fase eliminatoria (clasificatoria → cuadro final).
export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";

export interface Match {
  id: string;       // identificador estable (NO cambiar una vez en uso)
  stage?: Stage;    // ausente = "group" (los 72 partidos de grupos)
  group?: string;   // A..L — solo fase de grupos
  matchday?: 1 | 2 | 3; // solo fase de grupos
  date: string;     // ISO (YYYY-MM-DD) — solo para mostrar
  kickoff: string;  // instante exacto del pitazo inicial (ISO con offset ET -04:00)
  // En grupos, home/away son equipos fijos. En la fase eliminatoria los equipos
  // dependen de cómo terminen los grupos: van como `homeLabel`/`awayLabel`
  // (p.ej. "1° A", "3° C/E/F/H/I", "Gana P73") y el admin asigna el equipo real
  // desde /admin a medida que se definen (se guarda en la tabla `brackets`).
  home?: TeamCode;
  away?: TeamCode;
  homeLabel?: string;
  awayLabel?: string;
}

// Equipos asignados a las llaves de la fase eliminatoria (vienen de la base,
// los pone el admin). Mapa: match_id → { home, away } con códigos de equipo.
export type AssignedTeams = Record<string, { home?: TeamCode | null; away?: TeamCode | null }>;

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
  { id: "m31", group: "C", matchday: 2, date: "2026-06-19", kickoff: "2026-06-19T20:30:00-04:00", home: "BRA", away: "HAI" },
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

  // =========================================================================
  // Fase eliminatoria · cuadro completo (32 partidos, m73–m104)
  //
  // Los equipos dependen de los resultados de los grupos, así que van con
  // PLACEHOLDERS (homeLabel/awayLabel): "1° A" = ganador del grupo A, "2° B" =
  // segundo del grupo B, "3° C/E/F/H/I" = mejor tercero de esos grupos, y
  // "Gana P74" = ganador del partido 74. El admin asigna el equipo real desde
  // /admin (se guarda en la tabla `brackets`) a medida que se definen.
  //
  // Cruces y fechas según el calendario oficial FIFA 2026 (FIFA / ESPN, ET).
  // Las horas son best-effort: verifícalas y edítalas si la FIFA ajusta algo.
  // -------------------------------------------------------------------------

  // ---- Dieciseisavos / Ronda de 32 (28 jun – 3 jul) ----
  { id: "m73", stage: "r32", date: "2026-06-28", kickoff: "2026-06-28T15:00:00-04:00", homeLabel: "2° A", awayLabel: "2° B" },
  { id: "m74", stage: "r32", date: "2026-06-29", kickoff: "2026-06-29T16:30:00-04:00", homeLabel: "1° E", awayLabel: "3° A/B/C/D/F" },
  { id: "m75", stage: "r32", date: "2026-06-29", kickoff: "2026-06-29T21:00:00-04:00", homeLabel: "1° F", awayLabel: "2° C" },
  { id: "m76", stage: "r32", date: "2026-06-29", kickoff: "2026-06-29T13:00:00-04:00", homeLabel: "1° C", awayLabel: "2° F" },
  { id: "m77", stage: "r32", date: "2026-06-30", kickoff: "2026-06-30T17:00:00-04:00", homeLabel: "1° I", awayLabel: "3° C/D/F/G/H" },
  { id: "m78", stage: "r32", date: "2026-06-30", kickoff: "2026-06-30T13:00:00-04:00", homeLabel: "2° E", awayLabel: "2° I" },
  { id: "m79", stage: "r32", date: "2026-06-30", kickoff: "2026-06-30T21:00:00-04:00", homeLabel: "1° A", awayLabel: "3° C/E/F/H/I" },
  { id: "m80", stage: "r32", date: "2026-07-01", kickoff: "2026-07-01T12:00:00-04:00", homeLabel: "1° L", awayLabel: "3° E/H/I/J/K" },
  { id: "m81", stage: "r32", date: "2026-07-01", kickoff: "2026-07-01T20:00:00-04:00", homeLabel: "1° D", awayLabel: "3° B/E/F/I/J" },
  { id: "m82", stage: "r32", date: "2026-07-01", kickoff: "2026-07-01T16:00:00-04:00", homeLabel: "1° G", awayLabel: "3° A/E/H/I/J" },
  { id: "m83", stage: "r32", date: "2026-07-02", kickoff: "2026-07-02T19:00:00-04:00", homeLabel: "2° K", awayLabel: "2° L" },
  { id: "m84", stage: "r32", date: "2026-07-02", kickoff: "2026-07-02T15:00:00-04:00", homeLabel: "1° H", awayLabel: "2° J" },
  { id: "m85", stage: "r32", date: "2026-07-02", kickoff: "2026-07-02T23:00:00-04:00", homeLabel: "1° B", awayLabel: "3° E/F/G/I/J" },
  { id: "m86", stage: "r32", date: "2026-07-03", kickoff: "2026-07-03T18:00:00-04:00", homeLabel: "1° J", awayLabel: "2° H" },
  { id: "m87", stage: "r32", date: "2026-07-03", kickoff: "2026-07-03T21:30:00-04:00", homeLabel: "1° K", awayLabel: "3° D/E/I/J/L" },
  { id: "m88", stage: "r32", date: "2026-07-03", kickoff: "2026-07-03T14:00:00-04:00", homeLabel: "2° D", awayLabel: "2° G" },

  // ---- Octavos / Ronda de 16 (4–7 jul) ----
  { id: "m89", stage: "r16", date: "2026-07-04", kickoff: "2026-07-04T15:00:00-04:00", homeLabel: "Gana P74", awayLabel: "Gana P77" },
  { id: "m90", stage: "r16", date: "2026-07-04", kickoff: "2026-07-04T19:00:00-04:00", homeLabel: "Gana P73", awayLabel: "Gana P75" },
  { id: "m91", stage: "r16", date: "2026-07-05", kickoff: "2026-07-05T15:00:00-04:00", homeLabel: "Gana P76", awayLabel: "Gana P78" },
  { id: "m92", stage: "r16", date: "2026-07-05", kickoff: "2026-07-05T19:00:00-04:00", homeLabel: "Gana P79", awayLabel: "Gana P80" },
  { id: "m93", stage: "r16", date: "2026-07-06", kickoff: "2026-07-06T15:00:00-04:00", homeLabel: "Gana P83", awayLabel: "Gana P84" },
  { id: "m94", stage: "r16", date: "2026-07-06", kickoff: "2026-07-06T19:00:00-04:00", homeLabel: "Gana P81", awayLabel: "Gana P82" },
  { id: "m95", stage: "r16", date: "2026-07-07", kickoff: "2026-07-07T15:00:00-04:00", homeLabel: "Gana P86", awayLabel: "Gana P88" },
  { id: "m96", stage: "r16", date: "2026-07-07", kickoff: "2026-07-07T19:00:00-04:00", homeLabel: "Gana P85", awayLabel: "Gana P87" },

  // ---- Cuartos de final (9–11 jul) ----
  { id: "m97", stage: "qf", date: "2026-07-09", kickoff: "2026-07-09T16:00:00-04:00", homeLabel: "Gana P89", awayLabel: "Gana P90" },
  { id: "m98", stage: "qf", date: "2026-07-10", kickoff: "2026-07-10T15:00:00-04:00", homeLabel: "Gana P93", awayLabel: "Gana P94" },
  { id: "m99", stage: "qf", date: "2026-07-11", kickoff: "2026-07-11T17:00:00-04:00", homeLabel: "Gana P91", awayLabel: "Gana P92" },
  { id: "m100", stage: "qf", date: "2026-07-11", kickoff: "2026-07-11T21:00:00-04:00", homeLabel: "Gana P95", awayLabel: "Gana P96" },

  // ---- Semifinales (14–15 jul) ----
  { id: "m101", stage: "sf", date: "2026-07-14", kickoff: "2026-07-14T15:00:00-04:00", homeLabel: "Gana P97", awayLabel: "Gana P98" },
  { id: "m102", stage: "sf", date: "2026-07-15", kickoff: "2026-07-15T15:00:00-04:00", homeLabel: "Gana P99", awayLabel: "Gana P100" },

  // ---- Tercer puesto (18 jul) ----
  { id: "m103", stage: "third", date: "2026-07-18", kickoff: "2026-07-18T15:00:00-04:00", homeLabel: "Pierde P101", awayLabel: "Pierde P102" },

  // ---- Final (19 jul) ----
  { id: "m104", stage: "final", date: "2026-07-19", kickoff: "2026-07-19T15:00:00-04:00", homeLabel: "Gana P101", awayLabel: "Gana P102" },
];

export function team(code: TeamCode): Team {
  return TEAMS[code];
}

export function matchById(id: string): Match | undefined {
  return MATCHES.find((m) => m.id === id);
}

// ---------------------------------------------------------------------------
// Etapas (fase de grupos + eliminatoria)
// ---------------------------------------------------------------------------

/** Orden de las etapas para listar/ordenar. */
export const STAGE_ORDER: Stage[] = ["group", "r32", "r16", "qf", "sf", "third", "final"];

export function stageOf(m: Match): Stage {
  return m.stage ?? "group";
}

export function isKnockout(m: Match): boolean {
  return stageOf(m) !== "group";
}

/** Nombre largo de la etapa, p.ej. "Dieciseisavos". */
export function stageLabel(stage: Stage): string {
  switch (stage) {
    case "r32": return "Dieciseisavos";
    case "r16": return "Octavos";
    case "qf": return "Cuartos de final";
    case "sf": return "Semifinales";
    case "third": return "Tercer puesto";
    case "final": return "Final";
    default: return "Fase de grupos";
  }
}

/** Etiqueta corta para chips/badges. */
export function stageShort(stage: Stage): string {
  switch (stage) {
    case "r32": return "16avos";
    case "r16": return "Octavos";
    case "qf": return "Cuartos";
    case "sf": return "Semis";
    case "third": return "3er puesto";
    case "final": return "Final";
    default: return "Grupos";
  }
}

// ---------------------------------------------------------------------------
// Resolución de equipos por lado (equipo fijo de grupos, equipo asignado por el
// admin en eliminatoria, o placeholder si aún no se define).
// ---------------------------------------------------------------------------

export interface SideInfo {
  code?: TeamCode; // código del equipo si se conoce
  team?: Team;     // datos del equipo si se conoce (bandera, nombre)
  label: string;   // nombre del equipo si se conoce, si no el placeholder
  known: boolean;  // ¿ya se conoce el equipo?
}

export function sideInfo(
  m: Match,
  side: "home" | "away",
  assigned?: AssignedTeams
): SideInfo {
  const fixed = side === "home" ? m.home : m.away;
  if (fixed && fixed in TEAMS) {
    const t = TEAMS[fixed];
    return { code: fixed, team: t, label: t.name, known: true };
  }
  const code = side === "home" ? assigned?.[m.id]?.home : assigned?.[m.id]?.away;
  if (code && code in TEAMS) {
    const t = TEAMS[code as TeamCode];
    return { code: code as TeamCode, team: t, label: t.name, known: true };
  }
  const label = (side === "home" ? m.homeLabel : m.awayLabel) ?? "Por definir";
  return { label, known: false };
}

/** ¿Se conocen AMBOS equipos del partido? (siempre true en grupos). */
export function teamsKnown(m: Match, assigned?: AssignedTeams): boolean {
  return sideInfo(m, "home", assigned).known && sideInfo(m, "away", assigned).known;
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
