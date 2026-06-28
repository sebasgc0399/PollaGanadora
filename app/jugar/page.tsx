"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MATCHES,
  lockTimeMs,
  formatRemaining,
  formatMatchDate,
  sideInfo,
  isKnockout,
  stageOf,
  stageLabel,
  stageShort,
  teamsKnown,
  STAGE_ORDER,
  type Match,
  type AssignedTeams,
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
  const [bracketTeams, setBracketTeams] = useState<AssignedTeams>({});
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
  const boardSeq = useRef(0); // descarta respuestas de /api/tabla fuera de orden
  const lockWarned = useRef<Set<string>>(new Set()); // partidos ya avisados como "no guardado a tiempo"
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
    const mine = ++boardSeq.current;
    try {
      const res = await fetch("/api/tabla", { cache: "no-store" });
      const data = await res.json();
      if (mine !== boardSeq.current) return; // respuesta vieja: llegó otra más nueva
      if (!res.ok) return;
      const sc: Record<string, Score> = {};
      Object.entries(data.results ?? {}).forEach(([id, v]: any) => (sc[id] = v));
      setScores(sc);
      if (data.bracketTeams) setBracketTeams(data.bracketTeams);
      const ld: Record<string, string> = {};
      (data.live ?? []).forEach((l: any) => (ld[l.match_id] = l.detail));
      setLiveDetail(ld);
      const list = data.standings ?? [];
      // El servidor guarda el nombre normalizado (trim + espacios colapsados);
      // normalizamos igual aquí para no fallar el match y mostrar "0 pts" a un
      // participante que sí está en la tabla.
      const target = who.trim().replace(/\s+/g, " ");
      const idx = list.findIndex((s: any) => s.participant === target);
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
      if (data.bracketTeams) setBracketTeams(data.bracketTeams);
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

  // En eliminatoria, una llave solo se puede pronosticar cuando sus DOS equipos
  // ya están definidos. Mientras tanto se muestra como "Por definir".
  const available = useCallback(
    (m: Match) => !isKnockout(m) || teamsKnown(m, bracketTeams),
    [bracketTeams]
  );

  function setPred(id: string, home: string, away: string) {
    setPreds((p) => ({ ...p, [id]: { home, away } }));
  }

  // ---------- guardado ----------
  const doSave = useCallback(
    async (silent: boolean) => {
      const payload: { match_id: string; home: number; away: number }[] = [];
      for (const m of MATCHES) {
        if (isKnockout(m) && !teamsKnown(m, bracketTeams)) continue;
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
    [preds, scores, name, clave, bracketTeams]
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
        if (isKnockout(m) && !teamsKnown(m, bracketTeams)) return false;
        if (scores[m.id]?.state === "final" || now >= lockTimeMs(m)) return false;
        const p = preds[m.id];
        if (!p || p.home === "" || p.away === "") return false;
        return snapshot.current[m.id] !== `${p.home}-${p.away}`;
      }),
    [preds, scores, now, bracketTeams]
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

  // Aviso si un pronóstico escrito (completo y distinto al ya guardado) no
  // alcanzó a guardarse antes de que el partido cerrara. El auto-guardado lo
  // omite en silencio, así que aquí lo señalamos una sola vez por partido.
  useEffect(() => {
    if (stage !== "form") return;
    const lost: string[] = [];
    for (const m of MATCHES) {
      if (isKnockout(m) && !teamsKnown(m, bracketTeams)) continue;
      if (scores[m.id]?.state === "final") continue;
      if (now < lockTimeMs(m)) continue; // todavía editable
      if (lockWarned.current.has(m.id)) continue;
      const p = preds[m.id];
      if (!p || p.home === "" || p.away === "") continue; // no había pronóstico completo
      if (snapshot.current[m.id] === `${p.home}-${p.away}`) continue; // ya estaba guardado
      lockWarned.current.add(m.id);
      lost.push(
        `${sideInfo(m, "home", bracketTeams).label} vs ${sideInfo(m, "away", bracketTeams).label}`
      );
    }
    if (lost.length > 0) {
      setMsg({
        type: "err",
        text: `Se cerró ${lost.length === 1 ? "el partido" : "los partidos"} y no se alcanzó a guardar tu pronóstico de: ${lost.join(", ")}.`,
      });
    }
  }, [now, stage, preds, scores, bracketTeams]);

  // ---------- derivados ----------
  const filledCount = useMemo(
    () => MATCHES.filter((m) => preds[m.id]?.home !== "" && preds[m.id]?.away !== "" && preds[m.id]).length,
    [preds]
  );
  // Partidos que aún se pueden pronosticar (excluye llaves sin equipos definidos).
  const editableLeft = useMemo(
    () =>
      MATCHES.filter((m) => {
        if (isKnockout(m) && !teamsKnown(m, bracketTeams)) return false;
        if (scores[m.id]?.state === "final" || now >= lockTimeMs(m)) return false;
        const p = preds[m.id];
        return !(p && p.home !== "" && p.away !== "");
      }).length,
    [preds, scores, now, bracketTeams]
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
      // Ocultar las llaves de eliminatoria cuyos equipos aún no se definen
      // ("Por definir"): despeja la lista. Reaparecen solas al asignar equipos.
      if (isKnockout(m) && !teamsKnown(m, bracketTeams)) return false;
      if (q) {
        const hn = norm(sideInfo(m, "home", bracketTeams).label);
        const an = norm(sideInfo(m, "away", bracketTeams).label);
        if (!(hn.includes(q) || an.includes(q))) return false;
      }
      if (filter === "hoy") return m.date === today;
      if (filter === "pendientes") {
        if (isKnockout(m) && !teamsKnown(m, bracketTeams)) return false;
        if (scores[m.id]?.state === "final" || now >= lockTimeMs(m)) return false;
        const p = preds[m.id];
        return !(p && p.home !== "" && p.away !== "");
      }
      return true;
    };
    const map = new Map<
      string,
      { key: string; label: string; id: string; isToday: boolean; order: number; matches: Match[] }
    >();
    for (const m of MATCHES) {
      if (!passes(m)) continue;
      const knockout = isKnockout(m);
      let key: string, label: string, id: string, isToday = false, order = 0;
      // Vista "Fase": grupos por letra, eliminatoria por ronda. Vista "Jornada"
      // igual para eliminatoria (no tiene jornadas). Vista "Fecha": por día.
      if (view === "grupos") {
        if (knockout) {
          const st = stageOf(m);
          key = `stage-${st}`;
          label = stageLabel(st);
          id = `sec-${st}`;
          order = 100 + STAGE_ORDER.indexOf(st);
        } else {
          key = m.group!;
          label = `Grupo ${m.group}`;
          id = `sec-${m.group}`;
          order = m.group!.charCodeAt(0);
        }
      } else if (view === "jornada") {
        if (knockout) {
          const st = stageOf(m);
          key = `stage-${st}`;
          label = stageLabel(st);
          id = `sec-${st}`;
          order = 100 + STAGE_ORDER.indexOf(st);
        } else {
          key = `J${m.matchday}`;
          label = `Jornada ${m.matchday}`;
          id = `sec-J${m.matchday}`;
          order = m.matchday!;
        }
      } else {
        key = m.date;
        label = formatMatchDate(m.date);
        id = `sec-${m.date}`;
        isToday = m.date === today;
        order = new Date(m.kickoff).getTime();
      }
      if (!map.has(key)) map.set(key, { key, label, id, isToday, order, matches: [] });
      map.get(key)!.matches.push(m);
    }
    const arr = Array.from(map.values());
    arr.forEach((s) =>
      s.matches.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    );
    arr.sort((a, b) => a.order - b.order);
    return arr;
  }, [view, filter, search, preds, scores, now, today, bracketTeams]);

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
    <>
      <div className="mx-auto max-w-6xl pb-8 lg:grid lg:grid-cols-[290px_1fr] lg:gap-6 lg:items-start">
        {/* ---------- Barra lateral ---------- */}
        <aside className="space-y-3 lg:sticky lg:top-[73px] lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-extrabold text-slate-800">
                  Hola, <span className="text-pitch-700">{name.trim()}</span>
                </h1>
                <p className="text-sm text-slate-500">
                  {me ? (
                    <>
                      Llevas <span className="font-bold text-pitch-700">{me.points} pts</span>
                      {me.rank ? ` · #${me.rank} de ${me.total}` : ""}
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
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-pitch-600 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {filledCount}/{MATCHES.length} llenos
                {editableLeft > 0 ? ` · faltan ${editableLeft}` : " · ¡todo listo!"}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
              <SaveStatus state={saveState} unsaved={hasUnsaved} />
              {saveState === "error" && (
                <button
                  onClick={() => doSave(false)}
                  className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  Reintentar
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <Segmented
              full
              value={view}
              onChange={(v) => changeView(v as View)}
              options={[
                ["fecha", "Fecha"],
                ["grupos", "Fase"],
                ["jornada", "Jornada"],
              ]}
            />
            <Segmented
              full
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              options={[
                ["todos", "Todos"],
                ["pendientes", "Pendientes"],
                ["hoy", "Hoy"],
              ]}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar equipo…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-pitch-600 focus:ring-2 focus:ring-pitch-600/30"
            />
          </div>

          {sections.length > 1 && (
            <nav className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Ir a
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 lg:max-h-[42vh] lg:flex-col lg:overflow-y-auto lg:pb-0">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={
                      "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition lg:w-full lg:text-left " +
                      (s.isToday
                        ? "border-pitch-600 bg-pitch-50 text-pitch-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100")
                    }
                  >
                    {s.label}
                    {s.isToday ? " · hoy" : ""}
                  </button>
                ))}
              </div>
            </nav>
          )}
        </aside>

        {/* ---------- Contenido ---------- */}
        <main className="mt-4 space-y-4 lg:mt-0">
          {filledCount === MATCHES.length && (
            <div className="animate-pulse rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
              🎉 ¡Completaste los {MATCHES.length} partidos! 🎉
            </div>
          )}

          {msg && <Banner msg={msg} />}

          {sections.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              No hay partidos que coincidan con el filtro/búsqueda.
            </p>
          )}

          {sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2
                className={
                  "sticky top-[57px] z-10 rounded-lg px-3 py-1.5 text-sm font-bold uppercase tracking-wide shadow-sm backdrop-blur " +
                  (s.isToday ? "bg-pitch-100/95 text-pitch-800" : "bg-emerald-50/95 text-pitch-800")
                }
              >
                {s.label}
                {s.isToday ? " · hoy" : ""}
              </h2>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {s.matches.map((m) => {
                const p = preds[m.id] ?? { home: "", away: "" };
                // Llave de eliminatoria sin equipos definidos todavía.
                if (!available(m)) {
                  return (
                    <div key={m.id} className="sm:col-span-2">
                      <PendingMatchRow match={m} assigned={bracketTeams} />
                    </div>
                  );
                }
                const locked = isLocked(m);
                if (locked) {
                  return (
                    <div key={m.id} className="sm:col-span-2">
                      <LockedMatchRow
                        match={m}
                        pred={p}
                        score={scores[m.id] ?? null}
                        detail={liveDetail[m.id]}
                        assigned={bracketTeams}
                      />
                    </div>
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
                    assigned={bracketTeams}
                  />
                );
              })}
              </div>
            </section>
          ))}
        </main>
      </div>

      {/* Volver arriba */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/90 text-white shadow-lg transition hover:bg-slate-900"
          aria-label="Volver arriba"
        >
          ↑
        </button>
      )}
    </>
  );
}

function Segmented({
  value,
  onChange,
  options,
  full = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  full?: boolean;
}) {
  return (
    <div
      className={
        "rounded-full border border-slate-300 bg-white p-0.5 " +
        (full ? "flex w-full" : "inline-flex")
      }
    >
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={
            "rounded-full px-3 py-1 text-sm font-medium transition " +
            (full ? "flex-1 " : "") +
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

// Banderita o chip "?" para un lado, en tamaño pequeño (filas compactas).
function MiniSide({ info }: { info: ReturnType<typeof sideInfo> }) {
  return info.known ? (
    <Flag team={info.team!} width={16} />
  ) : (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] bg-slate-200 text-[9px] font-bold text-slate-500 ring-1 ring-black/10">
      ?
    </span>
  );
}

// Llave de eliminatoria cuyos equipos aún no se definen: solo informativa.
function PendingMatchRow({ match, assigned }: { match: Match; assigned: AssignedTeams }) {
  const h = sideInfo(match, "home", assigned);
  const a = sideInfo(match, "away", assigned);
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs">
      <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-500">
        <span className="rounded bg-slate-200 px-1.5 py-0.5 font-semibold text-slate-500">
          {stageShort(stageOf(match))}
        </span>
        <span className="truncate">
          {h.label} <span className="text-slate-300">vs</span> {a.label}
        </span>
      </span>
      <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-500">
        Por definir
      </span>
    </div>
  );
}

function LockedMatchRow({
  match,
  pred,
  score,
  detail,
  assigned,
}: {
  match: Match;
  pred: Pred;
  score: Score | null;
  detail?: string;
  assigned?: AssignedTeams;
}) {
  const h = sideInfo(match, "home", assigned);
  const a = sideInfo(match, "away", assigned);
  const hasPred = pred.home !== "" && pred.away !== "";
  const live = score?.state === "live";
  const pts =
    score && hasPred ? pointsFor({ home: Number(pred.home), away: Number(pred.away) }, score) : null;

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
      <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-600">
        <MiniSide info={h} />
        <span className="truncate">
          {h.label} <span className="text-slate-300">vs</span> {a.label}
        </span>
        <MiniSide info={a} />
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
