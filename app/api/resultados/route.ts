import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, isServerConfigured } from "@/lib/supabaseAdmin";
import { matchById } from "@/lib/matches";
import type { ResultRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IncomingResult {
  match_id: string;
  home: number | null;
  away: number | null;
}

function isValidGoals(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 99;
}

// GET: lista de resultados (públicos) para precargar el panel Admin.
export async function GET() {
  if (!isServerConfigured()) {
    return NextResponse.json({ error: "Servidor sin configurar." }, { status: 500 });
  }
  const sb = getAdminClient();
  const { data, error } = await sb.from("results").select("match_id,home,away");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results: Record<string, ResultRow> = {};
  (data ?? []).forEach((r: ResultRow) => (results[r.match_id] = r));
  return NextResponse.json({ ok: true, results });
}

// POST: el admin carga/borra resultados (protegido por ADMIN_PIN).
export async function POST(req: NextRequest) {
  if (!isServerConfigured()) {
    return NextResponse.json(
      { error: "Servidor sin configurar: falta SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return NextResponse.json(
      { error: "Servidor sin configurar: falta ADMIN_PIN." },
      { status: 500 }
    );
  }

  let body: { pin?: string; results?: IncomingResult[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (body.pin !== adminPin) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  const results = Array.isArray(body.results) ? body.results : [];
  const toUpsert: { match_id: string; home: number; away: number }[] = [];
  const toDelete: string[] = [];

  for (const r of results) {
    if (!r || typeof r.match_id !== "string" || !matchById(r.match_id)) continue;
    if (r.home === null || r.away === null) {
      toDelete.push(r.match_id);
    } else if (isValidGoals(r.home) && isValidGoals(r.away)) {
      toUpsert.push({ match_id: r.match_id, home: r.home, away: r.away });
    }
  }

  const supabase = getAdminClient();

  try {
    if (toUpsert.length > 0) {
      const { error } = await supabase
        .from("results")
        .upsert(toUpsert, { onConflict: "match_id" });
      if (error) throw error;
    }
    if (toDelete.length > 0) {
      const { error } = await supabase.from("results").delete().in("match_id", toDelete);
      if (error) throw error;
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Error guardando resultados." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    upserted: toUpsert.length,
    deleted: toDelete.length,
  });
}
