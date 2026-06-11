import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, isServerConfigured } from "@/lib/supabaseAdmin";
import { normalizeName } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Flujo "olvidé mi clave":
//   - request: el jugador pide reiniciar su clave (no requiere PIN).
//   - list/approve/reject: solo el admin (con ADMIN_PIN).
// Aprobar = borrar el participante (sus predicciones se conservan); así puede
// volver a registrarse con una clave nueva y sus marcadores reaparecen.

export async function POST(req: NextRequest) {
  if (!isServerConfigured()) {
    return NextResponse.json({ error: "Servidor sin configurar." }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const action = body?.action;
  const sb = getAdminClient();

  // ---- Jugador: pedir reinicio ----
  if (action === "request") {
    const name = normalizeName(String(body?.name ?? ""));
    if (name.length < 2) {
      return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
    }
    // Solo marca si el participante existe; si no, respondemos igual (sin filtrar).
    const { data: p } = await sb
      .from("participants")
      .select("name")
      .eq("name", name)
      .maybeSingle();
    if (p) {
      const { error } = await sb
        .from("participants")
        .update({ reset_requested_at: new Date().toISOString() })
        .eq("name", name);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ---- Admin: a partir de aquí se exige PIN ----
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return NextResponse.json({ error: "Falta ADMIN_PIN en el servidor." }, { status: 500 });
  }
  if (body?.pin !== adminPin) {
    return NextResponse.json({ error: "PIN incorrecto." }, { status: 401 });
  }

  if (action === "list") {
    const { data, error } = await sb
      .from("participants")
      .select("name,reset_requested_at")
      .not("reset_requested_at", "is", null)
      .order("reset_requested_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, requests: data ?? [] });
  }

  if (action === "approve") {
    const name = normalizeName(String(body?.name ?? ""));
    // Borrar el participante; las predicciones (por nombre) se conservan.
    const { error } = await sb.from("participants").delete().eq("name", name);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    const name = normalizeName(String(body?.name ?? ""));
    const { error } = await sb
      .from("participants")
      .update({ reset_requested_at: null })
      .eq("name", name);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
}
