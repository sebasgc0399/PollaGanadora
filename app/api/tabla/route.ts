import { NextResponse } from "next/server";
import { getAdminClient, isServerConfigured } from "@/lib/supabaseAdmin";
import { pointsFor, hitLabel } from "@/lib/scoring";
import type { PredictionRow, ResultRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DetailRow {
  match_id: string;
  home: number; // predicción del jugador (partido ya tiene resultado → revelar es seguro)
  away: number;
  pts: number;
  label: string;
}

export async function GET() {
  if (!isServerConfigured()) {
    return NextResponse.json(
      { error: "El servidor no está configurado." },
      { status: 500 }
    );
  }

  const sb = getAdminClient();
  const [predRes, resRes] = await Promise.all([
    sb.from("predictions").select("participant,match_id,home,away"),
    sb.from("results").select("match_id,home,away"),
  ]);
  if (predRes.error) return NextResponse.json({ error: predRes.error.message }, { status: 500 });
  if (resRes.error) return NextResponse.json({ error: resRes.error.message }, { status: 500 });

  const results: Record<string, ResultRow> = {};
  (resRes.data ?? []).forEach((r: ResultRow) => (results[r.match_id] = r));

  // Agrupar predicciones por participante
  const byParticipant = new Map<string, PredictionRow[]>();
  for (const p of (predRes.data ?? []) as PredictionRow[]) {
    if (!byParticipant.has(p.participant)) byParticipant.set(p.participant, []);
    byParticipant.get(p.participant)!.push(p);
  }

  const standings = [];
  for (const [participant, preds] of byParticipant) {
    let points = 0,
      exact = 0,
      draws = 0,
      outcomes = 0,
      scored = 0;
    const detail: DetailRow[] = [];
    for (const p of preds) {
      const res = results[p.match_id];
      if (!res) continue; // NO se revelan predicciones de partidos sin resultado
      scored++;
      const pred = { home: p.home, away: p.away };
      const pts = pointsFor(pred, res);
      const label = hitLabel(pred, res);
      points += pts;
      if (label === "exacto") exact++;
      else if (label === "empate") draws++;
      else if (label === "ganador") outcomes++;
      detail.push({ match_id: p.match_id, home: p.home, away: p.away, pts, label });
    }
    standings.push({ participant, points, exact, draws, outcomes, scored, detail });
  }

  standings.sort(
    (a, b) =>
      b.points - a.points ||
      b.exact - a.exact ||
      b.draws + b.outcomes - (a.draws + a.outcomes) ||
      a.participant.localeCompare(b.participant)
  );

  return NextResponse.json({
    ok: true,
    resultsCount: Object.keys(results).length,
    results,
    standings,
  });
}
