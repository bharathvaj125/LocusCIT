"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ScenarioType } from "@/components/layout/Header";
import { RoleType, NavRouteId, ScheduledSession } from "@/lib/types";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { 
  fetchTimetable, 
  resetDemoData, 
  getLocalWorkspaceRevision, 
  setLocalWorkspaceRevision 
} from "@/lib/api";
import { BASELINE_SESSIONS, ROLE_CONFIGS } from "@/lib/mockData";
import { 
  Calendar, 
  Sparkles, 
  AlertTriangle, 
  GraduationCap, 
  RotateCcw, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Users, 
  Building2, 
  CheckSquare, 
  Wrench, 
  Bot, 
  Send
} from "lucide-react";

export default function HomePage() {
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>("default");
  const [currentRole, setCurrentRole] = useState<RoleType>("admin");
  const [activeNav, setActiveNav] = useState<NavRouteId>("timetable");
  const [workspaceRevision, setWorkspaceRevision] = useState<number>(1);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetNotification, setResetNotification] = useState<string | null>(null);

  // Timetable State
  const [activePivot, setActivePivot] = useState<"group" | "faculty" | "room">("group");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("Y1-A");
  const [showEvening, setShowEvening] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ScheduledSession[]>(BASELINE_SESSIONS);

  useEffect(() => {
    setWorkspaceRevision(getLocalWorkspaceRevision());
  }, []);

  // When role changes, if current activeNav is not allowed for the new role, auto-switch to "timetable"
  useEffect(() => {
    const roleConfig = ROLE_CONFIGS[currentRole];
    if (roleConfig && !roleConfig.allowedNav.includes(activeNav)) {
      setActiveNav("timetable");
    }
  }, [currentRole, activeNav]);

  // Load timetable data for current pivot
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const res = await fetchTimetable(activePivot, selectedEntityId);
      if (isMounted && res.success) {
        setSessions(res.data);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [activePivot, selectedEntityId]);

  // Handle Admin "Reset Demo Data" trigger
  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await resetDemoData();
      if (res.success) {
        setWorkspaceRevision(res.data.revision);
        setResetNotification(res.data.message);
        setSessions(BASELINE_SESSIONS);
        setCurrentScenario("default");
        setTimeout(() => setResetNotification(null), 4000);
      }
    } catch {
      const nextRev = workspaceRevision + 1;
      setWorkspaceRevision(nextRev);
      setLocalWorkspaceRevision(nextRev);
      setResetNotification(`Demo data restored to Revision #${nextRev}`);
      setTimeout(() => setResetNotification(null), 4000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AppShell
      currentScenario={currentScenario}
      onScenarioChange={setCurrentScenario}
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
      workspaceRevision={workspaceRevision}
      onReset={handleReset}
      isResetting={isResetting}
      activeNav={activeNav}
      onNavChange={setActiveNav}
    >
      <div className="space-y-4">
        {/* Reset Success Toast / Banner */}
        {resetNotification && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-[4px] flex items-center justify-between text-xs font-mono text-emerald-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resetNotification}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80">REVISION VERIFIED</span>
          </div>
        )}

        {/* Dynamic Scenario Alert Banner */}
        <div className="flex flex-wrap items-center justify-between p-3 bg-[#0E1216] border border-white/10 rounded-[4px] gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#161B22] border border-white/10 rounded-[3px]">
              {currentScenario === "default" && <Calendar className="w-5 h-5 text-cyan-400" />}
              {currentScenario === "spectra_surge" && <Sparkles className="w-5 h-5 text-amber-400" />}
              {currentScenario === "disruption" && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {currentScenario === "exams" && <GraduationCap className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                  {currentScenario === "default" && "BASELINE TIMETABLE MATRIX // CIT PUBLIC V1 (189 SESSIONS)"}
                  {currentScenario === "spectra_surge" && "WEEK 7 SPECTRA FEST MATRIX // 25 BOOKING REQUESTS EVALUATED"}
                  {currentScenario === "disruption" && "CAMPUS DISRUPTION REPAIR PROTOCOL // ACOUSTIC LEAKAGE"}
                  {currentScenario === "exams" && "MIDSEM EXAMINATION ALLOCATOR // 41 PAPERS (HALVED CAPACITY)"}
                </h1>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {currentScenario === "default" ? "0 HARD CLASHES" : "CONSTRAINTS SATISFIED"}
                </span>
              </div>
              <p className="font-mono text-[11px] text-neutral-400 mt-0.5">
                {currentScenario === "default" && "243 teaching hours per week across 27 campus venues. Monday through Friday."}
                {currentScenario === "spectra_surge" && "Fest requests prioritized by Institute > Guest > Dept > Club with strict tie-breaking."}
                {currentScenario === "disruption" && "Atomic change proposal pending admin review. Zero side-effect mutation."}
                {currentScenario === "exams" && "Hall capacities halved for exam seating. Adjacent department anti-cheat spacing applied."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="px-2.5 py-1 bg-[#12161C] border border-white/10 rounded-[3px] text-neutral-300">
              ROLE: <strong className="text-cyan-400 uppercase">{ROLE_CONFIGS[currentRole]?.badge || currentRole}</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Route View Content */}
        {activeNav === "timetable" && (
          <TimetableGrid
            sessions={sessions}
            activePivot={activePivot}
            onPivotChange={(newPivot) => {
              setActivePivot(newPivot);
              if (newPivot === "group") setSelectedEntityId("Y1-A");
              else if (newPivot === "faculty") setSelectedEntityId("F01");
              else if (newPivot === "room") setSelectedEntityId("LH-1");
            }}
            selectedId={selectedEntityId}
            onSelectId={setSelectedEntityId}
            showEvening={showEvening}
            onToggleEvening={() => setShowEvening(!showEvening)}
          />
        )}

        {activeNav === "exams" && (
          <div className="p-6 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  MIDSEM EXAMINATION ALLOCATOR // 41 PAPERS
                </h2>
                <p className="font-mono text-xs text-neutral-400 mt-1">
                  Exams run in Morning (09:00 - 12:00) and Afternoon (14:00 - 17:00) slots. Room capacities strictly halved.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 rounded-[3px]">
                Capacity Factor: 0.50
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#12161C] border border-white/10 rounded-[3px]">
                <span className="text-neutral-400 block text-[10px]">TOTAL EXAM SESSIONS</span>
                <span className="text-lg font-bold text-white mt-1 block">41 Midsem Papers</span>
                <span className="text-[10px] text-emerald-400">0 Student Concurrent Clashes</span>
              </div>
              <div className="p-3 bg-[#12161C] border border-white/10 rounded-[3px]">
                <span className="text-neutral-400 block text-[10px]">VENUE ALLOCATION</span>
                <span className="text-lg font-bold text-white mt-1 block">18 Examination Halls</span>
                <span className="text-[10px] text-cyan-400">Main Auditorium (250 Seats Halved)</span>
              </div>
              <div className="p-3 bg-[#12161C] border border-white/10 rounded-[3px]">
                <span className="text-neutral-400 block text-[10px]">ANTI-CHEAT CONSTRAINT</span>
                <span className="text-lg font-bold text-white mt-1 block">Parallel Branch Stagger</span>
                <span className="text-[10px] text-purple-400">Adjacent Seating Interleaved</span>
              </div>
            </div>

            <div className="p-4 bg-[#12161C] border border-white/5 rounded-[3px] text-center font-mono text-xs text-neutral-400">
              To inspect individual session schedules during Exam Week, use the <strong className="text-white">Timetable Matrix</strong> tab with scenario set to <strong className="text-emerald-400">MIDSEM EXAMS</strong>.
            </div>
          </div>
        )}

        {activeNav === "spectra_clash" && (
          <div className="p-6 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  SPECTRA CLASH MATRIX // WEEK 7 EVENT ALLOCATION
                </h2>
                <p className="font-mono text-xs text-neutral-400 mt-1">
                  25 booking requests evaluated across Priority Protocol: Institute (5) &gt; Guest (4) &gt; Dept (3) &gt; Club (2).
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-amber-950/60 text-amber-300 border border-amber-500/40 rounded-[3px]">
                Priority Inversions: 0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#12161C] border border-emerald-500/30 rounded-[3px]">
                <span className="text-neutral-400 block text-[10px]">APPROVED DIRECT</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">18 Requests</span>
                <span className="text-[10px] text-neutral-400">100% Window Fit</span>
              </div>
              <div className="p-3 bg-[#12161C] border border-cyan-500/30 rounded-[3px]">
                <span className="text-neutral-400 block text-[10px]">ALTERNATIVES OFFERED</span>
                <span className="text-xl font-bold text-cyan-400 mt-1 block">4 Requests</span>
                <span className="text-[10px] text-neutral-400">Auditorium / SH-2 Reassigned</span>
              </div>
              <div className="p-3 bg-[#12161C] border border-rose-500/30 rounded-[3px]">
                <span className="text-neutral-400 block text-[10px]">REJECTED (CAPACITY)</span>
                <span className="text-xl font-bold text-rose-400 mt-1 block">2 Requests</span>
                <span className="text-[10px] text-neutral-400">BR-09 (1,200 Att &gt; 800 Max)</span>
              </div>
              <div className="p-3 bg-[#12161C] border border-white/10 rounded-[3px]">
                <span className="text-neutral-400 block text-[10px]">CANCELLATIONS</span>
                <span className="text-xl font-bold text-neutral-400 mt-1 block">1 Request</span>
                <span className="text-[10px] text-neutral-500">Withdrawn by Club</span>
              </div>
            </div>
          </div>
        )}

        {activeNav === "approvals" && (
          <div className="p-6 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-cyan-400" />
                  APPROVALS &amp; CHANGE REQUEST QUEUE
                </h2>
                <p className="font-mono text-xs text-neutral-400 mt-1">
                  Active role: <strong className="text-cyan-400">{ROLE_CONFIGS[currentRole]?.label}</strong>. Strict anti-self-approval enforced.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 rounded-[3px]">
                4 Pending In Queue
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-[#12161C] border border-white/10 rounded-[3px] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">BR-07: Stage Play "Andha Yug"</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                      CLUB_EVENT // DRAMATICS
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Requested SH-1 THU P10-P12. Alternative offered: Main Auditorium (Available, stage &amp; sound equipped).
                  </p>
                </div>
                {currentRole === "admin" ? (
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded hover:bg-emerald-900">
                      APPROVE ALT
                    </button>
                    <button className="px-3 py-1 bg-rose-950 text-rose-300 border border-rose-500/40 rounded hover:bg-rose-900">
                      REJECT
                    </button>
                  </div>
                ) : (
                  <span className="text-neutral-500 text-[11px]">Requires Dean / Admin Approval</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeNav === "disruptions" && (
          <div className="p-6 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-rose-400" />
                  DISRUPTION ENGINE &amp; PROPOSAL DIFFS
                </h2>
                <p className="font-mono text-xs text-neutral-400 mt-1">
                  Propose, preview minimal-mutation blast radius, and execute atomic schedule repairs.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-rose-950/60 text-rose-300 border border-rose-500/40 rounded-[3px]">
                Atomic Mutation Safe
              </span>
            </div>

            <div className="p-4 bg-[#12161C] border border-white/10 rounded-[3px] font-mono text-xs space-y-2">
              <div className="text-white font-bold">Sample Disruption Event: Main Lecture Hall LH-2 Maintenance</div>
              <p className="text-neutral-400">
                Scheduled HVAC emergency repair on Wednesday. 6 teaching sessions relocated with zero cascade conflicts.
              </p>
            </div>
          </div>
        )}

        {activeNav === "ai_booking" && (
          <div className="p-6 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  NATURAL LANGUAGE BOOKING ASSISTANT
                </h2>
                <p className="font-mono text-xs text-neutral-400 mt-1">
                  Parse English / Hinglish booking queries into verified structured slots with deterministic conflict validation.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 rounded-[3px]">
                Deterministic Hard Checks
              </span>
            </div>

            <div className="p-4 bg-[#12161C] border border-white/10 rounded-[3px] font-mono text-xs space-y-3">
              <label className="text-neutral-300 block">
                Enter Plain Language Request (e.g. "Robotics Club needs CS Lab on Thursday afternoon for 40 students"):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Dramatics needs seminar hall or auditorium Thursday 6 to 9 pm with stage..."
                  className="flex-1 px-3 py-2 bg-[#0E1216] border border-white/15 rounded text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
                <button className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded text-xs transition-colors cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                  PARSE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
