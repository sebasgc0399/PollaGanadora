import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, isServerConfigured } from "@/lib/supabaseAdmin";
import { fetchLiveScores } from "@/lib/espn";
import { fetchAssignedTeams } from "@/lib/bracket";
import { MATCHES } from "@/lib/matches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sincroniza con ESPN y guarda en `results` los partidos ya FINALIZADOS.
// Idempotente. Opcional: la /tabla ya hace esto cuando alguien la abre, pero
// este endpoint sirve para un cron externo (cron-job.org / Supabase pg_cron)
// que persista los finales aunque nadie tenga la tabla abierta.
//
// Protección: si defines CRON_SECRET, exige header "Authorization: Bearer <secret>"
// o ?secret=<secret>. Si no la defines, queda abierto (no hace daño: solo guarda
// marcadores finales reales de ESPN, que el admin puede corregir).

async function runSync() {
  const sb = getAdminClient();
  const [resRes, assigned] = await Promise.all([
    sb.from("results").select("match_id"),
    fetchAssignedTeams(sb),
  ]);
  const live = await fetchLiveScores(assigned);
  const have = new Set((resRes.data ?? []).map((r: { match_id: string }) => r.match_id));

  const toPersist = MATCHES.filter(
    (m) => live[m.id]?.state === "final" && !have.has(m.id)
  ).map((m) => ({ match_id: m.id, home: live[m.id].home, away: live[m.id].away }));

  let upserted = 0;
  if (toPersist.length > 0) {
    const { error } = await sb.from("results").upsert(toPersist, { onConflict: "match_id" });
    if (error) throw error;
    upserted = toPersist.length;
  }
  const liveCount = Object.values(live).filter((l) => l.state === "live").length;
  return { upserted, liveCount, persisted: toPersist.map((t) => t.match_id) };
}

async function handle(req: NextRequest) {
  if (!isServerConfigured()) {
    return NextResponse.json({ error: "Servidor sin configurar." }, { status: 500 });
  }
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const qs = new URL(req.url).searchParams.get("secret");
    if (auth !== `Bearer ${secret}` && qs !== secret) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
  }
  try {
    const r = await runSync();
    return NextResponse.json({ ok: true, ...r });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error en la sincronización." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
