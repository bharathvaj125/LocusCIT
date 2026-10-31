"use client";

import React, { useState } from "react";
import { TactileButton } from "@/components/tactile/TactileButton";
import { LiveStatusBadge } from "@/components/tactile/LiveStatusBadge";
import { TelemetryCard } from "@/components/tactile/TelemetryCard";
import { 
  Activity, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  Building2,
  CalendarCheck
} from "lucide-react";
import { RoleType, ScenarioType } from "./Header";

interface InspectorDeckProps {
  currentScenario: ScenarioType;
  currentRole: RoleType;
}

export function InspectorDeck({
  currentScenario,
  currentRole,
}: InspectorDeckProps) {
  const [nlPrompt, setNlPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedDraft, setParsedDraft] = useState<{
    venue: string;
    day: string;
    time: string;
    event: string;
    priority: number;
    status: string;
  } | null>(null);

  const handleQuickParse = () => {
    if (!nlPrompt.trim()) return;
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      setParsedDraft({
        venue: "AUDITORIUM",
        day: "FRI",
        time: "18:00 - 21:00 (P10-P12)",
        event: "Spectra Music Club Rehearsal",
        priority: currentRole === "club" ? 6 : currentRole === "faculty" ? 4 : 3,
        status: "DRAFT_READY // PENDING_VALIDATION",
      });
    }, 600);
  };

  return (
    <aside className="w-full lg:w-[380px] xl:w-[420px] bg-[#0E1216] border-l border-white/10 flex flex-col h-full overflow-hidden select-none">
      {/* Inspector Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#080A0C]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            MISSION INSPECTOR
          </span>
        </div>
        <LiveStatusBadge status="neutral" label="REACTIVE // READY" />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 gap-2">
          <TelemetryCard
            label="WEEK 7 REQUESTS"
            value={currentScenario === "spectra_surge" ? "25" : "12"}
            subValue="SPECTRA"
            delta={{
              text: currentScenario === "spectra_surge" ? "PEAK SURGE" : "NOMINAL",
              type: currentScenario === "spectra_surge" ? "warning" : "positive",
            }}
            status={currentScenario === "spectra_surge" ? "warning" : "online"}
          />
          <TelemetryCard
            label="ROOM UTILIZATION"
            value={currentScenario === "disruption" ? "92.4%" : "78.2%"}
            subValue="CIT 27 RMS"
            delta={{
              text: currentScenario === "disruption" ? "CRITICAL" : "OPTIMAL",
              type: currentScenario === "disruption" ? "warning" : "neutral",
            }}
            status={currentScenario === "disruption" ? "warning" : "neutral"}
          />
        </div>

        {/* Natural Language / Hinglish Parser Sandbox */}
        <div className="bg-[#161B22] border border-white/10 rounded-[4px] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              NL / HINGLISH VENUE PARSER
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              UNTRUSTED // EDITS MANDATORY
            </span>
          </div>

          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Accepts freeform text in English or Hinglish. LLM strictly extracts parameters into an editable draft—never authorizes validity.
          </p>

          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                placeholder='e.g. "Auditorium chahiye Friday ko after 6pm for drama practice"'
                className="w-full bg-[#080A0C] border border-white/10 rounded-[4px] p-2.5 text-xs text-white placeholder-[#6B7280] font-sans resize-none focus:outline-none focus:border-cyan-500/80 transition-colors"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setNlPrompt("Need Seminar Hall 1 on Thursday P10 for AI guest lecture with projector")}
                className="text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300 underline text-left truncate"
              >
                Insert sample Hinglish/NL prompt
              </button>

              <TactileButton
                size="sm"
                variant="amber"
                onClick={handleQuickParse}
                disabled={isParsing || !nlPrompt.trim()}
                icon={<Send className="w-3 h-3" />}
              >
                {isParsing ? "PARSING..." : "PARSE DRAFT"}
              </TactileButton>
            </div>
          </div>

          {/* Parsed Draft Display */}
          {parsedDraft && (
            <div className="bg-[#080A0C] border border-amber-500/40 rounded-[4px] p-2.5 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="font-mono text-[10px] text-amber-400 font-semibold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> DRAFT EXTRACTED (REVIEW REQUIRED)
                </span>
                <span className="font-mono text-[10px] text-neutral-400">
                  PRIORITY: TIER {parsedDraft.priority}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[#6B7280] block text-[10px]">VENUE:</span>
                  <span className="text-white font-medium">{parsedDraft.venue}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">TIMING:</span>
                  <span className="text-white font-medium">{parsedDraft.time}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#6B7280] block text-[10px]">EVENT TITLE:</span>
                  <span className="text-cyan-300 font-medium">{parsedDraft.event}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/5">
                <TactileButton size="sm" variant="ghost" onClick={() => setParsedDraft(null)}>
                  DISCARD
                </TactileButton>
                <TactileButton size="sm" variant="primary">
                  OPEN IN FULL FORM & VALIDATE
                </TactileButton>
              </div>
            </div>
          )}
        </div>

        {/* Live System Log Stream */}
        <div className="bg-[#161B22] border border-white/10 rounded-[4px] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase text-[#9CA3AF] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              SOLVER & ARBITRATION AUDIT LOG
            </span>
            <span className="font-mono text-[10px] text-[#6B7280]">STREAM ACTIVE</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="p-1.5 bg-[#080A0C] border-l-2 border-emerald-500 text-neutral-300 rounded-r-[2px]">
              <span className="text-[#6B7280]">[14:32:01]</span> <span className="text-emerald-400">H1-H14 PASS:</span> 189 sessions allocated with 0 clash.
            </div>
            {currentScenario === "spectra_surge" && (
              <div className="p-1.5 bg-[#080A0C] border-l-2 border-amber-500 text-amber-200 rounded-r-[2px]">
                <span className="text-[#6B7280]">[14:32:15]</span> <span className="text-amber-400">CONFLICT DETECTED:</span> Auditorium requested by Robotics Club (Tier 6) overlaps with Annual Convocation (Tier 3). Escalating to Tier 3.
              </div>
            )}
            {currentScenario === "disruption" && (
              <div className="p-1.5 bg-[#080A0C] border-l-2 border-rose-500 text-rose-200 rounded-r-[2px]">
                <span className="text-[#6B7280]">[14:32:28]</span> <span className="text-rose-400">DISRUPTION DETECTED:</span> Room LH-3 maintenance triggered. Solver moved 6 sessions with 0 hard violations.
              </div>
            )}
            {currentScenario === "exams" && (
              <div className="p-1.5 bg-[#080A0C] border-l-2 border-cyan-500 text-cyan-200 rounded-r-[2px]">
                <span className="text-[#6B7280]">[14:32:40]</span> <span className="text-cyan-400">EXAM HALVING RULE:</span> 41 midsem exams scheduled with ⌊capacity / 2⌋ rule satisfied.
              </div>
            )}
          </div>
        </div>

        {/* Priority Hierarchy Reference */}
        <div className="bg-[#080A0C] border border-white/5 rounded-[4px] p-2.5 text-xs">
          <span className="font-mono text-[10px] text-[#9CA3AF] uppercase font-bold block mb-1">
            Section 4 Priority Arbitration Standard:
          </span>
          <ol className="font-mono text-[10px] text-[#6B7280] space-y-0.5 list-decimal list-inside">
            <li><strong className="text-white">Exams</strong> (Highest authority)</li>
            <li><strong className="text-white">Regular Classes</strong> (Academic timetable)</li>
            <li><strong className="text-white">Institute Events</strong> (Spectra main, convocation)</li>
            <li><strong className="text-white">Guest Lectures</strong> (Approved speakers)</li>
            <li><strong className="text-white">Department Events</strong></li>
            <li><strong className="text-white">Club Events</strong> (Student societies)</li>
          </ol>
        </div>
      </div>
    </aside>
  );
}
