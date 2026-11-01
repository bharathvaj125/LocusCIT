"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy, Download, FileCheck2, Terminal } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { ValidatorBrief, describeError, fetchExport, fetchExportReport } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Button, Card, Chip, Eyebrow, PageTitle, Skeleton } from "@/components/ui/primitives";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/lib/utils";

function Report({ r, title, after }: { r: ValidatorBrief | null | undefined; title: string; after?: boolean }) {
  if (!r) return null;
  const clean = r.hard_violation_count === 0;
  let n = 0;
  const cell = (label: string, value: React.ReactNode, tone = "text-ink-900", hint?: string) => {
    const t = tone.includes("mangrove") ? "mangrove" : tone.includes("sunrise") ? "sunrise" : tone.includes("lagoon") ? "indigo" : "lagoon";
    return <StatCard index={n++} label={label} tone={t} {...(typeof value === "number" ? { value } : { valueText: String(value) })} hint={hint} />;
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{title}</p><Chip tone={clean ? "mangrove" : "sunrise"} dot>{clean ? "Passes the official validator" : "Has hard violations"}</Chip></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {cell("Hard violations", r.hard_violation_count, clean ? "text-mangrove-600" : "text-sunrise-600")}
        {cell("Soft penalty", r.soft_total, "text-ink-900", Object.entries(r.soft_penalties).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(", ") || "none")}
        {r.bookings && cell("Booking score", `${r.bookings.score}/${r.bookings.max}`, "text-ink-900", `${r.bookings.approved} approved, ${r.bookings.alternatives} alternative, ${r.bookings.rejected} rejected`)}
        {r.bookings && cell("Priority inversions", r.bookings.priority_inversions, r.bookings.priority_inversions === 0 ? "text-mangrove-600" : "text-sunrise-600")}
        {after && r.stability && cell("Sessions moved", r.stability.sessions_moved, "text-lagoon-900", `${r.stability.time_changed} changed time, ${r.stability.room_only_changed} room only`)}
        {r.exam_soft_penalty != null && cell("Exam penalty", r.exam_soft_penalty)}
        {cell("Sessions", r.sessions)}
      </div>
      {r.hard_violations.length > 0 && <ul className="text-sm text-sunrise-600 space-y-0.5">{r.hard_violations.map((v, i) => <li key={i}><strong>{v.rule}</strong> {v.detail}</li>)}</ul>}
    </div>
  );
}

export function ExportsDeck() {
  const { dashboard: d, revision } = useApp();
  const [report, setReport] = useState<Awaited<ReturnType<typeof fetchExportReport>> | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const loadReport = useCallback(() => { fetchExportReport().then((r) => { setReport(r); setReportError(null); }).catch((e) => setReportError(describeError(e))); }, []);
  useEffect(() => { loadReport(); }, [loadReport, revision]);
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const download = async (kind: "schedule" | "schedule-after") => {
    setBusy(kind);
    try {
      const text = await fetchExport(kind);
      const filename = kind === "schedule" ? "schedule.json" : "schedule_after.json";
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast.success(`${filename} downloaded. The server re-checked it with the official validator first.`);
    } catch (e) { toast.error(describeError(e)); } finally { setBusy(null); }
  };
  const copy = (t: string, id: string) => { navigator.clipboard?.writeText(t); setCopied(id); setTimeout(() => setCopied(null), 1800); };
  const base = "python starter_pack/validator.py --data starter_pack/data/cit_public.json --schedule schedule.json";
  const after = "python starter_pack/validator.py --data starter_pack/data/cit_public.json --schedule schedule_after.json --disruption starter_pack/examples/sample_disruption.json --baseline schedule.json";
  const applied = !!d && d.applied_disruptions > 0;

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Exports" title={<>Files the judges can <span className="italic font-medium text-gold">check themselves</span></>}
        subtitle="Both files are built from the live state of the app and re-validated by the unmodified official validator before they are sent." />
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold flex items-center gap-2"><FileCheck2 className="w-6 h-6 text-lagoon-700" />schedule.json</h2><Chip tone={d?.ready_for_export ? "mangrove" : "saffron"} dot>{d?.ready_for_export ? "Ready" : "Not ready"}</Chip></div>
          <p className="text-sm text-ink-600">{applied ? "The baseline: timetable, Week 7 decisions and exams exactly as they were before the first approved change." : `Timetable (${d?.sessions_scheduled ?? 0}/${d?.sessions_total ?? "?"} sessions), Week 7 decisions (${d?.booking_decisions ?? 0}/${d?.booking_requests ?? "?"}) with any class overrides, and exams (${d?.exams_scheduled ?? 0}/${d?.exams_total ?? "?"}).`}</p>
          {!d?.ready_for_export && <p className="text-sm text-saffron-600">Run the three steps on the Overview page first.</p>}
          <Button icon={<Download className="w-4 h-4" />} loading={busy === "schedule"} disabled={busy !== null} onClick={() => download("schedule")}>Download schedule.json</Button>
        </Card>
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold flex items-center gap-2"><FileCheck2 className="w-6 h-6 text-sunrise-600" />schedule_after.json</h2><Chip tone={applied ? "mangrove" : "saffron"} dot>{applied ? `${d!.applied_disruptions} change applied` : "No change applied"}</Chip></div>
          <p className="text-sm text-ink-600">The timetable after the approved disruption, measured against the timetable before the first one.</p>
          {!applied && <p className="text-sm text-saffron-600">Propose and approve a change first (Changes screen).</p>}
          <Button variant="sunrise" icon={<Download className="w-4 h-4" />} loading={busy === "schedule-after"} disabled={busy !== null} onClick={() => download("schedule-after")}>Download schedule_after.json</Button>
        </Card>
      </div>
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-display text-xl font-semibold">What the official validator says, right now</h2><p className="text-sm text-ink-600">The same checks the judges run, on exactly the files above. No terminal needed.</p></div>
          <Button size="sm" variant="secondary" onClick={loadReport}>Check again</Button>
        </div>
        {!report && !reportError && <Skeleton className="h-28" />}
        {reportError && <p className="text-sm text-sunrise-600" role="alert">{reportError}</p>}
        {report && !report.schedule && <p className="text-sm text-saffron-600">schedule.json is not ready yet: generate the timetable, schedule the exams and decide the Spectra requests on the Overview page.</p>}
        <Report r={report?.schedule} title="schedule.json" />
        {report?.schedule_after ? <Report r={report.schedule_after} title="schedule_after.json, compared with schedule.json" after />
          : report?.schedule && <p className="text-sm text-ink-600">schedule_after.json appears after a change has been proposed and approved on the Changes page.</p>}
      </Card>
      <Card className="p-6 space-y-3">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Terminal className="w-5 h-5 text-mangrove-600" />Check them with the official validator</h2>
        {([["base", base], ["after", after]] as const).map(([id, cmd]) => (
          <div key={id} className="flex items-center gap-2 rounded-xl bg-deep text-lagoon-200 pl-4 pr-2 py-2.5">
            <code className="font-mono text-xs overflow-x-auto whitespace-nowrap flex-1">{cmd}</code>
            <button onClick={() => copy(cmd, id)} aria-label="Copy command" className="p-2 rounded-lg hover:bg-lagoon-700/50 cursor-pointer shrink-0">{copied === id ? <Check className="w-4 h-4 text-mangrove-600" /> : <Copy className="w-4 h-4" />}</button>
          </div>
        ))}
        <p className="text-xs text-ink-600">In the second command, use the change file you actually applied instead of <span className="font-mono">sample_disruption.json</span>. Expect <span className="font-mono">Hard violations: 0</span>.</p>
      </Card>
    </div>
  );
}
