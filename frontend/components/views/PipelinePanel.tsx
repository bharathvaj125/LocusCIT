"use client";

import React, { useState } from "react";
import { Cpu, GraduationCap, Sparkles, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { TactileButton } from "@/components/tactile/TactileButton";
import { useApp } from "@/lib/appContext";
import { describeError, evaluateBookings, fetchJob, generateExams, generateTimetable, pollUntil } from "@/lib/api";
import { SolverJob } from "@/lib/types";

/** Status line for everyone, plus the Admin's generate / exams / Spectra buttons. */
export function PipelinePanel() {
  const { dashboard: d, user, refresh } = useApp();
  const [job, setJob] = useState<SolverJob | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);

  const isAdmin = user.role === "admin";
  const scheduled = d && d.sessions_scheduled > 0;

  const run = async (what: string, fn: () => Promise<string>) => {
    setBusy(what);
    setMessage(null);
    try {
      setMessage({ kind: "ok", text: await fn() });
    } catch (e) {
      setMessage({ kind: "err", text: describeError(e) });
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const generate = () =>
    run("generate", async () => {
      setStartedAt(Date.now());
      const id = await generateTimetable();
      const final = await pollUntil(
        () => fetchJob(id),
        (j) => {
          setJob(j);
          if (j.phase === "optimising") refresh();
        }
      );
      if (final.status !== "DONE") throw new Error(final.error || `Generation ended with status ${final.status}`);
      return `Timetable ready: ${final.sessions} sessions, 0 hard violations, soft penalty ${final.soft_total} (${final.solver_status}, ${final.seconds}s).`;
    });

  const exams = () =>
    run("exams", async () => {
      const r = await generateExams();
      return `Exams scheduled: ${r.count}, same-day penalty ${r.exam_soft_penalty} (${r.status}).`;
    });

  const bookings = () =>
    run("bookings", async () => {
      const r = await evaluateBookings();
      return `Spectra requests decided. Score ${r.booking_score} of ${r.booking_score_max_if_all_approved}; priority inversions: ${r.priority_inversions.length}.`;
    });

  const elapsed = busy === "generate" && startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;

  return (
    <div className="p-3 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-2 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-2 text-neutral-300">
        <span className="px-2 py-0.5 bg-[#12161C] border border-white/10 rounded-[3px]">
          Timetable: <strong className={scheduled ? "text-emerald-400" : "text-amber-300"}>
            {d ? (scheduled ? `${d.sessions_scheduled}/${d.sessions_total}` : "not generated") : "..."}
          </strong>
        </span>
        <span className="px-2 py-0.5 bg-[#12161C] border border-white/10 rounded-[3px]">
          Hard: <strong className={d?.hard_violation_count === 0 ? "text-emerald-400" : "text-rose-300"}>{scheduled ? d!.hard_violation_count : "-"}</strong>
          {" "}Soft: <strong className="text-white">{scheduled ? d!.soft_total : "-"}</strong>
        </span>
        <span className="px-2 py-0.5 bg-[#12161C] border border-white/10 rounded-[3px]">
          Exams: <strong className={d && d.exams_scheduled === d.exams_total ? "text-emerald-400" : "text-amber-300"}>
            {d ? `${d.exams_scheduled}/${d.exams_total}` : "..."}
          </strong>
        </span>
        <span className="px-2 py-0.5 bg-[#12161C] border border-white/10 rounded-[3px]">
          Spectra: <strong className="text-white">{d ? `${d.booking_decisions}/${d.booking_requests} decided` : "..."}</strong>
          {d?.booking_score != null && <> (score <strong className="text-emerald-400">{d.booking_score}</strong>)</>}
        </span>
        {d && d.applied_disruptions > 0 && (
          <span className="px-2 py-0.5 bg-[#12161C] border border-rose-500/30 rounded-[3px] text-rose-200">
            Disruptions applied: {d.applied_disruptions}
          </span>
        )}
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <TactileButton size="sm" variant="primary" disabled={!!busy} onClick={generate}
            icon={busy === "generate" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}>
            {busy === "generate" ? "GENERATING..." : "1. GENERATE TIMETABLE"}
          </TactileButton>
          <TactileButton size="sm" variant="blue" disabled={!!busy || !scheduled} onClick={exams}
            icon={busy === "exams" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}>
            2. SCHEDULE EXAMS
          </TactileButton>
          <TactileButton size="sm" variant="amber" disabled={!!busy || !scheduled} onClick={bookings}
            icon={busy === "bookings" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}>
            3. DECIDE SPECTRA REQUESTS
          </TactileButton>
          {busy === "generate" && job && (
            <span className="text-neutral-400">
              {job.phase === "optimising"
                ? `Valid timetable found and shown (soft ${job.soft_total}); optimising... ${elapsed}s`
                : `Searching for a clash-free timetable... ${elapsed}s`}
            </span>
          )}
        </div>
      )}
      {isAdmin && !scheduled && !busy && (
        <p className="text-neutral-500">Start with step 1. On the free server a valid timetable appears in about 30 s and the optimised one in a few minutes.</p>
      )}

      {message && (
        <div className={`p-2 rounded border flex items-start gap-2 ${
          message.kind === "ok" ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200" : "bg-rose-950/50 border-rose-500/40 text-rose-200"
        }`}>
          {message.kind === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
