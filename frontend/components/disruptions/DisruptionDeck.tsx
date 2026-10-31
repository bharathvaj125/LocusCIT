"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DisruptionProposal, ServerProposal } from "@/lib/types";
import { useApp } from "@/lib/appContext";
import {
  approveProposal, describeError, fetchProposal, fetchProposals, fetchSampleDisruption, pollUntil, proposeDisruption,
  rejectProposal, toDisruptionProposal,
} from "@/lib/api";
import { TactileButton } from "@/components/tactile/TactileButton";
import {
  Wrench, CheckCircle2, XCircle, Layers, Check, Upload, FileJson, Loader2, AlertTriangle, ShieldAlert,
} from "lucide-react";

const BUSY = ["COMPUTING"];

export function DisruptionDeck() {
  const { ref, user, revision, refresh } = useApp();
  const [text, setText] = useState("");
  const [proposals, setProposals] = useState<ServerProposal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ServerProposal | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchProposals();
      list.sort((a, b) => b.created_at - a.created_at);
      setProposals(list);
      if (!selectedId && list.length) setSelectedId(list[0].proposal_id);
    } catch (e) {
      setFeedback({ ok: false, text: describeError(e) });
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load, revision]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    let alive = true;
    pollUntil(() => fetchProposal(selectedId), (p) => alive && setSelected(p), BUSY, 2500).then(() => {
      if (alive) {
        load();
        refresh();
      }
    }).catch((e) => alive && setFeedback({ ok: false, text: describeError(e) }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const view: DisruptionProposal | null = useMemo(
    () => (selected && ref ? toDisruptionProposal(selected, ref) : null),
    [selected, ref]
  );

  const submit = async () => {
    setFeedback(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setFeedback({ ok: false, text: "That is not valid JSON. Paste a change file in the starter-pack format." });
      return;
    }
    setWorking("propose");
    try {
      const id = await proposeDisruption(parsed);
      setSelectedId(id);
      setFeedback({ ok: true, text: `Proposal ${id} is being computed. Nothing changes until an Admin approves it.` });
      await load();
    } catch (e) {
      setFeedback({ ok: false, text: describeError(e) });
    } finally {
      setWorking(null);
    }
  };

  const onFile = async (f: File | undefined) => {
    if (f) setText(await f.text());
  };

  const loadSample = async () => {
    try {
      setText(JSON.stringify(await fetchSampleDisruption(), null, 2));
    } catch (e) {
      setFeedback({ ok: false, text: describeError(e) });
    }
  };

  const decide = async (approve: boolean) => {
    if (!view) return;
    setWorking(approve ? "approve" : "reject");
    setFeedback(null);
    try {
      const p = approve ? await approveProposal(view.proposal_id) : await rejectProposal(view.proposal_id);
      setSelected(p);
      setFeedback({
        ok: true,
        text: approve
          ? "Approved and applied. The timetable and Week 7 decisions were recomputed; schedule_after.json is ready in Exports."
          : "Rejected. The active timetable is unchanged.",
      });
      await load();
      refresh();
    } catch (e) {
      setFeedback({ ok: false, text: describeError(e) });
    } finally {
      setWorking(null);
    }
  };

  const ownProposal = view?.requested_by === user.username;
  const statusClass = (s: string) =>
    s === "APPROVED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : s === "PENDING" ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
      : s === "COMPUTING" ? "bg-neutral-800 text-neutral-300 border-white/10"
      : "bg-rose-500/20 text-rose-300 border-rose-500/40";

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-1.5 rounded-[3px] bg-rose-950/60 border border-rose-500/40 text-rose-400">
            <Wrench className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Disruptions // minimal-change repair</h2>
        </div>
        <p className="text-neutral-400">
          Upload a change file (faculty leave, room closure, new or removed session). The solver proposes a fixed timetable that
          moves as few sessions as possible. It is only a proposal until an Admin approves it; the person who proposed it
          cannot approve it.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161B22] border border-white/15 rounded cursor-pointer hover:border-cyan-500/50">
            <Upload className="w-3.5 h-3.5 text-cyan-400" /> UPLOAD JSON
            <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <button onClick={loadSample}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161B22] border border-white/15 rounded hover:border-cyan-500/50 cursor-pointer">
            <FileJson className="w-3.5 h-3.5 text-amber-400" /> LOAD SAMPLE DISRUPTION
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          spellCheck={false}
          aria-label="Change file JSON"
          placeholder='{"changes": [{"type": "faculty_unavailable", "faculty_id": "F07", "days": ["MON"], "periods": [1,2,3,4,5,6,7,8,9]}]}'
          className="w-full p-2.5 bg-[#080A0C] border border-white/10 rounded text-[11px] text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/70"
        />
        <div className="flex justify-end">
          <TactileButton size="sm" variant="primary" disabled={!text.trim() || working === "propose"} onClick={submit}
            icon={working === "propose" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}>
            PROPOSE REPAIR
          </TactileButton>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded border flex items-start gap-2 ${feedback.ok ? "bg-[#161B22] border-cyan-500/50 text-cyan-200" : "bg-rose-950/50 border-rose-500/40 text-rose-200"}`} role="status">
          {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {proposals.map((p) => (
            <button key={p.proposal_id} onClick={() => setSelectedId(p.proposal_id)}
              className={`px-2 py-1 rounded border text-[11px] cursor-pointer ${selectedId === p.proposal_id ? "border-cyan-400 text-cyan-300" : "border-white/10 text-neutral-400 hover:text-white"}`}>
              {p.proposal_id} <span className={`ml-1 px-1 rounded border ${statusClass(p.status)}`}>{p.status}</span>
            </button>
          ))}
        </div>
      )}

      {view && (
        <div className="space-y-3">
          <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-[2px] font-bold border ${statusClass(view.status)}`}>
                  {view.status === "COMPUTING" ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />COMPUTING</span> : view.status}
                </span>
                <span className="text-neutral-300">{view.title}</span>
              </div>
              {view.status === "PENDING" && (
                <div className="flex items-center gap-2">
                  <button disabled={!!working} onClick={() => decide(false)}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded disabled:opacity-40 cursor-pointer">
                    REJECT
                  </button>
                  <button disabled={!!working || ownProposal} onClick={() => decide(true)}
                    className="px-4 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5">
                    {working === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    APPROVE &amp; APPLY
                  </button>
                </div>
              )}
            </div>
            {view.status === "PENDING" && ownProposal && (
              <div className="p-2 bg-rose-950/30 border border-rose-500/30 rounded text-rose-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                You proposed this, so you cannot approve it. Switch to the Second Admin account (top bar) to approve.
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
              <div className="p-2.5 bg-[#12161C] border border-cyan-500/30 rounded-[3px]">
                <span className="text-[10px] text-cyan-400 block">SESSIONS MOVED</span>
                <span className="text-cyan-300 font-bold mt-0.5 block">{view.status === "COMPUTING" ? "..." : view.moved_count}</span>
                <span className="text-[9px] text-neutral-500">
                  {view.status === "COMPUTING" ? "" : view.proven_minimum ? "proven minimum" : "best found in the time limit"}
                </span>
              </div>
              <div className="p-2.5 bg-[#12161C] border border-white/10 rounded-[3px]">
                <span className="text-[10px] text-neutral-400 block">DIRECTLY BROKEN</span>
                <span className="text-white font-bold mt-0.5 block">{view.lower_bound}</span>
                <span className="text-[9px] text-neutral-500">must move at least this many</span>
              </div>
              <div className="p-2.5 bg-[#12161C] border border-emerald-500/30 rounded-[3px]">
                <span className="text-[10px] text-emerald-400 block">HARD VIOLATIONS</span>
                <span className="text-emerald-300 font-bold mt-0.5 block">
                  {["PENDING", "APPROVED"].includes(view.status) ? "0" : "-"}
                </span>
                <span className="text-[9px] text-neutral-500">checked by the official validator</span>
              </div>
              <div className="p-2.5 bg-[#12161C] border border-white/10 rounded-[3px]">
                <span className="text-[10px] text-neutral-400 block">NEW / REMOVED</span>
                <span className="text-white font-bold mt-0.5 block">
                  {view.new_sessions.length} / {view.removed_sessions.length}
                </span>
                <span className="text-[9px] text-neutral-500 truncate block">{view.new_sessions.join(", ")}</span>
              </div>
            </div>

            {view.diagnostics && <p className="text-neutral-300">{view.diagnostics}</p>}
            {view.diagnostic_items.length > 0 && (
              <ul className="space-y-0.5 text-rose-200/90">
                {view.diagnostic_items.map((d, i) => <li key={i}>• {d}</li>)}
              </ul>
            )}
          </div>

          {view.changes.length > 0 && (
            <div className="bg-[#0E1216] border border-white/10 rounded-[4px] overflow-hidden">
              <div className="p-3 bg-[#12161C] border-b border-white/10 flex items-center justify-between">
                <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Before / after
                </span>
                <span className="text-neutral-400 text-[10px]">{view.changes.length} moved</span>
              </div>
              <div className="divide-y divide-white/5">
                {view.changes.map((diff) => (
                  <div key={diff.session_id} className="p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">{diff.session_id}</span>
                        <span className="text-white font-sans font-medium">{diff.course_title}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">{diff.reason}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2.5 bg-[#181116] border border-rose-500/30 rounded-[3px]">
                        <span className="text-[10px] text-rose-400 uppercase font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Before</span>
                        <span className="text-neutral-300">
                          {diff.old.day} P{diff.old.start_period}{diff.old.end_period > diff.old.start_period ? `-P${diff.old.end_period}` : ""} in{" "}
                          <strong className="text-white">{diff.old.room_id}</strong>
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#0F1B1A] border border-emerald-500/30 rounded-[3px]">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> After</span>
                        <span className="text-neutral-300">
                          {diff.new.day} P{diff.new.start_period}{diff.new.end_period > diff.new.start_period ? `-P${diff.new.end_period}` : ""} in{" "}
                          <strong className="text-emerald-300">{diff.new.room_id}</strong> ({diff.new.room_name})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {proposals.length === 0 && <p className="text-neutral-500">No proposals yet. Load the sample disruption and press PROPOSE REPAIR.</p>}
    </div>
  );
}
