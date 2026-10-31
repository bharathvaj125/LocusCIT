"use client";

import React, { useState } from "react";
import { BookingRequest, RoleType } from "@/lib/types";
import { SPECTRA_BOOKINGS, ROOMS } from "@/lib/mockData";
import { decideBooking } from "@/lib/api";
import { TactileButton } from "@/components/tactile/TactileButton";
import { 
  CheckSquare, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight,
  ShieldAlert,
  Send
} from "lucide-react";

interface ApprovalsDeckProps {
  currentRole: RoleType;
  bookings?: BookingRequest[];
  onDecisionMade?: () => void;
}

export function ApprovalsDeck({
  currentRole,
  bookings = SPECTRA_BOOKINGS,
  onDecisionMade,
}: ApprovalsDeckProps) {
  const [items, setItems] = useState<BookingRequest[]>(bookings);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [altRoomSelection, setAltRoomSelection] = useState<Record<string, string>>({});

  const handleDecision = async (
    requestId: string,
    action: "approve" | "reject" | "offer_alternative"
  ) => {
    const altRoom = action === "offer_alternative" ? (altRoomSelection[requestId] || "AUD") : undefined;
    const res = await decideBooking(requestId, action, currentRole, undefined, altRoom);

    if (!res.success) {
      setActionFeedback(`Action Denied: ${res.errors[0]?.message || "Operation failed"}`);
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === requestId ? res.data : item))
    );
    setActionFeedback(`Decision recorded: ${requestId} marked as ${res.data.status.toUpperCase()}.`);
    setTimeout(() => setActionFeedback(null), 3000);
    if (onDecisionMade) onDecisionMade();
  };

  const pendingItems = items.filter(
    (b) => b.status === "pending" || b.status === "alternative_offered" || b.id === "BR-07" || b.id === "BR-12"
  );

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Banner */}
      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-[3px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <CheckSquare className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                APPROVALS &amp; CHANGE REQUEST QUEUE
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ANTI-SELF-APPROVAL ENFORCED
              </span>
            </div>
            <p className="text-neutral-400 mt-1">
              Active Approver Identity: <strong className="text-cyan-400 uppercase">{currentRole}</strong>. Requesters are strictly prohibited from approving their own submissions.
            </p>
          </div>

          <div className="px-2.5 py-1 bg-[#12161C] border border-white/10 rounded-[3px] text-neutral-300">
            PENDING REVIEWS: <strong className="text-amber-400">{pendingItems.length}</strong>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionFeedback && (
        <div className="p-3 bg-[#161B22] border border-cyan-500/50 rounded flex items-center justify-between text-cyan-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        </div>
      )}

      {/* Pending Items List */}
      <div className="space-y-3">
        {pendingItems.map((item) => {
          // Check Anti-Self-Approval
          const isOwnRequest = item.role === currentRole && currentRole !== "admin";
          const canApprove = currentRole === "admin" || (currentRole === "department_coordinator" && item.role !== "department_coordinator");

          return (
            <div
              key={item.id}
              className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3 hover:border-white/20 transition-colors"
            >
              {/* Item Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{item.id}: {item.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-300">
                    REQUESTER: {item.requester}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    ROLE: {item.role}
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  item.status === "approved" 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : item.status === "alternative_offered"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : item.status === "rejected"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}>
                  STATUS: {item.status.replace("_", " ")}
                </span>
              </div>

              {/* Spatial and Temporal Coordinates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-neutral-300">
                <div className="p-2 bg-[#12161C] border border-white/5 rounded">
                  <span className="text-[10px] text-neutral-500 block">TIME SLOT</span>
                  <span className="text-white font-bold">{item.day} P{item.start_period}-P{item.end_period}</span>
                </div>
                <div className="p-2 bg-[#12161C] border border-white/5 rounded">
                  <span className="text-[10px] text-neutral-500 block">ATTENDANCE</span>
                  <span className="text-white font-bold">{item.attendance} Students</span>
                </div>
                <div className="p-2 bg-[#12161C] border border-white/5 rounded">
                  <span className="text-[10px] text-neutral-500 block">REQUESTED VENUE</span>
                  <span className="text-white font-bold">{item.requested_room || "Any"}</span>
                </div>
                <div className="p-2 bg-[#12161C] border border-white/5 rounded">
                  <span className="text-[10px] text-neutral-500 block">ASSIGNED/PROPOSED</span>
                  <span className="text-emerald-400 font-bold">{item.assigned_room || item.requested_room || "None"}</span>
                </div>
              </div>

              {/* Anti-Self-Approval Protocol Guard */}
              {isOwnRequest && (
                <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded text-rose-200 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Anti-Self-Approval Lock: You are the requester ({item.role}). Approval requires Dean or Independent Coordinator authority.</span>
                </div>
              )}

              {/* Approver Action Panel */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/10 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-[11px]">Reassign Alternative:</span>
                  <select
                    value={altRoomSelection[item.id] || "AUD"}
                    onChange={(e) => setAltRoomSelection({ ...altRoomSelection, [item.id]: e.target.value })}
                    className="px-2 py-1 bg-[#161B22] border border-white/10 rounded text-xs text-white"
                  >
                    <option value="AUD">Main Auditorium (500 seats)</option>
                    <option value="SH-1">Seminar Hall 1 (150 seats)</option>
                    <option value="SH-2">Seminar Hall 2 (150 seats)</option>
                    <option value="OAT">Open Air Theatre (800 seats)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isOwnRequest || !canApprove}
                    onClick={() => handleDecision(item.id, "reject")}
                    className="px-3 py-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 rounded transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    REJECT
                  </button>

                  <button
                    disabled={isOwnRequest || !canApprove}
                    onClick={() => handleDecision(item.id, "offer_alternative")}
                    className="px-3 py-1 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 rounded transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    OFFER ALTERNATIVE
                  </button>

                  <button
                    disabled={isOwnRequest || !canApprove}
                    onClick={() => handleDecision(item.id, "approve")}
                    className="px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 rounded font-bold transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    APPROVE REQUEST
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
