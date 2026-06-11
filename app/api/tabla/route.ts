import { NextResponse } from "next/server";
import { getAdminClient, isServerConfigured } from "@/lib/supabaseAdmin";
import { pointsFor, hitLabel } from "@/lib/scoring";
import { fetchLiveScores } from "@/lib/espn";
import { MATCHES } from "@/lib/matches";
import type { PredictionRow, ResultRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DetailRow {
  match_id: string;
  home: number; // predicción del jugador
  away: number;
  pts: number;
  label: string;
  state: "final" | "live";
}

export async function GET() {
  if (!isServerConfigured()) {
    return NextResponse.json({ error: "El servidor no está configurado." }, { status: 500 });
  }

  const sb = getAdminClient();
  const [predRes, resRes, live] = await Promise.all([
    sb.from("predictions").select("participant,match_id,home,away"),
    sb.from("results").select("match_id,home,away"),
    fetchLiveScores(),
  ]);
  if (predRes.error) return NextResponse.json({ error: predRes.error.message }, { status: 500 });
  if (resRes.error) return NextResponse.json({ error: resRes.error.message }, { status: 500 });

  const dbResults: Record<string, ResultRow> = {};
  (resRes.data ?? []).forEach((r: ResultRow) => (dbResults[r.match_id] = r));

  // Auto-guardar en la base los partidos que ESPN ya da por FINALIZADOS y que
  // aún no estaban (idempotente: solo una vez por partido). El admin puede
  // corregir luego a mano; un resultado en `results` siempre manda sobre ESPN.
  const toPersist = MATCHES.filter((m) => live[m.id]?.state === "final" && !dbResults[m.id]).map(
    (m) => ({ match_id: m.id, home: live[m.id].home, away: live[m.id].away })
  );
  if (toPersist.length > 0) {
    const { error } = await sb.from("results").upsert(toPersist, { onConflict: "match_id" });
    if (!error) toPersist.forEach((r) => (dbResults[r.match_id] = r));
  }

  // Marcador EFECTIVO por partido: la base (admin/auto) manda; si no, lo EN VIVO.
  const effective: Record<string, { home: number; away: number; state: "final" | "live" }> = {};
  const liveList: { match_id: string; home: number; away: number; detail: string }[] = [];
  for (const m of MATCHES) {
    if (dbResults[m.id]) {
      effective[m.id] = { home: dbResults[m.id].home, away: dbResults[m.id].away, state: "final" };
    } else {
      const l = live[m.id];
      if (l && l.state === "live") {
        effective[m.id] = { home: l.home, away: l.away, state: "live" };
        liveList.push({ match_id: m.id, home: l.home, away: l.away, detail: l.detail });
      }
    }
  }

  // Agrupar predicciones por participante
  const byParticipant = new Map<string, PredictionRow[]>();
  for (const p of (predRes.data ?? []) as PredictionRow[]) {
    if (!byParticipant.has(p.participant)) byParticipant.set(p.participant, []);
    byParticipant.get(p.participant)!.push(p);
  }

  const standings = [];
  for (const [participant, preds] of byParticipant) {
    let points = 0, exact = 0, draws = 0, outcomes = 0, scored = 0, liveScored = 0;
    const detail: DetailRow[] = [];
    for (const p of preds) {
      const eff = effective[p.match_id];
      if (!eff) continue; // no se revela nada de partidos sin marcador
      const pred = { home: p.home, away: p.away };
      const res = { home: eff.home, away: eff.away };
      const pts = pointsFor(pred, res);
      const label = hitLabel(pred, res);
      points += pts;
      scored++;
      if (eff.state === "live") liveScored++;
      if (label === "exacto") exact++;
      else if (label === "empate") draws++;
      else if (label === "ganador") outcomes++;
      detail.push({ match_id: p.match_id, home: p.home, away: p.away, pts, label, state: eff.state });
    }
    standings.push({ participant, points, exact, draws, outcomes, scored, liveScored, detail });
  }

  standings.sort(
    (a, b) =>
      b.points - a.points ||
      b.exact - a.exact ||
      b.draws + b.outcomes - (a.draws + a.outcomes) ||
      a.participant.localeCompare(b.participant)
  );

  const finalCount = Object.values(effective).filter((e) => e.state === "final").length;

  return NextResponse.json({
    ok: true,
    results: effective,
    live: liveList,
    liveCount: liveList.length,
    finalCount,
    standings,
  });
}
