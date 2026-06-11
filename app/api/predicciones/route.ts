import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, isServerConfigured } from "@/lib/supabaseAdmin";
import { hashClave, verifyClave, normalizeName } from "@/lib/auth";
import { MATCHES, matchById, isMatchLocked } from "@/lib/matches";
import type { ResultRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validGoals(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 99;
}

async function fetchResultsMap() {
  const sb = getAdminClient();
  const { data, error } = await sb.from("results").select("match_id,home,away");
  if (error) throw error;
  const map: Record<string, ResultRow> = {};
  (data ?? []).forEach((r: ResultRow) => (map[r.match_id] = r));
  return map;
}

export async function POST(req: NextRequest) {
  if (!isServerConfigured()) {
    return NextResponse.json(
      { error: "El servidor no está configurado (faltan variables de Supabase)." },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const action = body?.action;
  const name = normalizeName(String(body?.name ?? ""));
  const clave = String(body?.clave ?? "");

  if (name.length < 2 || name.length > 40) {
    return NextResponse.json({ error: "El nombre debe tener entre 2 y 40 caracteres." }, { status: 400 });
  }
  if (clave.length < 3 || clave.length > 64) {
    return NextResponse.json({ error: "La clave debe tener al menos 3 caracteres." }, { status: 400 });
  }

  const sb = getAdminClient();

  // --- Buscar / autenticar participante ---
  const { data: participant, error: pErr } = await sb
    .from("participants")
    .select("name,clave_hash")
    .eq("name", name)
    .maybeSingle();
  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  // ===================== CARGAR =====================
  if (action === "load") {
    let isNew = false;
    if (!participant) {
      // Registrar nuevo participante con su clave
      const { error: insErr } = await sb
        .from("participants")
        .insert({ name, clave_hash: hashClave(clave) });
      if (insErr) {
        // posible carrera: si ya existe, intentamos verificar
        const { data: again } = await sb
          .from("participants")
          .select("clave_hash")
          .eq("name", name)
          .maybeSingle();
        if (!again || !verifyClave(clave, again.clave_hash)) {
          return NextResponse.json({ error: "Clave incorrecta para ese nombre." }, { status: 401 });
        }
      } else {
        isNew = true;
      }
    } else if (!verifyClave(clave, participant.clave_hash)) {
      return NextResponse.json(
        { error: "Clave incorrecta para ese nombre. Si es tu nombre, usa tu clave; si no, elige otro nombre." },
        { status: 401 }
      );
    }

    const [{ data: preds, error: prErr }, results] = await Promise.all([
      sb.from("predictions").select("match_id,home,away").eq("participant", name),
      fetchResultsMap(),
    ]);
    if (prErr) {
      return NextResponse.json({ error: prErr.message }, { status: 500 });
    }

    const predictions: Record<string, { home: number; away: number }> = {};
    (preds ?? []).forEach((r) => (predictions[r.match_id] = { home: r.home, away: r.away }));

    return NextResponse.json({ ok: true, isNew, predictions, results });
  }

  // ===================== GUARDAR =====================
  if (action === "save") {
    if (!participant) {
      return NextResponse.json(
        { error: "Primero ingresa con tu nombre y clave." },
        { status: 401 }
      );
    }
    if (!verifyClave(clave, participant.clave_hash)) {
      return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
    }

    const incoming = Array.isArray(body?.predictions) ? body.predictions : [];
    const results = await fetchResultsMap();
    const now = Date.now();

    const rows: { participant: string; match_id: string; home: number; away: number }[] = [];
    let locked = 0;
    let invalid = 0;

    for (const p of incoming) {
      const m = matchById(String(p?.match_id ?? ""));
      if (!m) {
        invalid++;
        continue;
      }
      if (!validGoals(p?.home) || !validGoals(p?.away)) {
        invalid++;
        continue;
      }
      // Bloqueo validado en el SERVIDOR: ni el reloj del navegador ni una llamada
      // directa pueden saltárselo.
      if (isMatchLocked(m, now, !!results[m.id])) {
        locked++;
        continue;
      }
      rows.push({ participant: name, match_id: m.id, home: p.home, away: p.away });
    }

    if (rows.length > 0) {
      const { error: upErr } = await sb
        .from("predictions")
        .upsert(rows, { onConflict: "participant,match_id" });
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, saved: rows.length, locked, invalid });
  }

  return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
}
