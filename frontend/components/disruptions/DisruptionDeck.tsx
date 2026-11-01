"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, FileJson, Loader2, ShieldAlert, Upload, Wrench, X } from "lucide-react";
import { DisruptionProposal, ServerProposal } from "@/lib/types";
import { useApp } from "@/lib/appContext";
import { approveProposal, describeError, fetchProposal, fetchProposals, fetchSampleDisruption, pollUntil, proposeDisruption, rejectProposal, toDisruptionProposal } from "@/lib/api";
import { DAY_LABEL } from "@/lib/dept";
import { periodRange } from "@/lib/uiConfig";
import { useToast } from "@/lib/toast";
import { Button, Card, Chip, CountUp, EmptyState, Eyebrow, PageTitle, statusTone } from "@/components/ui/primitives";
import { ChangeBuilder, ChangePreview } from "./ChangeTools";
import { cn } from "@/lib/utils";

const nice = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export function DisruptionDeck({ onOpenExports }: { onOpenExports?: () => void }) {
  const { ref, user, revision, refresh } = useApp();
  const toast = useToast();
  const [text, setText] = useState("");
  const [proposals, setProposals] = useState<ServerProposal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ServerProposal | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchProposals();
      list.sort((a, b) => b.created_at - a.created_at);
      setProposals(list);
      setSelectedId((cur) => cur ?? (list[0]?.proposal_id || null));
    } catch (e) { toast.error(describeError(e)); }
  }, [toast]);
  useEffect(() => { load(); }, [load, revision]);

  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    let alive = true;
    pollUntil(() => fetchProposal(selectedId), (p) => alive && setSelected(p), ["COMPUTING"], 2500)
      .then(() => { if (alive) { load(); refresh(); } })
      .catch((e) => alive && toast.error(describeError(e)));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const view: DisruptionProposal | null = useMemo(() => (selected && ref ? toDisruptionProposal(selected, ref) : null), [selected, ref]);

  const submit = async () => {
    setParseError(null);
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { setParseError("That is not valid JSON. Paste a change file in the starter-pack format, or load the sample."); return; }
    setWorking("propose");
    try {
      const id = await proposeDisruption(parsed);
      setSelectedId(id);
      toast.info(`Proposal ${id} is being computed. Nothing changes until an Admin approves it.`);
      await load();
    } catch (e) { setParseError(describeError(e)); } finally { setWorking(null); }
  };

  const decide = async (approve: boolean) => {
    if (!view) return;
    setWorking(approve ? "approve" : "reject");
    try {
      const p = approve ? await approveProposal(view.proposal_id) : await rejectProposal(view.proposal_id);
      setSelected(p);
      toast.success(approve ? "Approved and applied. Timetable and Week 7 decisions were recomputed; schedule_after.json is ready." : "Rejected. The active timetable is unchanged.");
      await load(); refresh();
    } catch (e) { toast.error(describeError(e)); } finally { setWorking(null); }
  };

  // when no timetable exists, say which teachers hold the most blocked sessions and what to try
  const blocked = useMemo(() => {
    if (!selected || !ref || !["INFEASIBLE", "FAILED_VALIDATION", "INVALID"].includes(selected.status)) return null;
    const ids = (selected.diagnostics || []).map((d) => d.session_id).filter(Boolean) as string[];
    if (ids.length === 0) return null;
    const by: Record<string, number> = {};
    ids.forEach((id) => { const s = ref.sessions.find((x) => x.id === id); if (s) by[s.faculty_id] = (by[s.faculty_id] || 0) + 1; });
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f, n]) => `${ref.faculty.find((x) => x.id === f)?.name || f} (${n})`);
    return { n: ids.length, top };
  }, [selected, ref]);

  const byDay = useMemo(() => {
    const m: Record<string, number> = {};
    (view?.changes || []).forEach((c) => { m[c.new.day] = (m[c.new.day] || 0) + 1; });
    return m;
  }, [view]);

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Changes" title={<>When the campus changes, <span className="italic font-medium text-gold">move as little as possible</span></>}
        subtitle="Upload a change file: faculty leave, a closed room, a new or removed session. The solver finds a valid timetable that moves the fewest classes, shows exactly what changes, and waits for you to review every move and its reason. Nothing changes until you press Approve and apply." />

      <ChangeBuilder refData={ref} text={text} setText={setText} />

      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-raised border border-line hover:border-line-strong text-sm font-semibold cursor-pointer">
            <Upload className="w-4 h-4 text-lagoon-700" />Upload JSON
            <input type="file" accept=".json,application/json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setText(await f.text()); setParseError(null); } e.target.value = ""; }} />
          </label>
          <Button variant="secondary" icon={<FileJson className="w-4 h-4 text-saffron-600" />} onClick={async () => { try { setText(JSON.stringify(await fetchSampleDisruption(), null, 2)); } catch (e) { toast.error(describeError(e)); } }}>Load the sample disruption</Button>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} spellCheck={false} aria-label="Change file JSON"
          placeholder='{"changes": [{"type": "faculty_unavailable", "faculty_id": "F07", "days": ["MON"], "periods": [1,2,3,4,5,6,7,8,9]}]}'
          className="w-full p-3 rounded-xl bg-paper border border-line font-mono text-xs leading-relaxed focus:border-lagoon-500 outline-none" />
        <ChangePreview text={text} refData={ref} />
        {parseError && <p className="text-sm text-sunrise-600 bg-sunrise-50 rounded-xl px-4 py-3" role="alert"><strong>The server did not accept this file.</strong> {parseError}</p>}
        <div className="flex justify-end"><Button icon={<Wrench className="w-4 h-4" />} loading={working === "propose"} disabled={!text.trim()} onClick={submit}>Propose a repair</Button></div>
      </Card>

      {proposals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {proposals.map((p) => (
            <button key={p.proposal_id} onClick={() => setSelectedId(p.proposal_id)}
              className={cn("px-3 py-1.5 rounded-xl border text-sm cursor-pointer flex items-center gap-2", selectedId === p.proposal_id ? "bg-raised border-lagoon-500 shadow-card" : "border-line hover:border-line-strong")}>
              <span className="font-mono text-xs">{p.proposal_id}</span><Chip tone={statusTone(p.status)}>{nice(p.status)}</Chip>
            </button>
          ))}
        </div>
      )}
      {proposals.length === 0 && <EmptyState title="No proposals yet" body="Load the sample disruption and press Propose a repair." tone="sunrise" />}

      {view && (
        <div className="space-y-5">
          <Card className="p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Chip tone={statusTone(view.status)} dot>{view.status === "COMPUTING" ? "Computing" : nice(view.status)}</Chip>
                {view.status === "COMPUTING" && <Loader2 className="w-4 h-4 animate-spin text-lagoon-700" />}
                <span className="text-sm text-ink-600">{view.title}</span>
              </div>
              {view.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button variant="danger" icon={<X className="w-4 h-4" />} disabled={!!working} onClick={() => decide(false)}>Reject</Button>
                  <Button variant="success" icon={<Check className="w-4 h-4" />} loading={working === "approve"} disabled={!!working} onClick={() => decide(true)}>Approve and apply</Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-lagoon-50 p-4"><Eyebrow>Sessions moved</Eyebrow><p className="font-display text-5xl font-semibold text-lagoon-900 mt-1">{view.status === "COMPUTING" ? "..." : <CountUp value={view.moved_count} />}</p><p className="text-xs text-ink-600 mt-1">{view.status === "COMPUTING" ? "" : view.proven_minimum ? "proven minimum" : "best found in the time limit"}</p></div>
              <div className="rounded-2xl bg-paper p-4"><Eyebrow className="text-ink-400">Directly broken</Eyebrow><p className="font-display text-5xl font-semibold mt-1">{view.lower_bound}</p><p className="text-xs text-ink-600 mt-1">must move at least this many</p></div>
              <div className="rounded-2xl bg-mangrove-50 p-4"><Eyebrow className="text-mangrove-600">Hard violations</Eyebrow><p className="font-display text-5xl font-semibold text-mangrove-600 mt-1">{["PENDING", "APPROVED"].includes(view.status) ? (selected?.hard_violation_count ?? "-") : "-"}</p><p className="text-xs text-ink-600 mt-1">{selected?.soft_total != null && ["PENDING", "APPROVED"].includes(view.status) ? `official validator · soft penalty ${selected.soft_total}` : "official validator"}</p></div>
              <div className="rounded-2xl bg-paper p-4"><Eyebrow className="text-ink-400">New / removed</Eyebrow><p className="font-display text-5xl font-semibold mt-1">{view.new_sessions.length} / {view.removed_sessions.length}</p><p className="text-xs text-ink-600 mt-1 truncate">{view.new_sessions.join(", ") || "no new sessions"}</p></div>
            </div>
            {Object.keys(byDay).length > 0 && (
              <div>
                <Eyebrow className="text-ink-400">Where classes land</Eyebrow>
                <div className="grid grid-cols-5 gap-2 mt-2">{["MON", "TUE", "WED", "THU", "FRI"].map((d) => {
                  const n = byDay[d] || 0;
                  const top = Math.max(1, ...Object.values(byDay));
                  return (
                    <div key={d} className="rounded-xl bg-paper px-2 pt-2.5 pb-2 text-center">
                      <p className="font-mono text-[10px] text-ink-400">{d}</p>
                      <div className="h-14 mt-1 flex items-end justify-center border-b border-line">
                        <motion.div className={n ? "w-6 rounded-t-md bg-primary" : "w-6 rounded-t-sm bg-line"} initial={{ height: 0 }} animate={{ height: n ? 8 + (n / top) * 44 : 3 }} transition={{ duration: 0.6 }} />
                      </div>
                      <p className="text-sm font-semibold mt-1.5 tabular">{n}</p>
                    </div>
                  );
                })}</div>
              </div>
            )}
            {view.status === "APPROVED" && (
              <div className="rounded-xl bg-mangrove-50 text-mangrove-600 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3" role="status">
                <span><strong>Applied by {selected?.approved_by}.</strong> The timetable and the Week 7 decisions were recomputed, and <span className="font-mono">schedule_after.json</span> now holds the repaired timetable.</span>
                {onOpenExports && <Button size="sm" variant="success" icon={<ArrowRight className="w-4 h-4" />} onClick={onOpenExports}>Open exports</Button>}
              </div>
            )}
            {view.status === "PENDING" && <p className="text-sm text-ink-600">Nothing has changed yet. This is the suggested shifting: each moved class below says why it moves. Approve to apply it; the timetable is checked again at that moment, and a stale proposal is refused. Reject leaves everything as it is.</p>}
            {blocked && (
              <div className="rounded-xl bg-sunrise-50 text-sunrise-600 px-4 py-3 text-sm space-y-1" role="alert">
                <p className="font-semibold">No valid timetable exists with this change, so nothing was proposed and nothing changed.</p>
                <p>{blocked.n} session{blocked.n === 1 ? "" : "s"} would have no legal slot left{blocked.top.length ? `, mostly those taught by ${blocked.top.join(", ")}` : ""}. A teacher can teach at most their daily limit, and every room, group and teacher can be in one place at a time.</p>
                <p>Try making the unavailability shorter (fewer days or periods), removing a session, or closing a different room.</p>
              </div>
            )}
            {view.diagnostics && <p className="text-sm text-ink-900">{view.diagnostics}</p>}
            {view.diagnostic_items.length > 0 && <ul className="text-sm text-sunrise-600 space-y-1 list-disc pl-5">{view.diagnostic_items.map((d, i) => <li key={i}>{d}</li>)}</ul>}
          </Card>

          {view.changes.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-line flex items-center justify-between"><h3 className="font-display text-xl font-semibold">Before and after</h3><Chip tone="lagoon">{view.changes.length} moved</Chip></div>
              <ul className="divide-y divide-line">
                <AnimatePresence initial>
                  {view.changes.map((c, i) => (
                    <motion.li key={c.session_id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.045 }} className="px-6 py-4 grid md:grid-cols-[1.2fr_1fr_auto_1fr] gap-3 items-center">
                      <div><p className="font-semibold">{c.course_title}</p><p className="font-mono text-xs text-ink-400">{c.session_id}</p><p className="text-xs text-saffron-600 mt-0.5">{c.reason}</p></div>
                      <div className="rounded-xl bg-sunrise-50 px-3 py-2"><p className="text-[10px] font-mono uppercase text-sunrise-600">Before</p><p className="text-sm font-semibold">{c.old.day} {periodRange(c.old.start_period, c.old.end_period)}</p><p className="text-xs text-ink-600">{c.old.room_id}</p></div>
                      <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.1 }} className="hidden md:block text-lagoon-700"><ArrowRight className="w-5 h-5" /></motion.span>
                      <div className="rounded-xl bg-mangrove-50 px-3 py-2"><p className="text-[10px] font-mono uppercase text-mangrove-600">After</p><p className="text-sm font-semibold">{DAY_LABEL[c.new.day].slice(0, 3).toUpperCase()} {periodRange(c.new.start_period, c.new.end_period)}</p><p className="text-xs text-ink-600">{c.new.room_id}</p></div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
