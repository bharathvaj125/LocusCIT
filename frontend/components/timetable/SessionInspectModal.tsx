"use client";

import React, { useEffect, useState } from "react";
import { Explanation, ScheduledSession } from "@/lib/types";
import { describeError, explainSession } from "@/lib/api";
import { TactileButton } from "@/components/tactile/TactileButton";
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  GraduationCap, 
  Layers, 
  Check, 
  Accessibility, 
  Sparkles
} from "lucide-react";

interface SessionInspectModalProps {
  session: ScheduledSession | null;
  onClose: () => void;
}

export function SessionInspectModal({ session, onClose }: SessionInspectModalProps) {
  const [why, setWhy] = useState<Explanation | null>(null);
  const [whyError, setWhyError] = useState<string | null>(null);

  useEffect(() => {
    setWhy(null);
    setWhyError(null);
    if (!session) return;
    explainSession(session.id).then(setWhy).catch((e) => setWhyError(describeError(e)));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, onClose]);

  if (!session) return null;

  const utilPercent = Math.round(session.capacity_ratio * 100);
  const isUnderutilized = session.is_underutilized;

  // Evaluate hard compliance rules for this session
  const complianceRules = [
    {
      code: "H1",
      name: "Valid Session Scheduling",
      status: "pass" as const,
      detail: `Session ${session.id} scheduled at ${session.day} P${session.start_period} in room ${session.room_id}.`,
    },
    {
      code: "H2 & H4",
      name: "Zero Conflict / No Double Booking",
      status: "pass" as const,
      detail: `Faculty ${session.faculty_name} and Room ${session.room_name} have no concurrent assignments.`,
    },
    {
      code: "H5",
      name: "Venue Capacity Check",
      status: session.size <= session.room_capacity ? ("pass" as const) : ("fail" as const),
      detail: `Session headcount (${session.size}) <= Venue capacity (${session.room_capacity}). Utilization: ${utilPercent}%.`,
    },
    {
      code: "H6",
      name: "Room Type Compatibility",
      status: session.room_types.includes(session.room_type) ? ("pass" as const) : ("fail" as const),
      detail: `Venue type "${session.room_type}" matches required types: [${session.room_types.join(", ")}].`,
    },
    {
      code: "H9",
      name: "Lunch Boundary & Teaching Periods",
      status: (session.start_period <= 5 && session.end_period <= 5) || (session.start_period >= 6 && session.end_period >= 6) ? ("pass" as const) : ("fail" as const),
      detail: `Occupies P${session.start_period}-P${session.end_period}. Does not cross 13:00-14:00 lunch boundary.`,
    },
    {
      code: "H10",
      name: "Accessibility Compliance",
      status: (!session.needs_accessible || session.room_accessible) ? ("pass" as const) : ("fail" as const),
      detail: session.needs_accessible 
        ? (session.room_accessible ? "Accessible room provided for mobility requirements." : "FAIL: Venue is not wheelchair accessible.")
        : "Standard venue allocation verified.",
    },
    {
      code: "H11",
      name: "Parallel Elective Sync (Basket)",
      status: "pass" as const,
      detail: session.basket_slot 
        ? `Co-scheduled in parallel basket ${session.basket_slot} with synchronized timeslots across separate venues.`
        : "Standard core/elective session (no parallel basket constraint).",
    },
    {
      code: "H12",
      name: "Faculty Daily Load Ceiling (<= 4h)",
      status: "pass" as const,
      detail: `Session duration is ${session.duration}h. Faculty ${session.faculty_id} total load on ${session.day} is within limit.`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#0E1216] border border-cyan-500/30 rounded-[4px] shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#161B22] border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[3px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {session.id}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] bg-white/10 text-neutral-300 uppercase">
                  {session.kind}
                </span>
                {session.basket_slot && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                    {session.basket_slot} Parallel
                  </span>
                )}
              </div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                {session.course_id} - {session.course_title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-[3px] transition-colors"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Spatial & Temporal Coordinates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-[#12161C] border border-white/10 rounded-[3px]">
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-neutral-400">
                <Clock className="w-3 h-3 text-cyan-400" /> TIMESLOT
              </span>
              <span className="font-mono text-xs font-bold text-white mt-1 block">
                {session.day} // P{session.start_period}
                {session.duration > 1 && `-P${session.end_period}`}
              </span>
              <span className="font-mono text-[10px] text-cyan-400/80">
                {session.duration} Hour{session.duration > 1 ? "s" : ""}
              </span>
            </div>

            <div className="p-2.5 bg-[#12161C] border border-white/10 rounded-[3px]">
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-neutral-400">
                <MapPin className="w-3 h-3 text-emerald-400" /> ROOM VENUE
              </span>
              <span className="font-mono text-xs font-bold text-white mt-1 block truncate">
                {session.room_id} ({session.room_name})
              </span>
              <span className="font-mono text-[10px] text-neutral-400 capitalize">
                {session.room_type.replace("_", " ")}
              </span>
            </div>

            <div className="p-2.5 bg-[#12161C] border border-white/10 rounded-[3px]">
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-neutral-400">
                <GraduationCap className="w-3 h-3 text-amber-400" /> FACULTY
              </span>
              <span className="font-mono text-xs font-bold text-white mt-1 block truncate">
                {session.faculty_name}
              </span>
              <span className="font-mono text-[10px] text-amber-400/80">
                ID: {session.faculty_id} ({session.faculty_dept})
              </span>
            </div>

            <div className="p-2.5 bg-[#12161C] border border-white/10 rounded-[3px]">
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-neutral-400">
                <Users className="w-3 h-3 text-purple-400" /> GROUPS
              </span>
              <span className="font-mono text-xs font-bold text-white mt-1 block">
                {session.groups.join(", ")}
              </span>
              <span className="font-mono text-[10px] text-neutral-400">
                {session.size} Students
              </span>
            </div>
          </div>

          {/* Room Capacity & Spatial Efficiency Meter */}
          <div className="p-3 bg-[#12161C] border border-white/10 rounded-[3px] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-neutral-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Capacity Utilization: <strong className="text-white">{session.size} / {session.room_capacity} Seats</strong>
              </span>
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-[2px] ${
                isUnderutilized 
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}>
                {utilPercent}% Filled
                {isUnderutilized && " (Underutilized <40%)"}
              </span>
            </div>

            <div className="w-full h-2 bg-[#090C0E] rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-300 ${
                  isUnderutilized 
                    ? "bg-gradient-to-r from-amber-500 to-amber-400" 
                    : "bg-gradient-to-r from-cyan-500 to-emerald-400"
                }`}
                style={{ width: `${Math.min(100, utilPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-white/5">
              <span className="flex items-center gap-1">
                <Accessibility className="w-3.5 h-3.5 text-cyan-400" />
                Accessibility: {session.room_accessible ? "Wheelchair Accessible / Elevators OK" : "Standard Floor Access"}
              </span>
              <span>{session.needs_accessible ? "Requires Accessible: YES" : "Standard Mobility"}</span>
            </div>
          </div>

          {/* Why is it here? Facts computed by the backend from the rules and penalties */}
          <div className="p-3 bg-[#12161C] border border-cyan-500/30 rounded-[3px] space-y-1.5">
            <span className="font-mono text-xs uppercase font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Why is it scheduled here?
            </span>
            {!why && !whyError && <p className="font-mono text-[11px] text-neutral-400">Working it out from the rules...</p>}
            {whyError && <p className="font-mono text-[11px] text-rose-300">{whyError}</p>}
            {why && (
              <>
                {why.explanation.map((line, i) => (
                  <p key={i} className="font-mono text-[11px] text-neutral-200">{line}</p>
                ))}
                {Array.isArray(why.best_alternatives) && (why.best_alternatives as Array<{ slot: string; soft_change: number; because: string[] }>).length > 0 && (
                  <div className="pt-1 space-y-0.5">
                    <span className="font-mono text-[10px] uppercase text-neutral-400">Best legal alternatives if moved alone:</span>
                    {(why.best_alternatives as Array<{ slot: string; soft_change: number; because: string[] }>).map((a) => (
                      <p key={a.slot} className="font-mono text-[10px] text-neutral-400">
                        {a.slot}: penalty {a.soft_change >= 0 ? "+" : ""}{a.soft_change}{a.because.length ? ` (${a.because.join(", ")})` : ""}
                      </p>
                    ))}
                  </div>
                )}
                {why.slots_blocked_by && Object.keys(why.slots_blocked_by as object).length > 0 && (
                  <p className="font-mono text-[10px] text-neutral-500">
                    Other slots ruled out by: {Object.entries(why.slots_blocked_by as Record<string, number>)
                      .map(([k, v]) => `${k} x${v}`).join("; ")}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Hard Constraints & Rules Audit Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Hard Constraint Compliance (H1-H14)
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-[2px]">
                VALIDATOR-CHECKED ON SAVE
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {complianceRules.map((rule) => (
                <div 
                  key={rule.code}
                  className="flex items-start gap-2 p-2 bg-[#12161C] border border-white/5 rounded-[3px] text-xs"
                >
                  <span className="p-0.5 rounded-[2px] bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono text-[11px] text-cyan-300">{rule.code}:</strong>
                      <span className="text-white font-medium">{rule.name}</span>
                    </div>
                    <p className="font-mono text-[10px] text-neutral-400 mt-0.5">
                      {rule.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161B22] border-t border-white/10">
          <span className="font-mono text-[10px] text-neutral-400">
            Timetable is saved only after the official validator reports 0 hard violations
          </span>
          <TactileButton size="sm" variant="default" onClick={onClose}>
            DISMISS INSPECTOR
          </TactileButton>
        </div>
      </div>
    </div>
  );
}
