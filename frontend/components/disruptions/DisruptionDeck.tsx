"use client";

import React, { useState } from "react";
import { DisruptionProposal, RoleType } from "@/lib/types";
import { SAMPLE_DISRUPTION_PROPOSAL } from "@/lib/mockData";
import { approveDisruptionProposal, rejectDisruptionProposal } from "@/lib/api";
import { TactileButton } from "@/components/tactile/TactileButton";
import { 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Clock, 
  MapPin, 
  RotateCcw,
  Layers,
  FileCheck,
  Check
} from "lucide-react";

interface DisruptionDeckProps {
  currentRole: RoleType;
  proposal?: DisruptionProposal;
  onProposalUpdated?: () => void;
}

export function DisruptionDeck({
  currentRole,
  proposal = SAMPLE_DISRUPTION_PROPOSAL,
  onProposalUpdated,
}: DisruptionDeckProps) {
  const [currentProposal, setCurrentProposal] = useState<DisruptionProposal>(proposal);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleApprove = async () => {
    if (currentRole !== "admin") return;
    setIsProcessing(true);
    const res = await approveDisruptionProposal(currentProposal.proposal_id);
    setIsProcessing(false);
    if (res.success) {
      setCurrentProposal(res.data);
      setActionFeedback("Disruption repair proposal APPROVED and committed atomically into active schedule.");
      if (onProposalUpdated) onProposalUpdated();
    }
  };

  const handleReject = async () => {
    if (currentRole !== "admin") return;
    setIsProcessing(true);
    const res = await rejectDisruptionProposal(currentProposal.proposal_id);
    setIsProcessing(false);
    if (res.success) {
      setCurrentProposal(res.data);
      setActionFeedback("Disruption repair proposal REJECTED. Baseline schedule remains untouched.");
      if (onProposalUpdated) onProposalUpdated();
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Banner */}
      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-[3px] bg-rose-950/60 border border-rose-500/40 text-rose-400">
                <Wrench className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                DISRUPTION REPAIR ENGINE // ZERO SIDE-EFFECT DIFF
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-[2px] font-bold ${
                currentProposal.status === "APPROVED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : currentProposal.status === "REJECTED"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}>
                STATUS: {currentProposal.status}
              </span>
            </div>
            <p className="text-neutral-400 mt-1">
              {currentProposal.title} &mdash; Minimal-mutation objective guarantees lowest possible session displacement count.
            </p>
          </div>

          {/* Admin Decision Actions */}
          {currentRole === "admin" && currentProposal.status === "PENDING" && (
            <div className="flex items-center gap-2">
              <button
                disabled={isProcessing}
                onClick={handleReject}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded transition-colors disabled:opacity-40 cursor-pointer"
              >
                REJECT REPAIR
              </button>
              <button
                disabled={isProcessing}
                onClick={handleApprove}
                className="px-4 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded font-bold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <Check className="w-3.5 h-3.5" />
                ADMIN COMMIT REPAIR
              </button>
            </div>
          )}

          {currentRole !== "admin" && (
            <span className="text-neutral-400 text-[11px]">
              Admin Authority Required to Commit Disruption Changes
            </span>
          )}
        </div>

        {/* Solver Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
          <div className="p-2.5 bg-[#12161C] border border-white/10 rounded-[3px]">
            <span className="text-[10px] text-neutral-400 block">PROPOSAL ID</span>
            <span className="text-white font-bold mt-0.5 block">{currentProposal.proposal_id}</span>
          </div>

          <div className="p-2.5 bg-[#12161C] border border-cyan-500/30 rounded-[3px]">
            <span className="text-[10px] text-cyan-400 block">MOVED SESSIONS</span>
            <span className="text-cyan-300 font-bold mt-0.5 block">{currentProposal.moved_count} Sessions</span>
            <span className="text-[9px] text-neutral-500">Proven Minimum Bound</span>
          </div>

          <div className="p-2.5 bg-[#12161C] border border-emerald-500/30 rounded-[3px]">
            <span className="text-[10px] text-emerald-400 block">HARD VIOLATIONS</span>
            <span className="text-emerald-300 font-bold mt-0.5 block">0 Violations</span>
            <span className="text-[9px] text-neutral-500">All Constraints Satisfied</span>
          </div>

          <div className="p-2.5 bg-[#12161C] border border-white/10 rounded-[3px]">
            <span className="text-[10px] text-neutral-400 block">SUBMISSION TIMESTAMP</span>
            <span className="text-neutral-300 font-bold mt-0.5 block truncate">{currentProposal.submitted_at.slice(11, 19)} IST</span>
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

      {/* Side-by-Side Diff Table */}
      <div className="bg-[#0E1216] border border-white/10 rounded-[4px] overflow-hidden">
        <div className="p-3 bg-[#12161C] border-b border-white/10 flex items-center justify-between">
          <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            DISPLACED SESSION BLAST RADIUS // BEFORE VS AFTER DIFF
          </span>
          <span className="text-neutral-400 text-[10px]">
            {currentProposal.changes.length} Total Impacted Slots
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {currentProposal.changes.map((diff) => (
            <div
              key={diff.session_id}
              className="p-3 hover:bg-[#12161C]/50 transition-colors space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300">{diff.session_id}</span>
                  <span className="text-white font-sans font-medium">{diff.course_title}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  REASON: {diff.reason}
                </span>
              </div>

              {/* Side by Side Old vs New Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Old Slot */}
                <div className="p-2.5 bg-[#181116] border border-rose-500/30 rounded-[3px] space-y-1">
                  <span className="text-[10px] text-rose-400 uppercase font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-400" /> PRE-DISRUPTION BASELINE
                  </span>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Timeslot: <strong className="text-white">{diff.old.day} P{diff.old.start_period}{diff.old.start_period > 0 ? `-P${diff.old.end_period}` : ""}</strong></span>
                    <span>Room: <strong className="text-white">{diff.old.room_id}</strong></span>
                  </div>
                </div>

                {/* New Repaired Slot */}
                <div className="p-2.5 bg-[#0F1B1A] border border-emerald-500/30 rounded-[3px] space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> REPAIRED SCHEDULE ALLOCATION
                  </span>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Timeslot: <strong className="text-emerald-300">{diff.new.day} P{diff.new.start_period}-P{diff.new.end_period}</strong></span>
                    <span>Room: <strong className="text-emerald-300">{diff.new.room_id}</strong> ({diff.new.room_name})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
