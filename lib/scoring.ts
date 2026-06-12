// ---------------------------------------------------------------------------
// Reglas de puntaje de la Polla Ganadora
//
//  • Marcador EXACTO (incluye empates con el marcador exacto) ..... 3 puntos
//  • Acertaste el resultado (ganador correcto, o empate pero con
//    otro marcador) ............................................... 1 punto
//  • No acertaste el resultado .................................... 0 puntos
// ---------------------------------------------------------------------------

export interface Score {
  home: number;
  away: number;
}

export const POINTS = {
  EXACT: 3,
  OUTCOME: 1,
  MISS: 0,
} as const;

/** -1 gana visitante, 0 empate, 1 gana local. */
function outcome(s: Score): -1 | 0 | 1 {
  if (s.home > s.away) return 1;
  if (s.home < s.away) return -1;
  return 0;
}

/**
 * Calcula los puntos de una predicción frente al resultado real.
 * Devuelve 0 si falta la predicción o el resultado.
 */
export function pointsFor(prediction?: Score | null, result?: Score | null): number {
  if (!prediction || !result) return 0;
  if (!isValidScore(prediction) || !isValidScore(result)) return 0;

  // Marcador exacto (incluye empates exactos) → 3
  if (prediction.home === result.home && prediction.away === result.away) {
    return POINTS.EXACT;
  }

  // Acertaste el resultado: ganador correcto, o empate pero con otro marcador → 1
  if (outcome(prediction) === outcome(result)) {
    return POINTS.OUTCOME;
  }

  return POINTS.MISS;
}

/** Etiqueta del tipo de acierto, útil para mostrar en la tabla. */
export function hitLabel(prediction?: Score | null, result?: Score | null): "exacto" | "empate" | "ganador" | "fallo" | "—" {
  if (!prediction || !result) return "—";
  const pts = pointsFor(prediction, result);
  if (pts === 0) return "fallo";
  if (prediction.home === result.home && prediction.away === result.away) return "exacto";
  return outcome(result) === 0 ? "empate" : "ganador";
}

export function isValidScore(s?: Score | null): s is Score {
  return (
    !!s &&
    Number.isInteger(s.home) &&
    Number.isInteger(s.away) &&
    s.home >= 0 &&
    s.away >= 0
  );
}
