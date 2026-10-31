"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { BookingRequest, DayOfWeek, Explanation } from "@/lib/types";
import { useApp } from "@/lib/appContext";
import { describeError, explainBooking, fetchBookings, scheduleManualEvent, ApiError } from "@/lib/api";
import { PERIOD_CLOCK } from "@/lib/uiConfig";
import { TactileButton } from "@/components/tactile/TactileButton";
import {
  Sparkles, Search, MapPin, Clock, Users, CheckCircle2, XCircle, Plus, Send, ArrowRight, HelpCircle, AlertTriangle,
} from "lucide-react";

const FEATURES = ["projector", "pa_system", "stage", "computers", "power_benches", "accessible", "ac"];

export function SpectraClashMatrix() {
  const { ref, user, revision, refresh } = useApp();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [decided, setDecided] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selected, setSelected] = useState<string | null>(null);
  const [why, setWhy] = useState<Record<string, Explanation | string>>({});
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // manual event form
  const eventRooms = useMemo(() => (ref?.rooms || []).filter((r) => r.allowed_uses.includes("event")), [ref]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("club_event");
  const [attendance, setAttendance] = useState(60);
  const [duration, setDuration] = useState(2);
  const [day, setDay] = useState<DayOfWeek>("THU");
  const [start, setStart] = useState(10);
  const [room, setRoom] = useState("SH-1");
  const [features, setFeatures] = useState<string[]>([]);
  const [groups, setGroups] = useState("");
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string; rules?: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchBookings()
      .then((b) => {
        setBookings(b.requests);
        setDecided(b.decided);
        setLoadError(null);
      })
      .catch((e) => setLoadError(describeError(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load, revision]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterStatus !== "all" && b.status !== filterStatus) return false;
      if (filterCategory !== "all" && b.effective_category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (![b.title, b.requester, b.id].some((x) => x.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [bookings, filterStatus, filterCategory, searchQuery]);

  const stats = useMemo(() => ({
    total: bookings.length,
    approved: bookings.filter((b) => b.status === "approved").length,
    alternatives: bookings.filter((b) => b.status === "alternative_offered").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }), [bookings]);

  const toggleWhy = async (id: string) => {
    if (selected === id) {
      setSelected(null);
      return;
    }
    setSelected(id);
    if (!why[id]) {
      try {
        const e = await explainBooking(id);
        setWhy((w) => ({ ...w, [id]: e }));
      } catch (err) {
        setWhy((w) => ({ ...w, [id]: describeError(err) }));
      }
    }
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    try {
      const s = await scheduleManualEvent({
        title: title || "Campus event",
        room_id: room,
        day,
        start_period: start,
        end_period: start + duration - 1,
        attendance,
        needs: features,
        mandatory_for_groups: groups.split(/[ ,]+/).map((g) => g.trim().toUpperCase()).filter(Boolean),
        requested_category: category,
      });
      setFormMsg({
        ok: true,
        text: s.status === "APPROVED"
          ? `${s.id} scheduled in ${room}, ${day} P${start}-P${start + duration - 1}. All hard rules passed.`
          : `${s.id} passed every hard rule and is waiting for an approver (see Approvals).`,
      });
      refresh();
    } catch (err) {
      setFormMsg({ ok: false, text: describeError(err), rules: err instanceof ApiError ? err.ruleIds : [] });
    } finally {
      setSubmitting(false);
    }
  };

  // every start that fits before 22:00; the server checks lunch, rooms and clashes
  const startOptions = Array.from({ length: Math.max(1, 13 - duration + 1) }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-[3px] bg-amber-950/60 border border-amber-500/40 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">Spectra Week 7 bookings</h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-[2px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {decided ? "DECIDED BY PRIORITY RULES" : "NOT EVALUATED YET"}
              </span>
            </div>
            <p className="font-mono text-xs text-neutral-400 mt-1">
              Priority: institute (5) &gt; guest lecture (4) &gt; department (3) &gt; club (2); ties go to the earlier request.
              A request&apos;s category is capped by the requester&apos;s role.
            </p>
          </div>
          <TactileButton size="sm" variant="amber" onClick={() => setIsCreating(!isCreating)} icon={<Plus className="w-3.5 h-3.5" />}>
            {isCreating ? "CLOSE FORM" : "SCHEDULE AN EVENT MANUALLY"}
          </TactileButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs pt-2 border-t border-white/5">
          {[
            ["REQUESTS", stats.total, "text-white", "border-white/10"],
            ["APPROVED", stats.approved, "text-emerald-300", "border-emerald-500/30"],
            ["ALTERNATIVES", stats.alternatives, "text-cyan-300", "border-cyan-500/30"],
            ["REJECTED", stats.rejected, "text-rose-300", "border-rose-500/30"],
            ["CANCELLED", stats.cancelled, "text-neutral-400", "border-white/10"],
          ].map(([label, n, color, border]) => (
            <div key={label as string} className={`p-2 bg-[#12161C] border ${border} rounded-[3px]`}>
              <span className="text-[10px] text-neutral-400 block">{label}</span>
              <span className={`text-base font-bold ${color} mt-0.5 block`}>{n as number}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" placeholder="Search title, requester, ID..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search requests"
                className="pl-8 pr-2 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 w-48" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Status"
              className="px-2.5 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white cursor-pointer">
              <option value="all">ALL STATUSES</option>
              <option value="approved">APPROVED</option>
              <option value="alternative_offered">ALTERNATIVE OFFERED</option>
              <option value="rejected">REJECTED</option>
              <option value="cancelled">CANCELLED</option>
              <option value="pending">NOT DECIDED</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} aria-label="Category"
              className="px-2.5 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white cursor-pointer">
              <option value="all">ALL CATEGORIES</option>
              <option value="institute_event">INSTITUTE (5)</option>
              <option value="guest_lecture">GUEST LECTURE (4)</option>
              <option value="department_event">DEPARTMENT (3)</option>
              <option value="club_event">CLUB (2)</option>
            </select>
          </div>
          <span className="text-neutral-400">SHOWING <strong className="text-white">{filtered.length}</strong></span>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={submitManual} className="p-4 bg-[#130E1D] border border-amber-500/40 rounded-[4px] space-y-3 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 uppercase">
              <Plus className="w-4 h-4 text-amber-400" /> Schedule an event in a chosen room and time
            </span>
            <span className="text-neutral-400 text-[10px]">
              As <strong className="text-white">{user.display_name}</strong>.
              {user.role === "admin" || user.role === "department_coordinator" ? " Valid events are booked at once." : " Valid events go to an approver."}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-neutral-400 block text-[10px] mb-1">EVENT TITLE</span>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Robotics workshop"
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white focus:outline-none focus:border-amber-400" />
            </label>
            <label className="block">
              <span className="text-neutral-400 block text-[10px] mb-1">CATEGORY (CAPPED BY YOUR ROLE)</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white">
                <option value="club_event">Club event</option>
                <option value="department_event">Department event</option>
                <option value="guest_lecture">Guest lecture</option>
                <option value="institute_event">Institute event</option>
              </select>
            </label>
            <label className="block">
              <span className="text-neutral-400 block text-[10px] mb-1">ATTENDANCE</span>
              <input type="number" min={1} max={5000} value={attendance} onChange={(e) => setAttendance(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white" />
            </label>
            <label className="block">
              <span className="text-neutral-400 block text-[10px] mb-1">ROOM</span>
              <select value={room} onChange={(e) => setRoom(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white">
                {eventRooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.id} - {r.name} ({r.capacity}{r.accessible ? ", accessible" : ""})</option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <label className="block w-1/3">
                <span className="text-neutral-400 block text-[10px] mb-1">DAY</span>
                <select value={day} onChange={(e) => setDay(e.target.value as DayOfWeek)}
                  className="w-full px-2 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white">
                  {(ref?.calendar.days || []).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className="block w-1/3">
                <span className="text-neutral-400 block text-[10px] mb-1">START</span>
                <select value={start} onChange={(e) => setStart(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white">
                  {startOptions.map((p) => <option key={p} value={p}>P{p} {PERIOD_CLOCK[p]}</option>)}
                </select>
              </label>
              <label className="block w-1/3">
                <span className="text-neutral-400 block text-[10px] mb-1">HOURS</span>
                <input type="number" min={1} max={13} value={duration} onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white" />
              </label>
            </div>
            <label className="block">
              <span className="text-neutral-400 block text-[10px] mb-1">COMPULSORY FOR GROUPS (optional, e.g. CSE-3)</span>
              <input value={groups} onChange={(e) => setGroups(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white" />
            </label>
          </div>
          <fieldset className="flex flex-wrap gap-3">
            <legend className="text-neutral-400 text-[10px] mb-1">NEEDS</legend>
            {FEATURES.map((f) => (
              <label key={f} className="flex items-center gap-1 text-neutral-300 cursor-pointer">
                <input type="checkbox" checked={features.includes(f)}
                  onChange={(e) => setFeatures(e.target.checked ? [...features, f] : features.filter((x) => x !== f))} />
                {f.replace("_", " ")}
              </label>
            ))}
          </fieldset>
          {formMsg && (
            <div className={`p-2 rounded border flex items-start gap-2 ${formMsg.ok ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200" : "bg-rose-950/50 border-rose-500/40 text-rose-200"}`} role="status">
              {formMsg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{formMsg.ok ? formMsg.text : `Blocked, nothing was booked. ${formMsg.text}`}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <TactileButton size="sm" variant="ghost" type="button" onClick={() => setIsCreating(false)}>CANCEL</TactileButton>
            <TactileButton size="sm" variant="amber" type="submit" disabled={submitting} icon={<Send className="w-3.5 h-3.5" />}>
              {submitting ? "CHECKING RULES..." : "CHECK & SCHEDULE"}
            </TactileButton>
          </div>
        </form>
      )}

      {loading && <p className="font-mono text-xs text-neutral-400">Loading requests...</p>}
      {loadError && <p className="font-mono text-xs text-rose-300">{loadError}</p>}
      {!loading && !loadError && bookings.length === 0 && (
        <p className="font-mono text-xs text-neutral-400">No requests are visible to your account.</p>
      )}
      {!decided && !loading && bookings.length > 0 && (
        <p className="font-mono text-xs text-amber-200">
          These requests have not been decided yet. {user.role === "admin" ? "Press 3. DECIDE SPECTRA REQUESTS above." : "An Admin runs the evaluation."}
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((req) => {
          const w = why[req.id];
          return (
            <div key={req.id} className={`p-3 bg-[#0E1216] border rounded-[4px] ${selected === req.id ? "border-cyan-400" : "border-white/10"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-white">{req.id}</span>
                  <span className="font-mono text-[10px] px-1.5 rounded bg-white/10 text-neutral-300 uppercase">{req.requester}</span>
                  <span className="font-mono text-[10px] px-1.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 uppercase">
                    {req.effective_category.replace(/_/g, " ")}
                  </span>
                  {req.effective_category !== req.requested_category && (
                    <span className="font-mono text-[10px] px-1.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300"
                      title="The requester asked for a higher category than their role allows">
                      asked: {req.requested_category.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {req.status === "approved" && (
                    <span className="px-2 py-0.5 rounded-[2px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> APPROVED
                    </span>
                  )}
                  {req.status === "alternative_offered" && (
                    <span className="px-2 py-0.5 rounded-[2px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> ALTERNATIVE OFFERED
                    </span>
                  )}
                  {req.status === "rejected" && (
                    <span className="px-2 py-0.5 rounded-[2px] bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> REJECTED
                    </span>
                  )}
                  {req.status === "cancelled" && (
                    <span className="px-2 py-0.5 rounded-[2px] bg-neutral-800 text-neutral-400 border border-white/10 text-[10px] font-mono font-bold">CANCELLED BY REQUESTER</span>
                  )}
                  {req.status === "pending" && (
                    <span className="px-2 py-0.5 rounded-[2px] bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">NOT DECIDED</span>
                  )}
                  {req.status !== "pending" && (
                    <button onClick={() => toggleWhy(req.id)}
                      className="px-2 py-0.5 rounded-[2px] border border-white/15 text-neutral-300 hover:text-white text-[10px] font-mono flex items-center gap-1 cursor-pointer">
                      <HelpCircle className="w-3 h-3" /> {selected === req.id ? "HIDE" : "WHY?"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-neutral-100">{req.title}</span>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-neutral-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {req.status === "pending" || req.status === "rejected" || req.status === "cancelled"
                      ? `asked: ${(req.windows || []).map((w) => `${w.day} P${w.from_period}-P${w.to_period}`).join(" or ")}`
                      : `${req.day} P${req.start_period}${req.end_period > req.start_period ? `-P${req.end_period}` : ""}`}
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {req.assigned_room ? <strong className="text-white">{req.assigned_room}</strong> : "no room"}
                    {req.requested_room && req.requested_room !== req.assigned_room && (
                      <span className="text-neutral-500">(wished {req.requested_room})</span>
                    )}
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-purple-400" />{req.attendance}</span>
                </div>
              </div>

              <p className="font-mono text-[11px] text-neutral-400 mt-1.5 pt-1.5 border-t border-white/5">
                <strong className="text-neutral-300">Reason:</strong> {req.reason}
                {req.displaced_class && (
                  <span className="text-amber-400 block mt-0.5">
                    Week 7 only: class {req.displaced_class} was moved to another legal slot to make room.
                  </span>
                )}
              </p>

              {selected === req.id && (
                <div className="mt-2 p-2 bg-[#12161C] border border-cyan-500/30 rounded font-mono text-[11px] space-y-1">
                  {!w && <span className="text-neutral-400">Loading explanation...</span>}
                  {typeof w === "string" && <span className="text-rose-300">{w}</span>}
                  {w && typeof w !== "string" && w.explanation.map((line, i) => <p key={i} className="text-neutral-200">{line}</p>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
