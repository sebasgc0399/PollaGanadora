"use client";

import { useEffect, useMemo, useState } from "react";
import { MATCHES, GROUPS } from "@/lib/matches";
import MatchScoreRow from "@/components/MatchScoreRow";

type Sc = { home: string; away: string };
type Msg = { type: "ok" | "err" | "info"; text: string };

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [scores, setScores] = useState<Record<string, Sc>>({});
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [resetReqs, setResetReqs] = useState<{ name: string; reset_requested_at: string }[]>([]);

  useEffect(() => {
    let stored = "";
    try {
      stored = localStorage.getItem("pg_admin_pin") ?? "";
      if (stored) setPin(stored);
    } catch {
      /* ignore */
    }
    load();
    if (stored) loadResets(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadResets(p = pin) {
    if (!p.trim()) {
      return setMsg({ type: "err", text: "Escribe el PIN para ver las solicitudes." });
    }
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", pin: p.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "No se pudieron cargar las solicitudes.");
      setResetReqs(data.requests ?? []);
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "Error cargando solicitudes." });
    }
  }

  async function resolveReset(name: string, action: "approve" | "reject") {
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, pin: pin.trim(), name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "No se pudo procesar.");
      setMsg({
        type: "ok",
        text:
          action === "approve"
            ? `Clave de "${name}" reiniciada. Pídele que entre con una clave NUEVA.`
            : `Solicitud de "${name}" rechazada.`,
      });
      loadResets();
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "Error." });
    }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/resultados", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error cargando resultados.");
      const map: Record<string, Sc> = {};
      const ids = new Set<string>();
      Object.values(data.results ?? {}).forEach((r: any) => {
        map[r.match_id] = { home: String(r.home), away: String(r.away) };
        ids.add(r.match_id);
      });
      setScores(map);
      setInitialIds(ids);
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "Error cargando resultados." });
    } finally {
      setLoading(false);
    }
  }

  function setScore(id: string, home: string, away: string) {
    setScores((s) => ({ ...s, [id]: { home, away } }));
    setMsg(null);
  }

  const savedCount = useMemo(
    () =>
      MATCHES.filter((m) => {
        const s = scores[m.id];
        return s && s.home !== "" && s.away !== "";
      }).length,
    [scores]
  );

  async function save() {
    if (!pin.trim()) {
      setMsg({ type: "err", text: "Escribe el PIN de administrador." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      try {
        localStorage.setItem("pg_admin_pin", pin.trim());
      } catch {
        /* ignore */
      }

      const payload: { match_id: string; home: number | null; away: number | null }[] = [];
      let incomplete = 0;
      for (const m of MATCHES) {
        const s = scores[m.id] ?? { home: "", away: "" };
        const filled = s.home !== "" && s.away !== "";
        const empty = s.home === "" && s.away === "";
        if (filled) {
          payload.push({ match_id: m.id, home: Number(s.home), away: Number(s.away) });
        } else if (empty && initialIds.has(m.id)) {
          // se borró un resultado que existía
          payload.push({ match_id: m.id, home: null, away: null });
        } else if (!empty) {
          incomplete++;
        }
      }

      if (payload.length === 0) {
        setMsg({ type: "err", text: "No hay cambios para guardar." });
        return;
      }

      const res = await fetch("/api/resultados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim(), results: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar.");

      // refrescar estado base
      const ids = new Set<string>();
      MATCHES.forEach((m) => {
        const s = scores[m.id];
        if (s && s.home !== "" && s.away !== "") ids.add(m.id);
      });
      setInitialIds(ids);

      let text = `Guardado: ${data.upserted} resultado(s) actualizado(s)`;
      if (data.deleted) text += `, ${data.deleted} borrado(s)`;
      if (incomplete) text += `. ${incomplete} quedaron a medias y se ignoraron`;
      setMsg({ type: "ok", text: text + "." });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-28">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Cargar resultados</h1>
        <p className="text-sm text-slate-500">
          Solo el administrador. Escribe el PIN, llena los marcadores reales y
          guarda. Deja un partido en blanco para borrar su resultado.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-medium text-slate-600">
          PIN de administrador
        </label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-pitch-600 focus:ring-2 focus:ring-pitch-600/30 sm:max-w-xs"
        />
        <p className="mt-1 text-xs text-slate-400">
          Se define con la variable <code className="font-mono">ADMIN_PIN</code> en Vercel.
        </p>
      </div>

      {msg && (
        <div
          className={
            "rounded-xl border px-4 py-3 text-sm " +
            (msg.type === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : msg.type === "err"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-slate-300 bg-slate-50 text-slate-700")
          }
        >
          {msg.text}
        </div>
      )}

      {/* Solicitudes de reinicio de clave */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold text-slate-700">
            Solicitudes de clave
            {resetReqs.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {resetReqs.length}
              </span>
            )}
          </h2>
          <button
            onClick={() => loadResets()}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            ↻ Revisar
          </button>
        </div>
        {resetReqs.length === 0 ? (
          <p className="text-sm text-slate-400">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="space-y-2">
            {resetReqs.map((r) => (
              <li
                key={r.name}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="truncate text-sm font-medium text-slate-700">{r.name}</span>
                <span className="flex shrink-0 gap-2">
                  <button
                    onClick={() => resolveReset(r.name, "approve")}
                    className="rounded-lg bg-pitch-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-pitch-800"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => resolveReset(r.name, "reject")}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Rechazar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Aprobar borra la clave del jugador (sus marcadores se conservan) para que vuelva
          a entrar con una clave nueva.
        </p>
      </div>

      <p className="text-sm text-slate-500">
        {savedCount}/{MATCHES.length} partidos con resultado.
      </p>

      {loading ? (
        <p className="py-10 text-center text-slate-400">Cargando…</p>
      ) : (
        GROUPS.map((g) => (
          <section key={g}>
            <h2 className="sticky top-[57px] z-10 -mx-4 bg-emerald-50/95 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-pitch-800 backdrop-blur">
              Grupo {g}
            </h2>
            <div className="mt-2 space-y-2">
              {MATCHES.filter((m) => m.group === g).map((m) => {
                const s = scores[m.id] ?? { home: "", away: "" };
                return (
                  <MatchScoreRow
                    key={m.id}
                    match={m}
                    home={s.home}
                    away={s.away}
                    onChange={(h, a) => setScore(m.id, h, a)}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-slate-500">{savedCount} resultados</span>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-pitch-700 px-6 py-2.5 font-semibold text-white shadow transition hover:bg-pitch-800 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar resultados"}
          </button>
        </div>
      </div>
    </div>
  );
}
