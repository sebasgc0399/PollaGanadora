"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MATCHES,
  lockTimeMs,
  formatRemaining,
  formatMatchDate,
  team,
  type Match,
} from "@/lib/matches";
import MatchScoreRow from "@/components/MatchScoreRow";
import Flag from "@/components/Flag";
import { pointsFor } from "@/lib/scoring";

type Pred = { home: string; away: string };
type Score = { home: number; away: number; state: "final" | "live" };
type Msg = { type: "ok" | "err" | "info"; text: string };
type View = "fecha" | "grupos" | "jornada";
type Filter = "todos" | "pendientes" | "hoy";
type SaveState = "idle" | "saving" | "saved" | "error";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function JugarPage() {
  const [name, setName] = useState("");
  const [clave, setClave] = useState("");
  const [stage, setStage] = useState<"login" | "form">("login");
  const [preds, setPreds] = useState<Record<string, Pred>>({});
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [liveDetail, setLiveDetail] = useState<Record<string, string>>({});
  const [me, setMe] = useState<{ points: number; rank: number | null; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [msg, setMsg] = useState<Msg | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [resetOpen, setResetOpen] = useState(false);
  const [view, setView] = useState<View>("fecha");
  const [filter, setFilter] = useState<Filter>("todos");
  const [search, setSearch] = useState("");
  const [showTop, setShowTop] = useState(false);

  const snapshot = useRef<Record<string, string>>({}); // últimas predicciones guardadas "h-a"
  const today = todayStr();

  useEffect(() => {
    try {
      const sn = localStorage.getItem("pg_name");
      if (sn) setName(sn);
      const v = localStorage.getItem("pg_view");
      if (v === "fecha" || v === "grupos" || v === "jornada") setView(v);
    } catch {
      /* ignore */
    }
    const id = setInterval(() => setNow(Date.now()), 30_000);
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearInterval(id);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // ---------- carga de marcadores/puntos (en vivo) ----------
  const fetchBoard = useCallback(async (who: string) => {
    try {
      const res = await fetch("/api/tabla", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      const sc: Record<string, Score> = {};
      Object.entries(data.results ?? {}).forEach(([id, v]: any) => (sc[id] = v));
      setScores(sc);
      const ld: Record<string, string> = {};
      (data.live ?? []).forEach((l: any) => (ld[l.match_id] = l.detail));
      setLiveDetail(ld);
      const list = data.standings ?? [];
      const idx = list.findIndex((s: any) => s.participant === who);
      setMe(
        idx >= 0
          ? { points: list[idx].points, rank: idx + 1, total: list.length }
          : { points: 0, rank: null, total: list.length }
      );
    } catch {
      /* ignore */
    }
  }, []);

  // poll del marcador en vivo mientras está en el formulario
  useEffect(() => {
    if (stage !== "form") return;
    const who = name.trim();
    const id = setInterval(() => fetchBoard(who), 45_000);
    const onVis = () => document.visibilityState === "visible" && fetchBoard(who);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [stage, name, fetchBoard]);

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
      const snap: Record<string, string> = {};
      Object.entries(data.predictions ?? {}).forEach(([id, v]: any) => {
        pmap[id] = { home: String(v.home), away: String(v.away) };
        snap[id] = `${v.home}-${v.away}`;
      });
      setPreds(pmap);
      snapshot.current = snap;
      setSaveState("saved");
      try {
        localStorage.setItem("pg_name", name.trim());
      } catch {
        /* ignore */
      }
      await fetchBoard(name.trim());
      setNow(Date.now());
      setStage("form");
      setMsg(
        data.isNew
          ? { type: "info", text: "Cuenta creada. Tus cambios se guardan solos." }
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
    if (n.length < 2) return setMsg({ type: "err", text: "Escribe tu nombre arriba primero." });
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
        text: "Solicitud enviada. Cuando el admin la apruebe, entra con tu nombre y una clave NUEVA.",
      });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "No se pudo enviar." });
    }
  }

  function changeView(v: View) {
    setView(v);
    try {
      localStorage.setItem("pg_view", v);
    } catch {
      /* ignore */
    }
  }

  const isLocked = useCallback(
    (m: Match) => scores[m.id]?.state === "final" || now >= lockTimeMs(m),
    [scores, now]
  );

  function setPred(id: string, home: string, away: string) {
    setPreds((p) => ({ ...p, [id]: { home, away } }));
  }

  // ---------- guardado ----------
  const doSave = useCallback(
    async (silent: boolean) => {
      const payload: { match_id: string; home: number; away: number }[] = [];
      for (const m of MATCHES) {
        if (scores[m.id]?.state === "final" || Date.now() >= lockTimeMs(m)) continue;
        const p = preds[m.id];
        if (!p || p.home === "" || p.away === "") continue;
        const cur = `${p.home}-${p.away}`;
        if (snapshot.current[m.id] !== cur) payload.push({ match_id: m.id, home: Number(p.home), away: Number(p.away) });
      }
      if (payload.length === 0) {
        setSaveState("saved");
        if (!silent) setMsg({ type: "info", text: "No hay cambios nuevos para guardar." });
        return;
      }
      setSaveState("saving");
      try {
        const res = await fetch("/api/predicciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", name: name.trim(), clave, predictions: payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar.");
        payload.forEach((r) => (snapshot.current[r.match_id] = `${r.home}-${r.away}`));
        setSaveState("saved");
        if (!silent) {
          let t = `Guardado. ${data.saved} predicciones.`;
          if (data.locked) t += ` ${data.locked} ya cerradas se omitieron.`;
          setMsg({ type: "ok", text: t });
        }
      } catch (e: any) {
        setSaveState("error");
        if (!silent) setMsg({ type: "err", text: e?.message ?? "No se pudo guardar." });
      }
    },
    [preds, scores, name, clave]
  );

  // auto-guardado (debounced)
  useEffect(() => {
    if (stage !== "form") return;
    const t = setTimeout(() => doSave(true), 1300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preds]);

  const hasUnsaved = useMemo(
    () =>
      MATCHES.some((m) => {
        if (scores[m.id]?.state === "final" || now >= lockTimeMs(m)) return false;
        const p = preds[m.id];
        if (!p || p.home === "" || p.away === "") return false;
        return snapshot.current[m.id] !== `${p.home}-${p.away}`;
      }),
    [preds, scores, now]
  );

  // aviso al salir con cambios sin guardar
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hasUnsaved]);

  // ---------- derivados ----------
  const filledCount = useMemo(
    () => MATCHES.filter((m) => preds[m.id]?.home !== "" && preds[m.id]?.away !== "" && preds[m.id]).length,
    [preds]
  );
  const editableLeft = useMemo(
    () =>
      MATCHES.filter((m) => {
        if (scores[m.id]?.state === "final" || now >= lockTimeMs(m)) return false;
        const p = preds[m.id];
        return !(p && p.home !== "" && p.away !== "");
      }).length,
    [preds, scores, now]
  );

  function matchStatus(m: Match): "saved" | "unsaved" | "incomplete" | null {
    const p = preds[m.id];
    if (!p) return null;
    const he = p.home === "";
    const ae = p.away === "";
    if (he && ae) return null;
    if (he || ae) return "incomplete";
    return snapshot.current[m.id] === `${p.home}-${p.away}` ? "saved" : "unsaved";
  }

  const sections = useMemo(() => {
    const q = norm(search.trim());
    const passes = (m: Match) => {
      if (q && !(norm(team(m.home).name).includes(q) || norm(team(m.away).name).includes(q)))
        return false;
      if (filter === "hoy") return m.date === today;
      if (filter === "pendientes") {
        if (scores[m.id]?.state === "final" || now >= lockTimeMs(m)) return false;
        const p = preds[m.id];
        return !(p && p.home !== "" && p.away !== "");
      }
      return true;
    };
    const map = new Map<string, { key: string; label: string; id: string; isToday: boolean; matches: Match[] }>();
    for (const m of MATCHES) {
      if (!passes(m)) continue;
      let key: string, label: string, id: string, isToday = false;
      if (view === "grupos") {
        key = m.group;
        label = `Grupo ${m.group}`;
        id = `sec-${m.group}`;
      } else if (view === "jornada") {
        key = `J${m.matchday}`;
        label = `Jornada ${m.matchday}`;
        id = `sec-J${m.matchday}`;
      } else {
        key = m.date;
        label = formatMatchDate(m.date);
        id = `sec-${m.date}`;
        isToday = m.date === today;
      }
      if (!map.has(key)) map.set(key, { key, label, id, isToday, matches: [] });
      map.get(key)!.matches.push(m);
    }
    const arr = Array.from(map.values());
    arr.forEach((s) =>
      s.matches.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    );
    if (view !== "fecha") arr.sort((a, b) => a.key.localeCompare(b.key));
    return arr;
  }, [view, filter, search, preds, scores, now, today]);

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // =================== Pantalla 1: ingreso ===================
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
              Escribe tu nombre arriba y pide un reinicio. El administrador lo aprueba y
              luego entras con una <strong>clave nueva</strong>. Tus marcadores no se pierden.
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
      </div>
    );
  }

  // =================== Pantalla 2: formulario ===================
  const pct = Math.round((filledCount / MATCHES.length) * 100);

  return (
    <div className="space-y-4 pb-28">
      {/* Cabecera con progreso y puntos */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">
              Hola, <span className="text-pitch-700">{name.trim()}</span>
            </h1>
            <p className="text-sm text-slate-500">
              {me ? (
                <>
                  Llevas <span className="font-bold text-pitch-700">{me.points} pts</span>
                  {me.rank ? ` · vas #${me.rank} de ${me.total}` : ""}
                </>
              ) : (
                "Cargando puntos…"
              )}
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
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-pitch-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {filledCount}/{MATCHES.length} llenos
            {editableLeft > 0 ? ` · te faltan ${editableLeft} por llenar` : " · ¡todo listo!"}
          </p>
        </div>
      </div>

      {filledCount === MATCHES.length && (
        <div className="animate-pulse rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
          🎉 ¡Completaste los {MATCHES.length} partidos! 🎉
        </div>
      )}

      {msg && <Banner msg={msg} />}

      {/* Controles: vista, filtro, búsqueda */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Segmented
            value={view}
            onChange={(v) => changeView(v as View)}
            options={[
              ["fecha", "Fecha"],
              ["grupos", "Grupos"],
              ["jornada", "Jornada"],
            ]}
          />
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            options={[
              ["todos", "Todos"],
              ["pendientes", "Pendientes"],
              ["hoy", "Hoy"],
            ]}
          />
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar equipo (ej: Colombia)…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-pitch-600 focus:ring-2 focus:ring-pitch-600/30"
        />
        {/* Chips para saltar a una sección */}
        {sections.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={
                  "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition " +
                  (s.isToday
                    ? "border-pitch-600 bg-pitch-50 text-pitch-800"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100")
                }
              >
                {s.label}
                {s.isToday ? " · hoy" : ""}
              </button>
            ))}
          </div>
        )}
      </div>

      {sections.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No hay partidos que coincidan con el filtro/búsqueda.
        </p>
      )}

      {sections.map((s) => (
        <section key={s.id} id={s.id}>
          <h2
            className={
              "sticky top-[57px] z-10 -mx-4 px-4 py-1.5 text-sm font-bold uppercase tracking-wide backdrop-blur " +
              (s.isToday ? "bg-pitch-100/95 text-pitch-800" : "bg-emerald-50/95 text-pitch-800")
            }
          >
            {s.label}
            {s.isToday ? " · hoy" : ""}
          </h2>
          <div className="mt-2 space-y-2">
            {s.matches.map((m) => {
              const p = preds[m.id] ?? { home: "", away: "" };
              const locked = isLocked(m);
              if (locked) {
                return (
                  <LockedMatchRow
                    key={m.id}
                    match={m}
                    pred={p}
                    score={scores[m.id] ?? null}
                    detail={liveDetail[m.id]}
                  />
                );
              }
              const closes = lockTimeMs(m) - now;
              return (
                <MatchScoreRow
                  key={m.id}
                  match={m}
                  home={p.home}
                  away={p.away}
                  closesIn={formatRemaining(closes)}
                  urgent={closes < 3 * 3600_000}
                  status={matchStatus(m)}
                  onChange={(hh, aa) => setPred(m.id, hh, aa)}
                />
              );
            })}
          </div>
        </section>
      ))}

      {/* Volver arriba */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/90 text-white shadow-lg transition hover:bg-slate-900"
          aria-label="Volver arriba"
        >
          ↑
        </button>
      )}

      {/* Barra inferior: estado de guardado */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <SaveStatus state={saveState} unsaved={hasUnsaved} />
          <button
            onClick={() => doSave(false)}
            disabled={saveState === "saving"}
            className="rounded-xl bg-pitch-700 px-5 py-2.5 font-semibold text-white shadow transition hover:bg-pitch-800 disabled:opacity-60"
          >
            {saveState === "saving" ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-300 bg-white p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={
            "rounded-full px-3 py-1 font-medium transition " +
            (value === v ? "bg-pitch-700 text-white" : "text-slate-600 hover:bg-slate-100")
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SaveStatus({ state, unsaved }: { state: SaveState; unsaved: boolean }) {
  if (state === "saving")
    return <span className="text-sm text-slate-500">Guardando…</span>;
  if (state === "error")
    return <span className="text-sm font-medium text-red-600">⚠ No se pudo guardar</span>;
  if (unsaved) return <span className="text-sm text-amber-600">• cambios sin guardar</span>;
  if (state === "saved")
    return <span className="text-sm font-medium text-emerald-600">✓ Todo guardado</span>;
  return <span className="text-sm text-slate-400">—</span>;
}

function ptsBadge(pts: number) {
  return (
    "min-w-[30px] rounded px-1.5 py-0.5 text-center font-bold " +
    (pts >= 3
      ? "bg-pitch-700 text-white"
      : pts === 1
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-200 text-slate-500")
  );
}

function LockedMatchRow({
  match,
  pred,
  score,
  detail,
}: {
  match: Match;
  pred: Pred;
  score: Score | null;
  detail?: string;
}) {
  const h = team(match.home);
  const a = team(match.away);
  const hasPred = pred.home !== "" && pred.away !== "";
  const live = score?.state === "live";
  const pts =
    score && hasPred ? pointsFor({ home: Number(pred.home), away: Number(pred.away) }, score) : null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
      <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-600">
        <Flag team={h} width={16} />
        <span className="truncate">
          {h.name} <span className="text-slate-300">vs</span> {a.name}
        </span>
        <Flag team={a} width={16} />
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {hasPred ? (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold tabular-nums text-slate-500">
            {pred.home}-{pred.away}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">sin pronóstico</span>
        )}
        {score ? (
          <>
            <span className="px-0.5 text-slate-300">→</span>
            <span
              className={
                "flex items-center gap-1 rounded px-1.5 py-0.5 font-bold tabular-nums text-white " +
                (live ? "bg-red-600" : "bg-slate-700")
              }
            >
              {live && <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/90" />}
              {score.home}-{score.away}
            </span>
            {live && detail && (
              <span className="text-[10px] font-bold uppercase text-red-600">{detail}</span>
            )}
            {pts != null && <span className={ptsBadge(pts)}>+{pts}</span>}
          </>
        ) : (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
            🔒 Cerrado
          </span>
        )}
      </span>
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
