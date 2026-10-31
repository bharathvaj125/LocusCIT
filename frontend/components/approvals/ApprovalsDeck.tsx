"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ServerProposal, Submission } from "@/lib/types";
import { useApp } from "@/lib/appContext";
import {
  cancelSubmission, decideSubmission, describeError, fetchBookings, fetchFacultyRequests, fetchProposals, respondToAlternative,
} from "@/lib/api";
import { CheckSquare, CheckCircle2, AlertTriangle, ShieldAlert, Clock, MapPin, Users, Wrench } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  APPROVED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  ALTERNATIVE_OFFERED: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  REJECTED: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  CANCELLED: "bg-neutral-800 text-neutral-400 border-white/10",
  WITHDRAWN: "bg-neutral-800 text-neutral-400 border-white/10",
  PENDING: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  COMPUTING: "bg-neutral-800 text-neutral-300 border-white/10",
};

function slotText(s: Submission) {
  if (s.placement) {
    const p = s.placement;
    return `${p.day} P${p.start_period}${p.end_period > p.start_period ? `-P${p.end_period}` : ""} in ${p.room_id}`;
  }
  return `asked ${s.request.windows.map((w) => `${w.day} P${w.from_period}-P${w.to_period}`).join(" or ")}`;
}

export function ApprovalsDeck({ onOpenDisruptions }: { onOpenDisruptions: () => void }) {
  const { user, revision, refresh } = useApp();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [proposals, setProposals] = useState<ServerProposal[]>([]);
  const [myChanges, setMyChanges] = useState<ServerProposal[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const b = await fetchBookings();
      setSubs(b.submitted);
      if (user.role === "admin") setProposals(await fetchProposals());
      if (user.role === "faculty" || user.role === "department_coordinator") setMyChanges(await fetchFacultyRequests());
      setLoadError(null);
    } catch (e) {
      setLoadError(describeError(e));
    }
  }, [user.role]);

  useEffect(() => {
    load();
  }, [load, revision]);

  const act = async (id: string, fn: () => Promise<Submission>, okText: string) => {
    setBusy(id);
    setFeedback(null);
    try {
      const s = await fn();
      setFeedback({ ok: true, text: `${okText} ${s.id} is now ${s.status.replace(/_/g, " ").toLowerCase()}.` });
      await load();
      refresh();
    } catch (e) {
      setFeedback({ ok: false, text: describeError(e) });
    } finally {
      setBusy(null);
    }
  };

  const canDecide = user.role === "admin" || user.role === "department_coordinator";
  const toDecide = subs.filter((s) => s.status === "PENDING_APPROVAL" && s.requester_username !== user.username);
  const ownPendingVisible = subs.filter((s) => s.status === "PENDING_APPROVAL" && s.requester_username === user.username);
  const mine = subs.filter((s) => s.requester_username === user.username);
  const pendingProposals = proposals.filter((p) => p.status === "PENDING");

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-1.5 rounded-[3px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <CheckSquare className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Approvals</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            NOBODY APPROVES THEIR OWN REQUEST
          </span>
        </div>
        <p className="text-neutral-400">
          Signed in as <strong className="text-cyan-400">{user.display_name}</strong>. Every approval re-checks the room and time
          against the hard rules at that moment, so two requests for the same slot cannot both be approved.
        </p>
      </div>

      {feedback && (
        <div className={`p-3 rounded border flex items-center gap-2 ${feedback.ok ? "bg-[#161B22] border-cyan-500/50 text-cyan-200" : "bg-rose-950/50 border-rose-500/40 text-rose-200"}`} role="status">
          {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}
      {loadError && <p className="text-rose-300">{loadError}</p>}

      {user.role === "admin" && (
        <section className="space-y-2">
          <h3 className="text-neutral-300 font-bold uppercase flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-rose-400" /> Timetable changes waiting ({pendingProposals.length})
          </h3>
          {pendingProposals.length === 0 && <p className="text-neutral-500">None.</p>}
          {pendingProposals.map((p) => (
            <div key={p.proposal_id} className="p-3 bg-[#0E1216] border border-white/10 rounded-[4px] flex flex-wrap items-center justify-between gap-2">
              <span className="text-neutral-200">
                <strong className="text-white">{p.type.replace(/_/g, " ")}</strong> {p.proposal_id} by {p.requested_by}:{" "}
                {p.moved_count} session(s) move{p.proven_minimum ? " (proven minimum)" : ""}
                {p.requested_by === user.username && <span className="text-rose-300"> (yours: another Admin must approve)</span>}
              </span>
              <button onClick={onOpenDisruptions}
                className="px-3 py-1 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer">
                REVIEW DIFF
              </button>
            </div>
          ))}
        </section>
      )}

      {canDecide && (
        <section className="space-y-2">
          <h3 className="text-neutral-300 font-bold uppercase">Bookings waiting for a decision ({toDecide.length})</h3>
          {toDecide.length === 0 && (
            <p className="text-neutral-500">
              Nothing to decide{ownPendingVisible.length ? "; your own pending requests need another approver" : ""}.
            </p>
          )}
          {toDecide.map((s) => (
            <div key={s.id} className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white text-sm">{s.id}: {s.title}</span>
                <span className="text-[10px] px-1.5 rounded bg-white/10 text-neutral-300">
                  {s.requester} ({s.role.replace(/_/g, " ")}){s.manual ? " // manual" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-neutral-300">
                <span className="p-2 bg-[#12161C] rounded flex items-center gap-1"><Clock className="w-3 h-3 text-cyan-400" />{slotText(s)}</span>
                <span className="p-2 bg-[#12161C] rounded flex items-center gap-1"><Users className="w-3 h-3 text-purple-400" />{s.request.attendance} people</span>
                <span className="p-2 bg-[#12161C] rounded flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-400" />{s.proposed.effective_category?.replace(/_/g, " ") || ""}</span>
              </div>
              <p className="text-neutral-400"><strong className="text-neutral-300">Rules engine:</strong> {s.proposed.reason}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                <input
                  value={reasons[s.id] || ""}
                  onChange={(e) => setReasons({ ...reasons, [s.id]: e.target.value })}
                  placeholder="Reason (optional, shown to the requester)"
                  className="flex-1 min-w-[200px] px-2 py-1 bg-[#161B22] border border-white/10 rounded text-white"
                />
                <div className="flex gap-2">
                  <button disabled={busy === s.id}
                    onClick={() => act(s.id, () => decideSubmission(s.id, "reject", reasons[s.id]), "Rejected.")}
                    className="px-3 py-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 rounded disabled:opacity-40 cursor-pointer">
                    REJECT
                  </button>
                  <button disabled={busy === s.id}
                    onClick={() => act(s.id, () => decideSubmission(s.id, "offer_alternative", reasons[s.id]), "Offered.")}
                    className="px-3 py-1 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 rounded disabled:opacity-40 cursor-pointer">
                    OFFER THIS AS ALTERNATIVE
                  </button>
                  <button disabled={busy === s.id}
                    onClick={() => act(s.id, () => decideSubmission(s.id, "approve", reasons[s.id]), "Approved.")}
                    className="px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 rounded font-bold disabled:opacity-40 cursor-pointer">
                    APPROVE
                  </button>
                </div>
              </div>
            </div>
          ))}
          {ownPendingVisible.map((s) => (
            <div key={s.id} className="p-2 bg-rose-950/30 border border-rose-500/30 rounded text-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{s.id} is your own request; another approver has to decide it.</span>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-neutral-300 font-bold uppercase">My requests ({mine.length})</h3>
        {mine.length === 0 && <p className="text-neutral-500">You have not submitted any bookings from this app yet (use the AI Assistant).</p>}
        {mine.map((s) => (
          <div key={s.id} className="p-3 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-white font-bold">{s.id}: {s.title}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_STYLE[s.status] || ""}`}>
                {s.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-neutral-300">{slotText(s)}</p>
            <p className="text-neutral-400">
              <strong className="text-neutral-300">Reason:</strong> {s.decision_reason}
              {s.decided_by && <> (decided by {s.decided_by})</>}
            </p>
            <div className="flex gap-2">
              {s.status === "ALTERNATIVE_OFFERED" && (
                <>
                  <button disabled={busy === s.id} onClick={() => act(s.id, () => respondToAlternative(s.id, true), "Accepted.")}
                    className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 rounded cursor-pointer">ACCEPT ALTERNATIVE</button>
                  <button disabled={busy === s.id} onClick={() => act(s.id, () => respondToAlternative(s.id, false), "Declined.")}
                    className="px-2.5 py-1 bg-[#161B22] text-neutral-300 border border-white/15 rounded cursor-pointer">DECLINE</button>
                </>
              )}
              {(s.status === "PENDING_APPROVAL" || s.status === "APPROVED") && (
                <button disabled={busy === s.id} onClick={() => act(s.id, () => cancelSubmission(s.id), "Cancelled.")}
                  className="px-2.5 py-1 bg-[#161B22] text-neutral-300 border border-white/15 rounded cursor-pointer">CANCEL REQUEST</button>
              )}
            </div>
          </div>
        ))}
      </section>

      {(user.role === "faculty" || user.role === "department_coordinator") && (
        <section className="space-y-2">
          <h3 className="text-neutral-300 font-bold uppercase">My timetable change requests ({myChanges.length})</h3>
          {myChanges.length === 0 && <p className="text-neutral-500">None yet (ask in the AI Assistant, for example "move my CS201 lecture off Monday").</p>}
          {myChanges.map((p) => (
            <div key={p.proposal_id} className="p-3 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-white">{p.proposal_id}: {p.request_text || p.type.replace(/_/g, " ")}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_STYLE[p.status] || "bg-rose-500/20 text-rose-300 border-rose-500/40"}`}>
                  {p.status}
                </span>
              </div>
              {p.message && <p className="text-neutral-400">{p.message}</p>}
              {p.moved && p.moved.length > 0 && (
                <p className="text-neutral-400">{p.moved.length} session(s) would move; an Admin must approve.</p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
