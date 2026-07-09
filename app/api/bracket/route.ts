import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, isServerConfigured } from "@/lib/supabaseAdmin";
import { fetchEffectiveTeams } from "@/lib/bracket";
import { matchById, isKnockout, TEAMS } from "@/lib/matches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" } as const;

interface IncomingTeam {
  match_id: string;
  home: string | null;
  away: string | null;
}

// GET: equipos asignados a las llaves (público — solo dice QUÉ equipos juegan,
// no revela pronósticos). Lo usa /jugar, /tabla y /admin para resolver nombres.
export async function GET() {
  if (!isServerConfigured()) {
    return NextResponse.json({ error: "Servidor sin configurar." }, { status: 500 });
  }
  try {
    const sb = getAdminClient();
    const teams = await fetchEffectiveTeams(sb);
    return NextResponse.json({ ok: true, teams }, { headers: NO_STORE });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error." }, { status: 500 });
  }
}

// POST: el admin asigna/limpia los equipos de las llaves (protegido por ADMIN_PIN).
export async function POST(req: NextRequest) {
  if (!isServerConfigured()) {
    return NextResponse.json(
      { error: "Servidor sin configurar: falta SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return NextResponse.json({ error: "Servidor sin configurar: falta ADMIN_PIN." }, { status: 500 });
  }

  let body: { pin?: string; teams?: IncomingTeam[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (body.pin !== adminPin) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  const incoming = Array.isArray(body.teams) ? body.teams : [];
  const toUpsert: { match_id: string; home: string | null; away: string | null }[] = [];

  const validCode = (v: unknown): v is string => typeof v === "string" && v in TEAMS;

  for (const t of incoming) {
    if (!t || typeof t.match_id !== "string") continue;
    const m = matchById(t.match_id);
    if (!m || !isKnockout(m)) continue; // solo llaves de eliminatoria
    const home = validCode(t.home) ? t.home : null;
    const away = validCode(t.away) ? t.away : null;
    toUpsert.push({ match_id: t.match_id, home, away });
  }

  if (toUpsert.length === 0) {
    return NextResponse.json({ error: "No hay cambios válidos para guardar." }, { status: 400 });
  }

  try {
    const sb = getAdminClient();
    const { error } = await sb
      .from("brackets")
      .upsert(
        toUpsert.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
        { onConflict: "match_id" }
      );
    if (error) throw error;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error guardando." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: toUpsert.length }, { headers: NO_STORE });
}
