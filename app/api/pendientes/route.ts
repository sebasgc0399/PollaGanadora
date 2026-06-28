import { NextResponse } from "next/server";
import { getAdminClient, isServerConfigured } from "@/lib/supabaseAdmin";
import { MATCHES, lockTimeMs, isKnockout, teamsKnown, sideInfo } from "@/lib/matches";
import { fetchAssignedTeams } from "@/lib/bracket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" } as const;

// Devuelve, para los partidos de HOY que aún se pueden pronosticar (no
// bloqueados), qué participantes registrados todavía no han puesto su
// predicción. Sirve para el reporte diario que se comparte por WhatsApp.

function todayET(): string {
  // Fecha "de hoy" en horario del Este (la zona en que está fechado el fixture).
  // en-CA da el formato YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET() {
  if (!isServerConfigured()) {
    return NextResponse.json({ error: "El servidor no está configurado." }, { status: 500 });
  }

  const sb = getAdminClient();
  const now = Date.now();
  const today = todayET();

  const assigned = await fetchAssignedTeams(sb);

  // Partidos de hoy que aún se pueden pronosticar (falta para el cierre). En
  // eliminatoria solo cuentan los que ya tienen sus dos equipos definidos.
  const open = MATCHES.filter(
    (m) =>
      m.date === today &&
      lockTimeMs(m) > now &&
      (!isKnockout(m) || teamsKnown(m, assigned))
  );
  const openIds = open.map((m) => m.id);

  const [pRes, prRes] = await Promise.all([
    sb.from("participants").select("name"),
    openIds.length > 0
      ? sb.from("predictions").select("participant,match_id").in("match_id", openIds)
      : Promise.resolve({ data: [] as { participant: string; match_id: string }[], error: null }),
  ]);
  if (pRes.error) return NextResponse.json({ error: pRes.error.message }, { status: 500 });
  if (prRes.error) return NextResponse.json({ error: prRes.error.message }, { status: 500 });

  const participants = (pRes.data ?? []).map((r: { name: string }) => r.name);
  const has = new Set<string>();
  for (const r of (prRes.data ?? []) as { participant: string; match_id: string }[]) {
    has.add(`${r.participant}|${r.match_id}`);
  }

  const pending = participants
    .map((name) => ({
      name,
      missing: openIds.filter((id) => !has.has(`${name}|${id}`)).length,
    }))
    .filter((p) => p.missing > 0)
    .sort((a, b) => b.missing - a.missing || a.name.localeCompare(b.name));

  return NextResponse.json(
    {
      ok: true,
      today,
      openCount: open.length,
      openMatches: open.map((m) => ({
        id: m.id,
        label: `${sideInfo(m, "home", assigned).label} vs ${sideInfo(m, "away", assigned).label}`,
      })),
      totalParticipants: participants.length,
      pending,
    },
    { headers: NO_STORE }
  );
}
