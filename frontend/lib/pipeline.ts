"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeError, evaluateBookings, fetchJob, generateExams, generateTimetable, pollUntil } from "./api";
import { useApp } from "./appContext";
import { useToast } from "./toast";
import { SolverJob } from "./types";

export type Step = "generate" | "exams" | "bookings";

/** The Admin's three pipeline actions, with live progress for the long solver run. */
export function usePipeline() {
  const { refresh } = useApp();
  const toast = useToast();
  const [busy, setBusy] = useState<Step | null>(null);
  const [job, setJob] = useState<SolverJob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const start = () => {
    const t0 = Date.now();
    setElapsed(0);
    timer.current = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 500);
  };
  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };

  const generate = useCallback(async () => {
    setBusy("generate"); setJob(null); start();
    try {
      const id = await generateTimetable();
      const final = await pollUntil(() => fetchJob(id), (j) => { setJob(j); if (j.phase === "optimising") refresh(); });
      if (final.status !== "DONE") throw new Error(final.error || `Generation ended with status ${final.status}`);
      toast.success(`Timetable ready: ${final.sessions} sessions, 0 hard violations, soft penalty ${final.soft_total}.`);
    } catch (e) {
      toast.error(describeError(e));
    } finally {
      stop(); setBusy(null); refresh();
    }
  }, [refresh, toast]);

  const exams = useCallback(async () => {
    setBusy("exams");
    try {
      const r = await generateExams();
      toast.success(`${r.count} exams scheduled, same-day penalty ${r.exam_soft_penalty}.`);
    } catch (e) { toast.error(describeError(e)); }
    finally { setBusy(null); refresh(); }
  }, [refresh, toast]);

  const bookings = useCallback(async () => {
    setBusy("bookings");
    try {
      const r = await evaluateBookings();
      toast.success(`Spectra requests decided: score ${r.booking_score} of ${r.booking_score_max_if_all_approved}, ${r.priority_inversions.length} priority inversions.`);
    } catch (e) { toast.error(describeError(e)); }
    finally { setBusy(null); refresh(); }
  }, [refresh, toast]);

  return { busy, job, elapsed, generate, exams, bookings };
}
