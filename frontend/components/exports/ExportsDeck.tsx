"use client";

import React, { useState } from "react";
import { Check, Copy, Download, FileCheck2, Terminal } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { describeError, fetchExport } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Button, Card, Chip, Eyebrow, PageTitle } from "@/components/ui/primitives";

export function ExportsDeck() {
  const { dashboard: d } = useApp();
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
      <PageTitle eyebrow="Exports" title={<>Files the judges can <span className="italic font-medium text-lagoon-700">check themselves</span></>}
        subtitle="Both files are built from the live state of the app and re-validated by the unmodified official validator before they are sent." />
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold flex items-center gap-2"><FileCheck2 className="w-6 h-6 text-lagoon-700" />schedule.json</h2><Chip tone={d?.ready_for_export ? "mangrove" : "saffron"} dot>{d?.ready_for_export ? "Ready" : "Not ready"}</Chip></div>
          <p className="text-sm text-ink-600">{applied ? "The baseline: timetable, Week 7 decisions and exams exactly as they were before the first approved change." : `Timetable (${d?.sessions_scheduled ?? 0}/${d?.sessions_total ?? "?"} sessions), Week 7 decisions (${d?.booking_decisions ?? 0}/${d?.booking_requests ?? "?"}) with any class overrides, and exams (${d?.exams_scheduled ?? 0}/${d?.exams_total ?? "?"}).`}</p>
          {!d?.ready_for_export && <p className="text-sm text-saffron-600">Run the three steps on the Overview page first.</p>}
          <Button icon={<Download className="w-4 h-4" />} loading={busy === "schedule"} disabled={busy !== null} onClick={() => download("schedule")}>Download schedule.json</Button>
        </Card>
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-semibold flex items-center gap-2"><FileCheck2 className="w-6 h-6 text-sunrise-500" />schedule_after.json</h2><Chip tone={applied ? "mangrove" : "saffron"} dot>{applied ? `${d!.applied_disruptions} change applied` : "No change applied"}</Chip></div>
          <p className="text-sm text-ink-600">The timetable after the approved disruption, measured against the timetable before the first one.</p>
          {!applied && <p className="text-sm text-saffron-600">Propose and approve a change first (Changes screen).</p>}
          <Button variant="sunrise" icon={<Download className="w-4 h-4" />} loading={busy === "schedule-after"} disabled={busy !== null} onClick={() => download("schedule-after")}>Download schedule_after.json</Button>
        </Card>
      </div>
      <Card className="p-6 space-y-3">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Terminal className="w-5 h-5 text-mangrove-500" />Check them with the official validator</h2>
        {([["base", base], ["after", after]] as const).map(([id, cmd]) => (
          <div key={id} className="flex items-center gap-2 rounded-xl bg-ink-900 text-lagoon-200 pl-4 pr-2 py-2.5">
            <code className="font-mono text-xs overflow-x-auto whitespace-nowrap flex-1">{cmd}</code>
            <button onClick={() => copy(cmd, id)} aria-label="Copy command" className="p-2 rounded-lg hover:bg-lagoon-700/50 cursor-pointer shrink-0">{copied === id ? <Check className="w-4 h-4 text-mangrove-500" /> : <Copy className="w-4 h-4" />}</button>
          </div>
        ))}
        <Eyebrow className="text-ink-400">Expect: Hard violations: 0</Eyebrow>
      </Card>
    </div>
  );
}
