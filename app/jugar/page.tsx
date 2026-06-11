"use client";

import { useEffect, useMemo, useState } from "react";
import { MATCHES, GROUPS, lockTimeMs, formatRemaining } from "@/lib/matches";
import MatchScoreRow from "@/components/MatchScoreRow";
import { pointsFor, hitLabel } from "@/lib/scoring";

type Pred = { home: string; away: string };
type Result = { home: number; away: number };
type Msg = { type: "ok" | "err" | "info"; text: string };

export default function JugarPage() {
  const [name, setName] = useState("");
  const [clave, setClave] = useState("");
  const [stage, setStage] = useState<"login" | "form">("login");
  const [preds, setPreds] = useState<Record<string, Pred>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pg_name");
      if (saved) setName(saved);
    } catch {
      /* ignore */
    }
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function login() {
    if (!name.trim()) return setMsg({ type: "err", text: "Escribe tu nombre." });
    if (clave.trim().length < 3)
      return setMsg({ type: "err", text: "La clave debe tener al menos 3 caracteres." });
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/predicciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load", name: name.trim(), clave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "No se pudo ingresar.");

      const pmap: Record<string, Pred> = {};
      Object.entries(data.predictions ?? {}).forEach(([id, v]: any) => {
        pmap[id] = { home: String(v.home), away: String(v.away) };
      });
      setPreds(pmap);
      setResults(data.results ?? {});
      setNow(Date.now());
      try {
        localStorage.setItem("pg_name", name.trim());
      } catch {
        /* ignore */
      }
      setStage("form");
      setMsg(
        data.isNew
          ? { type: "info", text: "Cuenta creada. Recuerda tu clave para volver a editar." }
          : { type: "info", text: "¡Hola de nuevo! Cargamos tus predicciones." }
      );
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "Error al ingresar." });
    } finally {
      setLoading(false);
    }
  }

  async function requestReset() {
    const n = name.trim();
    if (n.length < 2) {
      return setMsg({ type: "err", text: "Escribe tu nombre arriba primero." });
    }
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", name: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "No se pudo enviar la solicitud.");
      setResetOpen(false);
      setMsg({
        type: "ok",
        text: "Solicitud enviada. Cuando el admin la apruebe, entra con tu nombre y una clave NUEVA (tus marcadores no se pierden).",
      });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "No se pudo enviar." });
    }
  }

  function setPred(id: string, home: string, away: string) {
    setPreds((p) => ({ ...p, [id]: { home, away } }));
  }

  const lockedNow = (id: string) => {
    const m = MATCHES.find((x) => x.id === id)!;
    return !!results[id] || now >= lockTimeMs(m);
  };

  const filledCount = useMemo(
    () =>
      MATCHES.filter((m) => {
        const p = preds[m.id];
        return p && p.home !== "" && p.away !== "";
      }).length,
    [preds]
  );

  const editableLeft = useMemo(
    () => MATCHES.filter((m) => !(results[m.id] || now >= lockTimeMs(m))).length,
    [results, now]
  );

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const payload: { match_id: string; home: number; away: number }[] = [];
      let incomplete = 0;
      for (const m of MATCHES) {
        if (lockedNow(m.id)) continue;
        const p = preds[m.id];
        if (!p || (p.home === "" && p.away === "")) continue;
        if (p.home === "" || p.away === "") {
          incomplete++;
          continue;
        }
        payload.push({ match_id: m.id, home: Number(p.home), away: Number(p.away) });
      }
      if (payload.length === 0) {
        return setMsg({ type: "err", text: "No hay marcadores nuevos para guardar." });
      }
      const res = await fetch("/api/predicciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", name: name.trim(), clave, predictions: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar.");

      let text = `¡Guardado! ${data.saved} predicciones registradas.`;
      if (data.locked) text += ` ${data.locked} ya estaban cerradas y se ignoraron.`;
      if (incomplete) text += ` ${incomplete} quedaron a medias.`;
      setMsg({ type: "ok", text });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  }

  // ---------------- Pantalla 1: ingreso ----------------
  if (stage === "login") {
    return (
      <div className="mx-auto max-w-md space-y-5 py-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Hacer mis predicciones</h1>
          <p className="mt-1 text-slate-500">
            Pon tu nombre y una <strong>clave personal</strong>. La primera vez queda
            asociada a tu nombre; después solo tú (con tu clave) puedes ver y editar tus
            marcadores.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            login();
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
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Tu clave personal"
            maxLength={64}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none focus:border-pitch-600 focus:ring-2 focus:ring-pitch-600/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-pitch-700 px-4 py-3 text-lg font-semibold text-white shadow transition hover:bg-pitch-800 disabled:opacity-60"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        {msg && <Banner msg={msg} />}

        <div className="text-center">
          <button
            type="button"
            onClick={() => setResetOpen((v) => !v)}
            className="text-sm font-medium text-pitch-700 underline"
          >
            ¿Olvidaste tu clave?
          </button>
        </div>

        {resetOpen && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="mb-2">
              Escribe tu nombre arriba (igual al que usaste) y pide un reinicio. El
              administrador lo aprueba y luego entras con una <strong>clave nueva</strong>.
              Tus marcadores guardados <strong>no se pierden</strong>.
            </p>
            <button
              type="button"
              onClick={requestReset}
              className="w-full rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
            >
              Pedir reinicio de mi clave
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Si te equivocas de clave para un nombre que ya existe, no podrás entrar: usa tu
          clave o pide un reinicio.
        </p>
      </div>
    );
  }

  // ---------------- Pantalla 2: formulario ----------------
  return (
    <div className="space-y-5 pb-28">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">
            Predicciones de <span className="text-pitch-700">{name.trim()}</span>
          </h1>
          <p className="text-sm text-slate-500">
            {filledCount}/{MATCHES.length} llenos · {editableLeft} aún editables
          </p>
        </div>
        <button
          onClick={() => {
            setStage("login");
            setClave("");
            setMsg(null);
          }}
          className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Salir
        </button>
      </div>

      {msg && <Banner msg={msg} />}

      {GROUPS.map((g) => (
        <section key={g}>
          <h2 className="sticky top-[57px] z-10 -mx-4 bg-emerald-50/95 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-pitch-800 backdrop-blur">
            Grupo {g}
          </h2>
          <div className="mt-2 space-y-2">
            {MATCHES.filter((m) => m.group === g).map((m) => {
              const p = preds[m.id] ?? { home: "", away: "" };
              const result = results[m.id];
              const locked = !!result || now >= lockTimeMs(m);
              return (
                <MatchScoreRow
                  key={m.id}
                  match={m}
                  home={p.home}
                  away={p.away}
                  disabled={locked}
                  closesIn={!locked ? formatRemaining(lockTimeMs(m) - now) : undefined}
                  onChange={(h, a) => setPred(m.id, h, a)}
                  footer={
                    result ? (
                      <ResultFooter result={result} pred={p} />
                    ) : locked ? (
                      <div className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                        🔒 Cerrado · el partido está por empezar
                      </div>
                    ) : null
                  }
                />
              );
            })}
          </div>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-slate-500">{filledCount}/{MATCHES.length} llenos</span>
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

function ResultFooter({ result, pred }: { result: Result; pred: Pred }) {
  const hasPred = pred.home !== "" && pred.away !== "";
  const predScore = hasPred ? { home: Number(pred.home), away: Number(pred.away) } : null;
  const pts = pointsFor(predScore, result);
  const label = hitLabel(predScore, result);
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-1.5 text-xs">
      <span className="font-medium text-slate-600">
        🔒 Resultado: {result.home}–{result.away}
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
  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{msg.text}</div>;
}
