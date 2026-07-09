// ---------------------------------------------------------------------------
// Resolución automática del cuadro eliminatorio.
//
// Cada llave de octavos en adelante se arma sola a partir de los RESULTADOS:
// el ganador (o el perdedor, para el 3er puesto) del partido que la alimenta
// avanza a la siguiente ronda. Así el admin solo carga resultados y no tiene
// que asignar equipos a mano.
//
// Los dieciseisavos (m73–m88) NO se derivan aquí: sus equipos dependen de la
// tabla de grupos (con desempates) y se asignan a mano en la tabla `brackets`.
//
// Excepción: si un partido termina EMPATADO (se definió por penales), el
// marcador no dice quién ganó, así que esa llave queda sin resolver y el admin
// debe asignar a mano el equipo que avanzó (la asignación manual siempre manda).
// ---------------------------------------------------------------------------

import { MATCHES, isKnockout, type AssignedTeams, type TeamCode } from "@/lib/matches";

type Take = "W" | "L"; // W = ganador, L = perdedor
interface Feed {
  from: string;
  take: Take;
}

// De qué partido (y si toma ganador o perdedor) sale cada lado de cada llave.
// Coincide con los homeLabel/awayLabel de MATCHES ("Gana P74", "Pierde P101"…).
export const BRACKET_FEED: Record<string, { home: Feed; away: Feed }> = {
  // Octavos ← ganadores de dieciseisavos
  m89: { home: { from: "m74", take: "W" }, away: { from: "m77", take: "W" } },
  m90: { home: { from: "m73", take: "W" }, away: { from: "m75", take: "W" } },
  m91: { home: { from: "m76", take: "W" }, away: { from: "m78", take: "W" } },
  m92: { home: { from: "m79", take: "W" }, away: { from: "m80", take: "W" } },
  m93: { home: { from: "m83", take: "W" }, away: { from: "m84", take: "W" } },
  m94: { home: { from: "m81", take: "W" }, away: { from: "m82", take: "W" } },
  m95: { home: { from: "m86", take: "W" }, away: { from: "m88", take: "W" } },
  m96: { home: { from: "m85", take: "W" }, away: { from: "m87", take: "W" } },
  // Cuartos ← ganadores de octavos
  m97: { home: { from: "m89", take: "W" }, away: { from: "m90", take: "W" } },
  m98: { home: { from: "m93", take: "W" }, away: { from: "m94", take: "W" } },
  m99: { home: { from: "m91", take: "W" }, away: { from: "m92", take: "W" } },
  m100: { home: { from: "m95", take: "W" }, away: { from: "m96", take: "W" } },
  // Semifinales ← ganadores de cuartos
  m101: { home: { from: "m97", take: "W" }, away: { from: "m98", take: "W" } },
  m102: { home: { from: "m99", take: "W" }, away: { from: "m100", take: "W" } },
  // Tercer puesto ← perdedores de semifinales
  m103: { home: { from: "m101", take: "L" }, away: { from: "m102", take: "L" } },
  // Final ← ganadores de semifinales
  m104: { home: { from: "m101", take: "W" }, away: { from: "m102", take: "W" } },
};

export type ResultsMap = Record<string, { home: number; away: number }>;

/**
 * Combina los equipos asignados a mano (tabla `brackets`, sobre todo los
 * dieciseisavos) con los que se pueden DERIVAR de los resultados, y devuelve
 * el mapa efectivo de equipos por llave.
 *
 * La asignación manual siempre tiene prioridad (útil para partidos por penales).
 */
export function resolveBracket(manual: AssignedTeams, results: ResultsMap): AssignedTeams {
  const out: AssignedTeams = {};
  for (const [id, t] of Object.entries(manual)) {
    out[id] = { home: t.home ?? null, away: t.away ?? null };
  }

  // Ganador/Perdedor de un partido, si se conocen sus equipos y su marcador.
  const decide = (fromId: string): { W: TeamCode; L: TeamCode } | null => {
    const teams = out[fromId];
    const res = results[fromId];
    if (!teams?.home || !teams?.away || !res) return null;
    if (res.home === res.away) return null; // empate (penales): indeterminado
    const homeWon = res.home > res.away;
    return {
      W: (homeWon ? teams.home : teams.away) as TeamCode,
      L: (homeWon ? teams.away : teams.home) as TeamCode,
    };
  };

  // MATCHES va en orden (m73→m104) y cada llave se alimenta de partidos
  // anteriores, así que una sola pasada hacia adelante resuelve toda la cadena.
  for (const m of MATCHES) {
    if (!isKnockout(m)) continue;
    const feed = BRACKET_FEED[m.id];
    if (!feed) continue;
    const cur = out[m.id] ?? { home: null, away: null };
    (["home", "away"] as const).forEach((side) => {
      if (cur[side]) return; // ya asignado (manual o resuelto antes): no tocar
      const wl = decide(feed[side].from);
      if (wl) cur[side] = wl[feed[side].take];
    });
    out[m.id] = cur;
  }

  return out;
}
