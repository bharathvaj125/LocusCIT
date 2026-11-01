"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, ArrowRight, Check, Clock, ShieldAlert, Timer, Users, X, Wrench } from "lucide-react";
import { ServerProposal, Submission } from "@/lib/types";
import { useApp } from "@/lib/appContext";
import { cancelSubmission, decideSubmission, describeError, fetchBookings, fetchFacultyRequests, fetchNegotiationOptions, fetchNegotiations, fetchProposals, Negotiation, NegotiationOption, respondToAlternative, respondToNegotiation, startNegotiation, withdrawNegotiation } from "@/lib/api";
import { CATEGORY_LABEL, CATEGORY_TONE } from "@/lib/dept";
import { periodRange } from "@/lib/uiConfig";
import { askedText, cleanReason, placedText } from "@/lib/reason";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { Button, Card, Chip, EmptyState, Eyebrow, PageTitle, Skeleton, statusTone } from "@/components/ui/primitives";

function slotText(s: Submission) {
  if (s.placement) { const p = s.placement; return `${p.day} ${periodRange(p.start_period, p.end_period)} in ${p.room_id}`; }
  return `asked ${s.request.windows.map((w) => `${w.day} P${w.from_period}-P${w.to_period}`).join(" or ")}`;
}
const slotOf = (p: { day: string; start_period: number; end_period: number; room_id: string }) => `${p.day} ${periodRange(p.start_period, p.end_period)} in ${p.room_id}`;
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const OFFER_NOTE: Record<string, string> = {
  awaiting_response: "Waiting for the answer", accepted: "Agreed to move", declined: "Declined, nothing changed",
  expired: "No answer in time, nothing changed", withdrawn: "Withdrawn", failed_revalidation: "No longer valid, nothing changed",
};
const nice = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export function ApprovalsDeck({ onOpenChanges }: { onOpenChanges: () => void }) {
  const { user, revision, refresh } = useApp();
  const toast = useToast();
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [proposals, setProposals] = useState<ServerProposal[]>([]);
  const [myChanges, setMyChanges] = useState<ServerProposal[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Negotiation[]>([]);
  const [loadedAt, setLoadedAt] = useState(Date.now());
  const [tick, setTick] = useState(0);
  const [opts, setOpts] = useState<Record<string, NegotiationOption>>({});

  const load = useCallback(async () => {
    try {
      const b = await fetchBookings();
      setSubs(b.submitted);
      try { setOffers((await fetchNegotiations()).negotiations); setLoadedAt(Date.now()); } catch { /* the offers list is optional */ }
      if (user.role === "admin") setProposals(await fetchProposals());
      if (user.role === "faculty" || user.role === "department_coordinator") setMyChanges(await fetchFacultyRequests());
      setError(null);
    } catch (e) { setError(describeError(e)); }
  }, [user.role]);
  useEffect(() => { load(); }, [load, revision]);
  const hasOpen = offers.some((o) => o.status === "awaiting_response");
  useEffect(() => {
    if (!hasOpen) return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [hasOpen]);
  const left = (o: Negotiation) => Math.max(0, o.seconds_left - (Date.now() - loadedAt) / 1000);
  useEffect(() => {
    if (offers.some((o) => o.status === "awaiting_response" && left(o) <= 0)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  const offerFor = (s: Submission) => offers.find((o) => o.id === s.negotiation_id);
  const look = async (id: string) => {
    setBusy(id);
    try { setOpts({ ...opts, [id]: await fetchNegotiationOptions(id) }); } catch (e) { toast.error(describeError(e)); } finally { setBusy(null); }
  };
  const actOffer = async (id: string, fn: () => Promise<Negotiation>, verb: string) => {
    setBusy(id);
    try { const n = await fn(); toast.success(`${verb}: ${OFFER_NOTE[n.status] || n.status}.`); await load(); refresh(); }
    catch (e) { toast.error(describeError(e)); await load(); } finally { setBusy(null); }
  };

  const act = async (id: string, fn: () => Promise<Submission>, verb: string) => {
    setBusy(id);
    try {
      const s = await fn();
      toast.success(`${verb} ${s.id}.`);
      await load(); refresh();
    } catch (e) { toast.error(describeError(e)); } finally { setBusy(null); }
  };

  const canDecide = user.role === "admin" || user.role === "department_coordinator";
  const all = subs || [];
  const toDecide = all.filter((s) => s.status === "PENDING_APPROVAL" && s.requester_username !== user.username);
  const ownPending = all.filter((s) => s.status === "PENDING_APPROVAL" && s.requester_username === user.username);
  const needsReview = all.filter((s) => s.status === "NEEDS_REVIEW");
  const mine = all.filter((s) => s.requester_username === user.username);
  const pendingProposals = proposals.filter((p) => p.status === "PENDING");

  return (
    <div className="space-y-7">
      <PageTitle eyebrow="Approvals" title={<>Decisions, <span className="italic font-medium text-gold">made by someone else</span></>}
        subtitle="Every approval re-checks the room and time against the hard rules at that moment, so two requests for the same slot can never both be approved. Nobody can approve their own request." />
      {error && <p className="text-sm text-sunrise-600">{error}</p>}
      {!subs && !error && <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>}

      {user.role === "admin" && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold flex items-center gap-2"><Wrench className="w-5 h-5 text-sunrise-600" />Timetable changes waiting <Chip tone={pendingProposals.length ? "sunrise" : "stone"}>{pendingProposals.length}</Chip></h2>
          {pendingProposals.length === 0 && <p className="text-sm text-ink-600">None.</p>}
          {pendingProposals.map((p) => (
            <Card key={p.proposal_id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold capitalize">{p.type.replace(/_/g, " ")} <span className="font-mono text-xs text-ink-400">{p.proposal_id}</span></p>
                <p className="text-sm text-ink-600">Requested by {p.requested_by} · {p.moved_count} session(s) move{p.proven_minimum ? ", the fewest possible" : ""}</p>
                {p.requested_by === user.username && <p className="text-xs text-sunrise-600 mt-1">You proposed this, so another Admin has to approve it.</p>}
              </div>
              <Button variant="secondary" size="sm" onClick={onOpenChanges}>Review the diff</Button>
            </Card>
          ))}
        </section>
      )}

      {canDecide && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold flex items-center gap-2">Bookings waiting for a decision <Chip tone={toDecide.length ? "sunrise" : "stone"}>{toDecide.length}</Chip></h2>
          {subs && toDecide.length === 0 && <EmptyState title="Nothing to decide" body={ownPending.length ? "Your own pending requests need another approver." : "New requests from clubs, faculty and departments show up here."} />}
          <AnimatePresence initial={false}>
            {toDecide.map((s) => (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 60 }}>
                <Card className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><p className="font-display text-lg font-semibold">{s.title}</p><p className="text-sm text-ink-600">{s.requester} · {nice(s.role)}{s.manual ? " · manual" : ""} · <span className="font-mono text-xs">{s.id}</span></p></div>
                    {s.proposed.effective_category && <Chip tone={CATEGORY_TONE[s.proposed.effective_category] || "stone"}>{CATEGORY_LABEL[s.proposed.effective_category] || s.proposed.effective_category}</Chip>}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-paper px-3 py-1.5"><Clock className="w-4 h-4 text-lagoon-700" />{slotText(s)}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-paper px-3 py-1.5"><Users className="w-4 h-4 text-plum-500" />{s.request.attendance} people</span>
                  </div>
                  {s.placement && s.proposed.status !== "approved" && (
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div className="rounded-xl bg-paper px-3 py-2"><Eyebrow className="text-ink-400">Asked for</Eyebrow><p className="font-semibold mt-0.5">{askedText(s.request.windows)}</p></div>
                      <div className="rounded-xl bg-lagoon-50 px-3 py-2"><Eyebrow className="text-ink-400">Engine offers instead</Eyebrow><p className="font-semibold mt-0.5">{placedText(s.placement)}</p></div>
                    </div>
                  )}
                  <p className="text-sm text-ink-600"><strong className="text-ink-900">Rules engine:</strong> {cleanReason(s.proposed.reason)}</p>
                  {offerFor(s)?.status === "accepted" && <p className="text-sm rounded-xl bg-lagoon-50 text-lagoon-900 px-3 py-2">Approving this also moves <strong>{offerFor(s)!.holder.title}</strong> from {slotOf(offerFor(s)!.a_from)} to {slotOf(offerFor(s)!.a_to)}, as its owner agreed. Both are re-checked first.</p>}
                  {s.routing && <p className="text-sm rounded-xl bg-paper px-3 py-2 flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-lagoon-700" /><span><strong>Who can decide:</strong> {s.routing.why}</span></p>}
                  {s.affected_classes && s.affected_classes.length > 0 && (
                    <div className="rounded-xl bg-saffron-50 text-saffron-600 px-3 py-2 text-sm space-y-1">
                      <p className="font-semibold">Moves {s.affected_classes.length} class{s.affected_classes.length === 1 ? "" : "es"} in Week 7 only:</p>
                      {s.affected_classes.map((a) => <p key={a.session_id}>• <span className="font-mono text-xs">{a.course_id}</span> {a.old ? `${a.old.day} P${a.old.start_period} ${a.old.room_id}` : "now"} <ArrowRight className="inline w-3.5 h-3.5" /> <strong>{a.new.day} P{a.new.start_period} {a.new.room_id}</strong></p>)}
                    </div>
                  )}
                  {s.can_decide === false ? (
                    <p className="text-sm text-ink-600 pt-3 border-t border-line">{s.decide_blocked_reason || "You cannot decide this request."}</p>
                  ) : (
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-line">
                    <input value={reasons[s.id] || ""} onChange={(e) => setReasons({ ...reasons, [s.id]: e.target.value })} placeholder="Reason, shown to the requester (optional)" aria-label="Reason"
                      className="flex-1 min-w-[220px] h-10 px-3 rounded-xl bg-paper border border-line text-sm" />
                    <Button variant="danger" size="sm" icon={<X className="w-4 h-4" />} disabled={busy === s.id} onClick={() => act(s.id, () => decideSubmission(s.id, "reject", reasons[s.id]), "Rejected")}>Reject</Button>
                    {!s.affected_classes?.length && <Button variant="secondary" size="sm" disabled={busy === s.id} onClick={() => act(s.id, () => decideSubmission(s.id, "offer_alternative", reasons[s.id], s.placement), "Offered an alternative for")}>Offer as alternative</Button>}
                    <Button variant="success" size="sm" icon={<Check className="w-4 h-4" />} loading={busy === s.id} onClick={() => act(s.id, () => decideSubmission(s.id, "approve", reasons[s.id], s.placement), "Approved")}>Approve</Button>
                  </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {ownPending.map((s) => (
            <div key={s.id} className="rounded-xl bg-sunrise-50 text-sunrise-600 px-4 py-3 text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4 shrink-0" />{s.id} is your own request; another approver has to decide it.</div>
          ))}
        </section>
      )}

      {offers.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-lagoon-700" />Move offers <Chip tone="stone">{offers.length}</Chip></h2>
          <p className="text-sm text-ink-600 -mt-1">Voluntary only. An approved booking stays exactly as it is until its owner agrees <em>and</em> an approver approves the other request; a no, or no answer, changes nothing.</p>
          {offers.map((o) => {
            const sec = left(o);
            return (
              <Card key={o.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{o.can_respond ? "Can you move your booking?" : `${o.requester.title} needs ${o.holder.requester}'s slot`} <span className="font-mono text-xs text-ink-400">{o.id}</span></p>
                  <div className="flex items-center gap-2">
                    {o.status === "awaiting_response" && <Chip tone={sec < 60 ? "sunrise" : "lagoon"}><Timer className="w-3.5 h-3.5 mr-1 inline" />{clock(sec)} left</Chip>}
                    <Chip tone={statusTone(o.status)} dot>{OFFER_NOTE[o.status] || o.status}</Chip>
                  </div>
                </div>
                <p className="text-sm text-ink-600"><strong className="text-ink-900">{o.requester.requester}</strong> ({o.requester.title}) needs <strong>{slotOf(o.b_slot)}</strong>. <strong>{o.holder.title}</strong> is there now; if its owner agrees it would move to <strong>{slotOf(o.a_to)}</strong>, inside the times it was approved for.</p>
                {o.problems && o.problems.length > 0 && <p className="text-sm text-sunrise-600">{o.problems.join("; ")}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  {o.can_respond && <>
                    <Button size="sm" variant="success" icon={<Check className="w-4 h-4" />} disabled={busy === o.id || sec <= 0} onClick={() => actOffer(o.id, () => respondToNegotiation(o.id, true), "Accepted")}>Agree to move</Button>
                    <Button size="sm" variant="secondary" disabled={busy === o.id} onClick={() => actOffer(o.id, () => respondToNegotiation(o.id, false), "Declined")}>Keep my booking</Button>
                  </>}
                  {o.can_withdraw && <Button size="sm" variant="ghost" disabled={busy === o.id} onClick={() => actOffer(o.id, () => withdrawNegotiation(o.id), "Withdrawn")}>Withdraw offer</Button>}
                </div>
                {o.status === "accepted" && !o.applied && <p className="text-xs text-ink-400">Nothing has moved yet. It happens together when an approver approves {o.requester.title}.</p>}
              </Card>
            );
          })}
        </section>
      )}

      {needsReview.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Needs another look</h2>
          {needsReview.map((s) => <Card key={s.id} className="p-4 bg-saffron-50 border-saffron-500/40"><p className="font-semibold">{s.title} <span className="font-mono text-xs text-ink-400">{s.id}</span></p><p className="text-sm text-ink-600 mt-1">{cleanReason(s.decision_reason)}</p></Card>)}
        </section>
      )}

      {user.role !== "admin" && <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">My requests <Chip tone="stone">{mine.length}</Chip></h2>
        {subs && mine.length === 0 && <EmptyState tone="saffron" title="You have not requested anything yet" body="Open the Assistant and describe an event in plain English or Hinglish." />}
        {mine.map((s) => (
          <Card key={s.id} className="p-4 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{s.title} <span className="font-mono text-xs text-ink-400">{s.id}</span></p><Chip tone={statusTone(s.status)} dot>{nice(s.status)}</Chip></div>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div className="rounded-xl bg-paper px-3 py-2"><Eyebrow className="text-ink-400">You asked for</Eyebrow><p className="font-semibold mt-0.5">{askedText(s.request.windows)}</p></div>
              {s.placement && <div className={cn("rounded-xl px-3 py-2", s.proposed.status === "approved" ? "bg-mangrove-50" : "bg-lagoon-50")}><Eyebrow className="text-ink-400">{s.status === "APPROVED" ? "Booked" : s.proposed.status === "approved" ? "Proposed slot" : "Offered instead"}</Eyebrow><p className="font-semibold mt-0.5">{placedText(s.placement)}</p></div>}
            </div>
            {(s.status === "PENDING_APPROVAL" || s.status === "PENDING_NEGOTIATION") && <p className="text-sm font-semibold text-lagoon-900">Pending: not confirmed until an Admin approves it. Nothing is booked yet.</p>}
            <p className="text-sm text-ink-600"><strong className="text-ink-900">Reason:</strong> {cleanReason(s.decision_reason)}{s.decided_by && <> (decided by {s.decided_by})</>}</p>
            {s.status === "PENDING_NEGOTIATION" && offerFor(s) && <p className="text-sm text-lagoon-900 bg-lagoon-50 rounded-xl px-3 py-2">Asked {offerFor(s)!.holder.requester} to move. {offerFor(s)!.status === "awaiting_response" ? `${clock(left(offerFor(s)!))} left to answer.` : OFFER_NOTE[offerFor(s)!.status]} Their booking stays as it is meanwhile.</p>}
            {opts[s.id] && (opts[s.id].available && opts[s.id].holder && opts[s.id].b_slot && opts[s.id].a_to
              ? <div className="rounded-xl bg-lagoon-50 px-3 py-2 text-sm space-y-2">
                  <p><strong>{opts[s.id].holder!.requester}</strong> holds {slotOf(opts[s.id].b_slot!)} and could move to {slotOf(opts[s.id].a_to!)}. You can ask; they may say no, and then your request is decided by the normal rules.</p>
                  <Button size="sm" icon={<ArrowLeftRight className="w-4 h-4" />} disabled={busy === s.id} onClick={async () => { await actOffer(s.id, () => startNegotiation(s.id), "Asked"); setOpts((o) => ({ ...o, [s.id]: { available: false, message: "Offer sent." } })); }}>Ask them to move ({clock(opts[s.id].default_deadline_seconds || 300)} to answer)</Button>
                </div>
              : <p className="text-sm text-ink-600 bg-paper rounded-xl px-3 py-2">{opts[s.id].message || "No existing booking can make room for this."}</p>)}
            <div className="flex flex-wrap gap-2 pt-1">
              {["PENDING_APPROVAL", "REJECTED", "ALTERNATIVE_OFFERED"].includes(s.status) && s.proposed.status !== "approved" && !s.negotiation_id && <Button size="sm" variant="secondary" icon={<ArrowLeftRight className="w-4 h-4" />} disabled={busy === s.id} onClick={() => look(s.id)}>Can someone make room?</Button>}
              {s.status === "ALTERNATIVE_OFFERED" && <>
                <Button size="sm" variant="success" disabled={busy === s.id} onClick={() => act(s.id, () => respondToAlternative(s.id, true), "Accepted the alternative for")}>Accept alternative</Button>
                <Button size="sm" variant="secondary" disabled={busy === s.id} onClick={() => act(s.id, () => respondToAlternative(s.id, false), "Declined the alternative for")}>Decline</Button>
              </>}
              {(s.status === "PENDING_APPROVAL" || s.status === "APPROVED") && <Button size="sm" variant="ghost" disabled={busy === s.id} onClick={() => act(s.id, () => cancelSubmission(s.id), "Cancelled")}>Cancel request</Button>}
            </div>
          </Card>
        ))}
      </section>}

      {(user.role === "faculty" || user.role === "department_coordinator") && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">My timetable change requests <Chip tone="stone">{myChanges.length}</Chip></h2>
          {myChanges.length === 0 && <p className="text-sm text-ink-600">None yet. In the Assistant, try &ldquo;move my CS201 lecture off Monday&rdquo;.</p>}
          {myChanges.map((p) => (
            <Card key={p.proposal_id} className="p-4 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{p.request_text || nice(p.type)} <span className="font-mono text-xs text-ink-400">{p.proposal_id}</span></p><Chip tone={statusTone(p.status)} dot>{nice(p.status)}</Chip></div>
              {p.message && <p className="text-sm text-ink-600">{p.message}</p>}
              {p.moved && p.moved.length > 0 && <p className="text-sm text-ink-600">{p.moved.length} session(s) would move. An Admin has to approve.</p>}
            </Card>
          ))}
        </section>
      )}
      <div className="text-xs text-ink-400 flex items-center gap-1.5"><Eyebrow className="text-ink-400">Signed in as</Eyebrow>{user.display_name}</div>
    </div>
  );
}
