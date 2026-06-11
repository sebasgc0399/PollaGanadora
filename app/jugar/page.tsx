"use client";

import { useEffect, useMemo, useState } from "react";
import { MATCHES, GROUPS } from "@/lib/matches";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import MatchScoreRow from "@/components/MatchScoreRow";
import { pointsFor, hitLabel } from "@/lib/scoring";
import type { PredictionRow, ResultRow } from "@/lib/types";

type Pred = { home: string; away: string };
type Msg = { type: "ok" | "err" | "info"; text: string };

export default function JugarPage() {
  const configured = isSupabaseConfigured();
  const [name, setName] = useState("");
  const [stage, setStage] = useState<"name" | "form">("name");
  const [preds, setPreds] = useState<Record<string, Pred>>({});
  const [results, setResults] = useState<Record<string, ResultRow>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pg_name");
      if (saved) setName(saved);
    } catch {
      /* ignore */
    }
  }, []);

  async function start() {
    const n = name.trim().replace(/\s+/g, " ");
    if (!n) {
      setMsg({ type: "err", text: "Escribe tu nombre para empezar." });
      return;
    }
    if (!configured) {
      setMsg({
        type: "err",
        text: "La base de datos aún no está configurada (mira el README).",
      });
      return;
    }
    setName(n);
    try {
      localStorage.setItem("pg_name", n);
    } catch {
      /* ignore */
    }
    setLoading(true);
    setMsg(null);
    try {
      const sb = getSupabase();
      const [predRes, resRes] = await Promise.all([
        sb.from("predictions").select("match_id,home,away").eq("participant", n),
        sb.from("results").select("match_id,home,away"),
      ]);
      if (predRes.error) throw predRes.error;
      if (resRes.error) throw resRes.error;

      const pmap: Record<string, Pred> = {};
      (predRes.data ?? []).forEach((r) => {
        pmap[r.match_id] = { home: String(r.home), away: String(r.away) };
      });
      setPreds(pmap);

      const rmap: Record<string, ResultRow> = {};
      (resRes.data ?? []).forEach((r: ResultRow) => {
        rmap[r.match_id] = r;
      });
      setResults(rmap);

      setStage("form");
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "Error cargando los datos." });
    } finally {
      setLoading(false);
    }
  }

  function setPred(id: string, home: string, away: string) {
    setPreds((p) => ({ ...p, [id]: { home, away } }));
    setMsg(null);
  }

  const filledCount = useMemo(
    () =>
      MATCHES.filter((m) => {
        const p = preds[m.id];
        return p && p.home !== "" && p.away !== "";
      }).length,
    [preds]
  );

  const lockedCount = useMemo(
    () => MATCHES.filter((m) => results[m.id]).length,
    [results]
  );

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const sb = getSupabase();
      const rows: PredictionRow[] = [];
      let incomplete = 0;
      for (const m of MATCHES) {
        if (results[m.id]) continue; // partido bloqueado: no sobreescribir
        const p = preds[m.id];
        if (!p) continue;
        if (p.home === "" && p.away === "") continue;
        if (p.home === "" || p.away === "") {
          incomplete++;
          continue;
        }
        rows.push({
          participant: name,
          match_id: m.id,
          home: Number(p.home),
          away: Number(p.away),
        });
      }
      if (rows.length === 0) {
        setMsg({
          type: "err",
          text: "No hay marcadores completos para guardar todavía.",
        });
        return;
      }
      const { error } = await sb
        .from("predictions")
        .upsert(rows, { onConflict: "participant,match_id" });
      if (error) throw error;

      let text = `¡Guardado! ${rows.length} predicciones registradas para ${name}.`;
      if (incomplete > 0) {
        text += ` ${incomplete} quedaron a medias y no se guardaron.`;
      }
      setMsg({ type: "ok", text });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  }

  // ----- Pantalla 1: nombre -----
  if (stage === "name") {
    return (
      <div className="mx-auto max-w-md space-y-5 py-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Hacer mis predicciones</h1>
          <p className="mt-1 text-slate-500">
            Escribe tu nombre. Si ya jugaste antes con ese mismo nombre, cargaremos
            tus marcadores para que los edites.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
          className="space-y-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre (ej: Sebastián)"
            autoFocus
            maxLength={40}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none focus:border-pitch-600 focus:ring-2 focus:ring-pitch-600/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-pitch-700 px-4 py-3 text-lg font-semibold text-white shadow transition hover:bg-pitch-800 disabled:opacity-60"
          >
            {loading ? "Cargando…" : "Continuar"}
          </button>
        </form>

        {msg && <Banner msg={msg} />}

        <p className="text-center text-xs text-slate-400">
          Usa siempre el mismo nombre para no crear participantes duplicados.
        </p>
      </div>
    );
  }

  // ----- Pantalla 2: formulario -----
  return (
    <div className="space-y-5 pb-28">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">
            Predicciones de <span className="text-pitch-700">{name}</span>
          </h1>
          <p className="text-sm text-slate-500">
            {filledCount}/{MATCHES.length} partidos llenos
            {lockedCount > 0 && ` · ${lockedCount} ya con resultado (bloqueados)`}
          </p>
        </div>
        <button
          onClick={() => {
            setStage("name");
            setMsg(null);
          }}
          className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Cambiar nombre
        </button>
      </div>

      {msg && <Banner msg={msg} />}

      {GROUPS.map((g) => {
        const groupMatches = MATCHES.filter((m) => m.group === g);
        return (
          <section key={g}>
            <h2 className="sticky top-[57px] z-10 -mx-4 bg-emerald-50/95 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-pitch-800 backdrop-blur">
              Grupo {g}
            </h2>
            <div className="mt-2 space-y-2">
              {groupMatches.map((m) => {
                const p = preds[m.id] ?? { home: "", away: "" };
                const result = results[m.id];
                const locked = !!result;
                return (
                  <MatchScoreRow
                    key={m.id}
                    match={m}
                    home={p.home}
                    away={p.away}
                    disabled={locked}
                    onChange={(h, a) => setPred(m.id, h, a)}
                    footer={
                      locked ? (
                        <LockedFooter
                          resultHome={result.home}
                          resultAway={result.away}
                          pred={p}
                        />
                      ) : null
                    }
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Barra fija de guardado */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-slate-500">
            {filledCount}/{MATCHES.length} llenos
          </span>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-pitch-700 px-6 py-2.5 font-semibold text-white shadow transition hover:bg-pitch-800 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar predicciones"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LockedFooter({
  resultHome,
  resultAway,
  pred,
}: {
  resultHome: number;
  resultAway: number;
  pred: Pred;
}) {
  const hasPred = pred.home !== "" && pred.away !== "";
  const predScore = hasPred
    ? { home: Number(pred.home), away: Number(pred.away) }
    : null;
  const realScore = { home: resultHome, away: resultAway };
  const pts = pointsFor(predScore, realScore);
  const label = hitLabel(predScore, realScore);

  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-1.5 text-xs">
      <span className="font-medium text-slate-600">
        🔒 Resultado: {resultHome}–{resultAway}
      </span>
      {hasPred ? (
        <span
          className={
            "font-semibold " +
            (pts >= 3 ? "text-pitch-700" : pts === 1 ? "text-emerald-600" : "text-slate-400")
          }
        >
          +{pts} pts · {label}
        </span>
      ) : (
        <span className="text-slate-400">sin predicción</span>
      )}
    </div>
  );
}

function Banner({ msg }: { msg: Msg }) {
  const styles =
    msg.type === "ok"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : msg.type === "err"
      ? "border-red-300 bg-red-50 text-red-800"
      : "border-slate-300 bg-slate-50 text-slate-700";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{msg.text}</div>
  );
}
