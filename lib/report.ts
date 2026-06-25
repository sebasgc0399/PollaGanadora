// Construye el mensaje del reporte diario (quién falta por pronosticar hoy +
// tabla de posiciones), listo para compartir por WhatsApp. Función pura, sin
// dependencias de servidor, así se puede usar tanto en /reporte como en /tabla.

import { team, matchById, type TeamCode } from "@/lib/matches";

export const SITE = "https://polla-ganadora.vercel.app";

export interface ReportStanding {
  participant: string;
  points: number;
}

export interface ReportPending {
  today: string; // YYYY-MM-DD (hora del Este)
  openCount: number;
  openMatches: { id: string; home: string; away: string }[];
  totalParticipants: number;
  pending: { name: string; missing: number }[];
}

function medal(i: number): string {
  return i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
}

function prettyDate(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(y, mo - 1, d));
}

export function buildReportMessage(
  standings: ReportStanding[],
  pend: ReportPending | null
): string {
  const lines: string[] = [];
  const fecha = pend ? prettyDate(pend.today) : "";
  lines.push(`📋 *Polla Ganadora*${fecha ? ` — ${fecha}` : ""}`);
  lines.push("");

  // --- Quién falta por pronosticar hoy ---
  if (!pend || pend.openCount === 0) {
    lines.push("⚽ Hoy no hay partidos abiertos para pronosticar.");
  } else if (pend.pending.length === 0) {
    lines.push(
      `✅ ¡Todos al día! Los ${pend.totalParticipants} ya pusieron sus pronósticos de hoy.`
    );
  } else {
    const matchNames = pend.openMatches
      .map((m) => `${team(m.home as TeamCode).name} vs ${team(m.away as TeamCode).name}`)
      .join(", ");
    lines.push(
      `⏳ *Faltan por pronosticar hoy* (${pend.openCount} partido${
        pend.openCount === 1 ? "" : "s"
      }: ${matchNames}):`
    );
    for (const p of pend.pending) {
      lines.push(`• ${p.name}${pend.openCount > 1 ? ` (le faltan ${p.missing})` : ""}`);
    }
  }

  // --- Tabla ---
  if (standings.length > 0) {
    lines.push("");
    lines.push("🏆 *Tabla de posiciones*");
    standings.forEach((s, i) => {
      lines.push(`${medal(i)} ${s.participant} — ${s.points} pts`);
    });
  }

  lines.push("");
  lines.push(`👉 ${SITE}/tabla`);
  return lines.join("\n");
}

// --- Pronósticos de los partidos EN JUEGO ahora ---

export interface ReportLive {
  match_id: string;
  home: number; // marcador en vivo
  away: number;
  detail: string; // "45'", "HT", …
}

export interface ReportDetailRow {
  match_id: string;
  home: number; // predicción del participante
  away: number;
  pts: number;
  label: string;
  state: "final" | "live";
}

export interface ReportStandingDetail {
  participant: string;
  detail: ReportDetailRow[];
}

function ptsIcon(pts: number): string {
  return pts >= 3 ? "🎯" : pts === 1 ? "✅" : "▪️";
}

/**
 * Mensaje con el pronóstico de CADA participante para los partidos que están
 * en juego en este momento. Soporta varios partidos a la vez. Devuelve "" si
 * no hay nada en vivo.
 */
export function buildLiveMessage(
  standings: ReportStandingDetail[],
  live: ReportLive[]
): string {
  if (!live || live.length === 0) return "";

  const blocks: string[] = ["🔴 *EN JUEGO AHORA* · Polla Ganadora", ""];

  for (const lv of live) {
    const m = matchById(lv.match_id);
    if (!m) continue;
    const h = team(m.home as TeamCode).name;
    const a = team(m.away as TeamCode).name;
    blocks.push(`⚽ *${h} ${lv.home}-${lv.away} ${a}*${lv.detail ? ` (${lv.detail})` : ""}`);

    // Pronóstico de cada participante para este partido (los que ya lo tienen).
    const picks = standings
      .map((s) => {
        const row = s.detail.find((d) => d.match_id === lv.match_id && d.state === "live");
        return row
          ? { name: s.participant, home: row.home, away: row.away, pts: row.pts }
          : null;
      })
      .filter((p): p is { name: string; home: number; away: number; pts: number } => p !== null)
      .sort((x, y) => y.pts - x.pts || x.name.localeCompare(y.name));

    if (picks.length === 0) {
      blocks.push("_Nadie pronosticó este partido._");
    } else {
      for (const p of picks) {
        blocks.push(`${ptsIcon(p.pts)} ${p.name}: ${p.home}-${p.away} (+${p.pts})`);
      }
    }
    blocks.push("");
  }

  blocks.push(`👉 ${SITE}/tabla`);
  return blocks.join("\n");
}

/**
 * Comparte el texto: usa el menú nativo del dispositivo (Web Share API, ideal
 * en móvil para elegir el grupo de WhatsApp) y, si no está disponible (p.ej.
 * escritorio), abre WhatsApp Web con el mensaje ya escrito.
 */
export async function shareReport(text: string): Promise<void> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.share) {
    try {
      await nav.share({ text });
      return;
    } catch {
      // el usuario canceló el menú de compartir → no hacemos nada
      return;
    }
  }
  if (typeof window !== "undefined") {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }
}
