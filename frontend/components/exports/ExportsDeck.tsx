"use client";

import React, { useState } from "react";
import { TactileButton } from "@/components/tactile/TactileButton";
import { Download, FileCode, Terminal, Copy, Check, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { describeError, fetchExport } from "@/lib/api";

export function ExportsDeck() {
  const { dashboard: d } = useApp();
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const download = async (kind: "schedule" | "schedule-after") => {
    setBusy(kind);
    setMsg(null);
    try {
      const text = await fetchExport(kind);
      const filename = kind === "schedule" ? "schedule.json" : "schedule_after.json";
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMsg({ ok: true, text: `${filename} downloaded. The server re-checked it with the official validator before sending it.` });
    } catch (e) {
      setMsg({ ok: false, text: describeError(e) });
    } finally {
      setBusy(null);
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseCmd = "python starter_pack/validator.py --data starter_pack/data/cit_public.json --schedule schedule.json";
  const afterCmd =
    "python starter_pack/validator.py --data starter_pack/data/cit_public.json --schedule schedule_after.json --disruption starter_pack/examples/sample_disruption.json --baseline schedule.json";

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-1.5 rounded-[3px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-400"><FileCode className="w-4 h-4" /></span>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Official exports</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            GENERATED LIVE BY THE SERVER
          </span>
        </div>
        <p className="text-neutral-400">
          Both files are built from the current state of the app and checked by the unmodified official validator before download.
        </p>
      </div>

      {msg && (
        <div className={`p-3 rounded border flex items-start gap-2 ${msg.ok ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200" : "bg-rose-950/50 border-rose-500/40 text-rose-200"}`} role="status">
          {msg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">schedule.json</span>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${d?.ready_for_export ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
              {d?.ready_for_export ? "READY" : "NOT READY"}
            </span>
          </div>
          <p className="text-neutral-400">
            {d && d.applied_disruptions > 0
              ? "The baseline: timetable, Week 7 decisions and exams exactly as they were before the first approved change."
              : `Timetable (${d?.sessions_scheduled ?? 0}/${d?.sessions_total ?? "?"} sessions), Week 7 decisions (${d?.booking_decisions ?? 0}/${d?.booking_requests ?? "?"}) with any class overrides, and exams (${d?.exams_scheduled ?? 0}/${d?.exams_total ?? "?"}).`}
          </p>
          {!d?.ready_for_export && <p className="text-amber-200">Run steps 1-3 at the top of the page first.</p>}
          <div className="pt-2 border-t border-white/5 flex justify-end">
            <TactileButton size="sm" variant="primary" disabled={busy !== null} onClick={() => download("schedule")}
              icon={busy === "schedule" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}>
              DOWNLOAD schedule.json
            </TactileButton>
          </div>
        </div>

        <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">schedule_after.json</span>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${d && d.applied_disruptions > 0 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
              {d && d.applied_disruptions > 0 ? `${d.applied_disruptions} CHANGE(S) APPLIED` : "NO CHANGE APPLIED"}
            </span>
          </div>
          <p className="text-neutral-400">
            The timetable after the approved disruption(s), compared with the timetable before the first one.
          </p>
          {!(d && d.applied_disruptions > 0) && <p className="text-amber-200">Propose and approve a disruption first (Disruptions screen).</p>}
          <div className="pt-2 border-t border-white/5 flex justify-end">
            <TactileButton size="sm" variant="amber" disabled={busy !== null} onClick={() => download("schedule-after")}
              icon={busy === "schedule-after" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}>
              DOWNLOAD schedule_after.json
            </TactileButton>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white uppercase text-xs">Check them yourself with the official validator</span>
        </div>
        {[["base", baseCmd, "text-emerald-300"], ["after", afterCmd, "text-cyan-300"]].map(([id, cmd, color]) => (
          <div key={id} className="p-2.5 bg-[#12161C] border border-white/10 rounded flex items-center justify-between gap-2">
            <code className={`${color} text-xs overflow-x-auto whitespace-nowrap`}>{cmd}</code>
            <button onClick={() => copy(cmd, id)} aria-label="Copy command"
              className="p-1.5 hover:bg-white/10 rounded text-neutral-300 hover:text-white shrink-0 cursor-pointer">
              {copied === id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
