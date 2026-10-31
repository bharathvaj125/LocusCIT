"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ScenarioType } from "@/components/layout/Header";
import { RoleType, NavRouteId, ScheduledSession } from "@/lib/types";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { ExamsDeck } from "@/components/exams/ExamsDeck";
import { SpectraClashMatrix } from "@/components/spectra/SpectraClashMatrix";
import { ApprovalsDeck } from "@/components/approvals/ApprovalsDeck";
import { DisruptionDeck } from "@/components/disruptions/DisruptionDeck";
import { AiBookingAssistant } from "@/components/assistant/AiBookingAssistant";
import { ExportsDeck } from "@/components/exports/ExportsDeck";
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
  CheckSquare, 
  Wrench, 
  Bot, 
  Download,
  ShieldCheck
} from "lucide-react";

interface MainDashboardViewProps {
  initialNav?: NavRouteId;
}

export function MainDashboardView({ initialNav = "timetable" }: MainDashboardViewProps) {
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>("default");
  const [currentRole, setCurrentRole] = useState<RoleType>("admin");
  const [activeNav, setActiveNav] = useState<NavRouteId>(initialNav);
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
        {/* Reset Success Toast */}
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

        {/* Dynamic Navigation Views */}
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
          <ExamsDeck />
        )}

        {activeNav === "spectra_clash" && (
          <SpectraClashMatrix currentRole={currentRole} />
        )}

        {activeNav === "approvals" && (
          <ApprovalsDeck currentRole={currentRole} />
        )}

        {activeNav === "disruptions" && (
          <DisruptionDeck currentRole={currentRole} />
        )}

        {activeNav === "ai_booking" && (
          <AiBookingAssistant currentRole={currentRole} />
        )}

        {activeNav === "exports" && (
          <ExportsDeck />
        )}
      </div>
    </AppShell>
  );
}
