"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildReportMessage,
  shareReport,
  type ReportStanding,
  type ReportPending,
} from "@/lib/report";

export default function ReportePage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tablaRes, pendRes] = await Promise.all([
        fetch("/api/tabla", { cache: "no-store" }),
        fetch("/api/pendientes", { cache: "no-store" }),
      ]);
      const tabla = await tablaRes.json();
      const pend = await pendRes.json();
      if (!tablaRes.ok) throw new Error(tabla?.error ?? "Error cargando la tabla.");
      if (!pendRes.ok) throw new Error(pend?.error ?? "Error cargando pendientes.");
      setMessage(
        buildReportMessage((tabla.standings ?? []) as ReportStanding[], pend as ReportPending)
      );
    } catch (e: any) {
      setError(e?.message ?? "Error cargando el reporte.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el textarea permite copiar a mano */
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Reporte diario</h1>
          <p className="text-sm text-slate-500">
            Quién falta por pronosticar hoy y cómo va la tabla. Listo para enviar al grupo.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {loading ? "…" : "↻ Actualizar"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!error && (
        <>
          <textarea
            value={loading ? "Cargando…" : message}
            readOnly
            rows={Math.max(8, message.split("\n").length + 1)}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 font-mono text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-pitch-600"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => shareReport(message)}
              disabled={loading || !message}
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50"
            >
              <span>📲</span> Compartir por WhatsApp
            </button>
            <button
              onClick={copy}
              disabled={loading || !message}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              {copied ? "✓ Copiado" : "Copiar texto"}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Al tocar <b>Enviar por WhatsApp</b> se abre la app con el mensaje listo: elige el
            grupo y dale enviar. Usa tu propio número; nada se envía automáticamente.
          </p>
        </>
      )}
    </div>
  );
}
