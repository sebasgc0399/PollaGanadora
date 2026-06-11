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
  date: string;     // ISO (YYYY-MM-DD)
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

export const MATCHES: Match[] = [
  // ---- Jornada 1 (11–17 jun) ----
  { id: "m01", group: "A", matchday: 1, date: "2026-06-11", home: "MEX", away: "RSA" },
  { id: "m02", group: "A", matchday: 1, date: "2026-06-11", home: "KOR", away: "CZE" },
  { id: "m03", group: "B", matchday: 1, date: "2026-06-12", home: "CAN", away: "BIH" },
  { id: "m04", group: "D", matchday: 1, date: "2026-06-12", home: "USA", away: "PAR" },
  { id: "m05", group: "B", matchday: 1, date: "2026-06-13", home: "QAT", away: "SUI" },
  { id: "m06", group: "C", matchday: 1, date: "2026-06-13", home: "BRA", away: "MAR" },
  { id: "m07", group: "C", matchday: 1, date: "2026-06-13", home: "HAI", away: "SCO" },
  { id: "m08", group: "D", matchday: 1, date: "2026-06-13", home: "AUS", away: "TUR" },
  { id: "m09", group: "E", matchday: 1, date: "2026-06-14", home: "GER", away: "CUW" },
  { id: "m10", group: "F", matchday: 1, date: "2026-06-14", home: "NED", away: "JPN" },
  { id: "m11", group: "E", matchday: 1, date: "2026-06-14", home: "CIV", away: "ECU" },
  { id: "m12", group: "F", matchday: 1, date: "2026-06-14", home: "SWE", away: "TUN" },
  { id: "m13", group: "H", matchday: 1, date: "2026-06-15", home: "ESP", away: "CPV" },
  { id: "m14", group: "G", matchday: 1, date: "2026-06-15", home: "BEL", away: "EGY" },
  { id: "m15", group: "H", matchday: 1, date: "2026-06-15", home: "KSA", away: "URU" },
  { id: "m16", group: "G", matchday: 1, date: "2026-06-15", home: "IRN", away: "NZL" },
  { id: "m17", group: "I", matchday: 1, date: "2026-06-16", home: "FRA", away: "SEN" },
  { id: "m18", group: "I", matchday: 1, date: "2026-06-16", home: "IRQ", away: "NOR" },
  { id: "m19", group: "J", matchday: 1, date: "2026-06-16", home: "ARG", away: "ALG" },
  { id: "m20", group: "J", matchday: 1, date: "2026-06-16", home: "AUT", away: "JOR" },
  { id: "m21", group: "K", matchday: 1, date: "2026-06-17", home: "POR", away: "COD" },
  { id: "m22", group: "L", matchday: 1, date: "2026-06-17", home: "ENG", away: "CRO" },
  { id: "m23", group: "L", matchday: 1, date: "2026-06-17", home: "GHA", away: "PAN" },
  { id: "m24", group: "K", matchday: 1, date: "2026-06-17", home: "UZB", away: "COL" },

  // ---- Jornada 2 (18–23 jun) ----
  { id: "m25", group: "A", matchday: 2, date: "2026-06-18", home: "CZE", away: "RSA" },
  { id: "m26", group: "B", matchday: 2, date: "2026-06-18", home: "SUI", away: "BIH" },
  { id: "m27", group: "B", matchday: 2, date: "2026-06-18", home: "CAN", away: "QAT" },
  { id: "m28", group: "A", matchday: 2, date: "2026-06-18", home: "MEX", away: "KOR" },
  { id: "m29", group: "C", matchday: 2, date: "2026-06-19", home: "SCO", away: "MAR" },
  { id: "m30", group: "D", matchday: 2, date: "2026-06-19", home: "USA", away: "AUS" },
  { id: "m31", group: "C", matchday: 2, date: "2026-06-19", home: "BRA", away: "HAI" },
  { id: "m32", group: "D", matchday: 2, date: "2026-06-19", home: "TUR", away: "PAR" },
  { id: "m33", group: "F", matchday: 2, date: "2026-06-20", home: "NED", away: "SWE" },
  { id: "m34", group: "E", matchday: 2, date: "2026-06-20", home: "GER", away: "CIV" },
  { id: "m35", group: "E", matchday: 2, date: "2026-06-20", home: "ECU", away: "CUW" },
  { id: "m36", group: "F", matchday: 2, date: "2026-06-20", home: "TUN", away: "JPN" },
  { id: "m37", group: "H", matchday: 2, date: "2026-06-21", home: "ESP", away: "KSA" },
  { id: "m38", group: "G", matchday: 2, date: "2026-06-21", home: "BEL", away: "IRN" },
  { id: "m39", group: "H", matchday: 2, date: "2026-06-21", home: "URU", away: "CPV" },
  { id: "m40", group: "G", matchday: 2, date: "2026-06-21", home: "NZL", away: "EGY" },
  { id: "m41", group: "J", matchday: 2, date: "2026-06-22", home: "ARG", away: "AUT" },
  { id: "m42", group: "I", matchday: 2, date: "2026-06-22", home: "FRA", away: "IRQ" },
  { id: "m43", group: "I", matchday: 2, date: "2026-06-22", home: "NOR", away: "SEN" },
  { id: "m44", group: "J", matchday: 2, date: "2026-06-22", home: "JOR", away: "ALG" },
  { id: "m45", group: "K", matchday: 2, date: "2026-06-23", home: "POR", away: "UZB" },
  { id: "m46", group: "L", matchday: 2, date: "2026-06-23", home: "ENG", away: "GHA" },
  { id: "m47", group: "L", matchday: 2, date: "2026-06-23", home: "PAN", away: "CRO" },
  { id: "m48", group: "K", matchday: 2, date: "2026-06-23", home: "COL", away: "COD" },

  // ---- Jornada 3 (24–27 jun) ----
  { id: "m49", group: "B", matchday: 3, date: "2026-06-24", home: "SUI", away: "CAN" },
  { id: "m50", group: "B", matchday: 3, date: "2026-06-24", home: "BIH", away: "QAT" },
  { id: "m51", group: "C", matchday: 3, date: "2026-06-24", home: "SCO", away: "BRA" },
  { id: "m52", group: "C", matchday: 3, date: "2026-06-24", home: "MAR", away: "HAI" },
  { id: "m53", group: "A", matchday: 3, date: "2026-06-24", home: "CZE", away: "MEX" },
  { id: "m54", group: "A", matchday: 3, date: "2026-06-24", home: "RSA", away: "KOR" },
  { id: "m55", group: "E", matchday: 3, date: "2026-06-25", home: "ECU", away: "GER" },
  { id: "m56", group: "E", matchday: 3, date: "2026-06-25", home: "CUW", away: "CIV" },
  { id: "m57", group: "F", matchday: 3, date: "2026-06-25", home: "JPN", away: "SWE" },
  { id: "m58", group: "F", matchday: 3, date: "2026-06-25", home: "TUN", away: "NED" },
  { id: "m59", group: "D", matchday: 3, date: "2026-06-25", home: "TUR", away: "USA" },
  { id: "m60", group: "D", matchday: 3, date: "2026-06-25", home: "PAR", away: "AUS" },
  { id: "m61", group: "I", matchday: 3, date: "2026-06-26", home: "NOR", away: "FRA" },
  { id: "m62", group: "I", matchday: 3, date: "2026-06-26", home: "SEN", away: "IRQ" },
  { id: "m63", group: "H", matchday: 3, date: "2026-06-26", home: "CPV", away: "KSA" },
  { id: "m64", group: "H", matchday: 3, date: "2026-06-26", home: "URU", away: "ESP" },
  { id: "m65", group: "G", matchday: 3, date: "2026-06-26", home: "EGY", away: "IRN" },
  { id: "m66", group: "G", matchday: 3, date: "2026-06-26", home: "NZL", away: "BEL" },
  { id: "m67", group: "L", matchday: 3, date: "2026-06-27", home: "PAN", away: "ENG" },
  { id: "m68", group: "L", matchday: 3, date: "2026-06-27", home: "CRO", away: "GHA" },
  { id: "m69", group: "K", matchday: 3, date: "2026-06-27", home: "COL", away: "POR" },
  { id: "m70", group: "K", matchday: 3, date: "2026-06-27", home: "COD", away: "UZB" },
  { id: "m71", group: "J", matchday: 3, date: "2026-06-27", home: "ALG", away: "AUT" },
  { id: "m72", group: "J", matchday: 3, date: "2026-06-27", home: "JOR", away: "ARG" },
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
