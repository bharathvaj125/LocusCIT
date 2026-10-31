"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RoleType, ScenarioType } from "@/components/layout/Header";
import { TactileButton } from "@/components/tactile/TactileButton";
import { TelemetryCard } from "@/components/tactile/TelemetryCard";
import { LiveStatusBadge } from "@/components/tactile/LiveStatusBadge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Sparkles, 
  AlertTriangle, 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  FileText,
  Sliders
} from "lucide-react";

export default function HomePage() {
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>("default");
  const [currentRole, setCurrentRole] = useState<RoleType>("admin");
  const [activePivot, setActivePivot] = useState<"group" | "faculty" | "room">("group");
  const [approvalActionTaken, setApprovalActionTaken] = useState<boolean>(false);

  const handleReset = () => {
    setCurrentScenario("default");
    setCurrentRole("admin");
    setActivePivot("group");
    setApprovalActionTaken(false);
  };

  return (
    <AppShell
      currentScenario={currentScenario}
      onScenarioChange={setCurrentScenario}
      currentRole={currentRole}
      onRoleChange={setCurrentRole}
      onReset={handleReset}
    >
      <div className="space-y-4">
        {/* Mission Status Banner */}
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
                  {currentScenario === "default" && "BASELINE TIMETABLE MATRIX // 189 SESSIONS"}
                  {currentScenario === "spectra_surge" && "WEEK 7 SPECTRA FESTIVAL CLASH MATRIX"}
                  {currentScenario === "disruption" && "DISRUPTION BLAST RADIUS & REPAIR DIFF"}
                  {currentScenario === "exams" && "MIDSEM EXAM SEAT MATRIX // HALVED CAPACITIES"}
                </h1>
                <LiveStatusBadge
                  status={
                    currentScenario === "disruption"
                      ? "warning"
                      : currentScenario === "spectra_surge"
                      ? "warning"
                      : "online"
                  }
                  label={
                    currentScenario === "disruption"
                      ? "REPAIR_PENDING_APPROVAL"
                      : currentScenario === "spectra_surge"
                      ? "25_REQUESTS_LOGGED"
                      : "ZERO_CLASH_VERIFIED"
                  }
                />
              </div>
              <p className="font-mono text-xs text-[#9CA3AF] mt-0.5">
                {currentScenario === "default" && "All 189 academic sessions assigned across 27 physical venues with zero hard constraint violations."}
                {currentScenario === "spectra_surge" && "High-demand venues under competing requests. Priority hierarchy active (Tier 1 Exams down to Tier 6 Clubs)."}
                {currentScenario === "disruption" && "Room LH-3 emergency closure simulated. Minimal session displacement solver triggered (6 moves)."}
                {currentScenario === "exams" && "Midsem seat allocation across 41 exams with strict ⌊capacity / 2⌋ space partitioning applied."}
              </p>
            </div>
          </div>

          {/* Pivot Toggle (For Timetable Views) */}
          <div className="flex items-center gap-1 bg-[#161B22] p-1 border border-white/10 rounded-[4px]">
            <span className="font-mono text-[10px] text-[#6B7280] px-2 uppercase font-semibold">
              PIVOT:
            </span>
            <TactileButton
              size="sm"
              variant="default"
              active={activePivot === "group"}
              onClick={() => setActivePivot("group")}
            >
              STUDENT GROUP
            </TactileButton>
            <TactileButton
              size="sm"
              variant="default"
              active={activePivot === "faculty"}
              onClick={() => setActivePivot("faculty")}
            >
              FACULTY LOAD (≤4H)
            </TactileButton>
            <TactileButton
              size="sm"
              variant="default"
              active={activePivot === "room"}
              onClick={() => setActivePivot("room")}
            >
              ROOM UTILIZATION
            </TactileButton>
          </div>
        </div>

        {/* Dynamic Scenario Presentation */}

        {/* SCENARIO 1: BASELINE SCHEDULE VIEW */}
        {currentScenario === "default" && (
          <div className="space-y-4">
            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <TelemetryCard
                label="TOTAL SESSIONS"
                value="189"
                subValue="243 TEACHING HRS"
                delta={{ text: "100% ALLOCATED", type: "positive" }}
                status="online"
              />
              <TelemetryCard
                label="FACULTY MEMBERS"
                value="40 / 40"
                subValue="MAX LOAD ≤ 4H/DAY"
                delta={{ text: "H12 SATISFIED", type: "positive" }}
                status="online"
              />
              <TelemetryCard
                label="CAMPUS VENUES"
                value="27"
                subValue="7 LABS // 20 HALLS"
                delta={{ text: "H4 NO DOUBLE-BOOK", type: "positive" }}
                status="online"
              />
              <TelemetryCard
                label="LUNCH BREAK BARRIER"
                value="13:00 - 14:00"
                subValue="BETWEEN P5 & P6"
                delta={{ text: "H9 STRICT ISOLATION", type: "positive" }}
                status="online"
              />
            </div>

            {/* Time Grid Preview */}
            <div className="bg-[#0E1216] border border-white/10 rounded-[4px] p-3 overflow-x-auto">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <span className="font-mono text-xs text-white font-semibold flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  ACADEMIC TIME MATRIX (MONDAY - FRIDAY) // 9 PERIODS + LUNCH BARRIER
                </span>
                <span className="font-mono text-[10px] text-[#9CA3AF]">
                  LAB BLOCKS RESTRICTED TO P2-P4 (09:00-12:00) OR P6-P8 (14:00-17:00)
                </span>
              </div>

              <div className="min-w-[760px] space-y-1.5 font-mono text-xs">
                {/* Header Periods */}
                <div className="grid grid-cols-11 gap-1 text-[11px] text-[#6B7280] font-semibold text-center py-1 bg-[#161B22] rounded-[2px]">
                  <div className="col-span-1 text-left pl-2">DAY</div>
                  <div>P1 (08:00)</div>
                  <div>P2 (09:00)</div>
                  <div>P3 (10:00)</div>
                  <div>P4 (11:00)</div>
                  <div>P5 (12:00)</div>
                  <div className="bg-amber-950/30 text-amber-400 border border-amber-500/30 rounded-[2px]">
                    LUNCH (13-14)
                  </div>
                  <div>P6 (14:00)</div>
                  <div>P7 (15:00)</div>
                  <div>P8 (16:00)</div>
                  <div>P9 (17:00)</div>
                </div>

                {/* Days */}
                {[
                  { day: "MON", morning: "CS201 (LH-1)", lab: "CS-LAB-1 (P6-P8)", p9: "FREE" },
                  { day: "TUE", morning: "MA101 (LH-2)", lab: "FREE", p9: "CS204 (LH-4)" },
                  { day: "WED", morning: "OEB-1 BASKET (CONCURRENT)", lab: "EC-LAB-2 (P6-P8)", p9: "FREE" },
                  { day: "THU", morning: "EE301 (LH-3)", lab: "FREE", p9: "FREE" },
                  { day: "FRI", morning: "ME202 (LH-5)", lab: "PH-LAB-1 (P2-P4)", p9: "FREE" },
                ].map((row, idx) => (
                  <div
                    key={row.day}
                    className="grid grid-cols-11 gap-1 text-center py-2 bg-[#080A0C] border border-white/5 rounded-[2px] items-center"
                  >
                    <div className="col-span-1 text-left pl-2 font-bold text-cyan-300">
                      {row.day}
                    </div>
                    <div className="p-1 bg-[#161B22] border border-white/10 rounded text-[10px] text-white">
                      {row.morning}
                    </div>
                    <div className="p-1 bg-[#161B22] border border-white/10 rounded text-[10px] text-white">
                      HS102 (LH-2)
                    </div>
                    <div className="p-1 bg-[#161B22] border border-white/10 rounded text-[10px] text-white">
                      CS203 (LH-1)
                    </div>
                    <div className="p-1 bg-[#161B22] border border-white/10 rounded text-[10px] text-white">
                      MA202 (LH-3)
                    </div>
                    <div className="p-1 bg-[#161B22] border border-white/10 rounded text-[10px] text-white">
                      TUT-1 (CR-1)
                    </div>
                    <div className="p-1 bg-amber-950/20 text-amber-400/80 text-[10px] font-semibold">
                      BREAK
                    </div>
                    <div className="col-span-3 p-1 bg-cyan-950/30 border border-cyan-500/30 rounded text-[10px] text-cyan-200">
                      {row.lab}
                    </div>
                    <div className="p-1 bg-[#161B22] border border-white/10 rounded text-[10px] text-neutral-400">
                      {row.p9}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCENARIO 2: WEEK 7 SPECTRA FESTIVAL CLASH MATRIX */}
        {currentScenario === "spectra_surge" && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-[4px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-mono text-xs text-amber-200">
                  <strong>WEEK 7 SPECTRA SURGE DETECTED:</strong> 25 venue requests received. Auditorium, Seminar Halls, and Labs at 100% capacity. Clashes arbitrated by Section 4 Priority Rules.
                </span>
              </div>
              <TactileButton size="sm" variant="amber">
                EVALUATE ALL IN BATCH
              </TactileButton>
            </div>

            <div className="bg-[#0E1216] border border-white/10 rounded-[4px] p-3 space-y-3">
              <span className="font-mono text-xs text-white font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                TIME-SPACE CONFLICT MATRIX (HIGH DEMAND VENUES)
              </span>

              <div className="space-y-2 font-mono text-xs">
                {/* Clash 1 */}
                <div className="p-3 bg-[#080A0C] border border-rose-500/40 rounded-[4px] flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                        CLASH #01 // AUDITORIUM
                      </span>
                      <span className="text-white font-bold">FRIDAY 18:00 - 21:00 (P10 - P12)</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                      <span>REQ A: <strong className="text-purple-300">DRAMA CLUB REHEARSAL</strong> (Tier 6 - Club)</span>
                      <span className="text-white/20">vs</span>
                      <span>REQ B: <strong className="text-amber-300">ANNUAL TECH CONVOCATION</strong> (Tier 3 - Institute)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 rounded">
                      SOLVER DECISION: TIER 3 APPROVED // ALT SUGGESTED FOR TIER 6 (OAT)
                    </span>
                    <TactileButton size="sm" variant="primary">
                      CONFIRM ARBITRATION
                    </TactileButton>
                  </div>
                </div>

                {/* Clash 2 */}
                <div className="p-3 bg-[#080A0C] border border-amber-500/30 rounded-[4px] flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                        CLASH #02 // COMPUTER LAB 1
                      </span>
                      <span className="text-white font-bold">THURSDAY 14:00 - 17:00 (P6 - P8)</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                      <span>REQ A: <strong className="text-white">CS201 LAB SESSION</strong> (Tier 2 - Regular Class)</span>
                      <span className="text-white/20">vs</span>
                      <span>REQ B: <strong className="text-cyan-300">HACKATHON CODING ROUND</strong> (Tier 5 - Dept Event)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 rounded">
                      SOLVER DECISION: TIER 2 ACADEMIC IMMUNITY MAINTAINED
                    </span>
                    <TactileButton size="sm" variant="default">
                      VIEW ALTERNATIVE LAB
                    </TactileButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENARIO 3: DISRUPTION & BLAST RADIUS DIFF */}
        {currentScenario === "disruption" && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-[4px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-mono text-xs text-rose-200">
                  <strong>DISRUPTION ACTIVE:</strong> Room LH-3 maintenance shut down. Minimal-displacement solver proposed 6 schedule migrations with 0 hard violations.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {currentRole === "admin" ? (
                  <TactileButton
                    size="sm"
                    variant="primary"
                    disabled={approvalActionTaken}
                    onClick={() => setApprovalActionTaken(true)}
                  >
                    {approvalActionTaken ? "REPAIR COMMITTED (REV #4029.DIS)" : "ADMIN: APPROVE & COMMIT REPAIR"}
                  </TactileButton>
                ) : (
                  <span className="text-[10px] font-mono text-[#6B7280] bg-white/5 px-2 py-1 rounded border border-white/10">
                    ADMIN ROLE REQUIRED FOR APPROVAL
                  </span>
                )}
              </div>
            </div>

            {/* Blast Radius Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <TelemetryCard
                label="BLAST RADIUS (MOVED)"
                value="6 SESSIONS"
                subValue="3.1% OF 189 TOTAL"
                delta={{ text: "MINIMAL DISPLACEMENT", type: "positive" }}
                status="online"
              />
              <TelemetryCard
                label="HARD VIOLATIONS (H1-H14)"
                value="0"
                subValue="STRICT PASS"
                delta={{ text: "VALIDATOR CLEAN", type: "positive" }}
                status="online"
              />
              <TelemetryCard
                label="APPROVAL GATE"
                value={approvalActionTaken ? "COMMITTED" : "PENDING ADMIN"}
                subValue="NO SELF-APPROVAL"
                delta={{
                  text: approvalActionTaken ? "REVISION APPLIED" : "STRICT GATE",
                  type: approvalActionTaken ? "positive" : "warning",
                }}
                status={approvalActionTaken ? "online" : "warning"}
              />
            </div>

            {/* Side-by-Side Diff View */}
            <div className="bg-[#0E1216] border border-white/10 rounded-[4px] p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-mono text-xs text-white font-semibold">
                  SIDE-BY-SIDE RESCHEDULING DIFF (PRE-DISRUPTION VS REPAIRED)
                </span>
                <span className="font-mono text-[10px] text-cyan-400">
                  6 MOVED // 183 UNCHANGED
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {[
                  {
                    code: "CS301-L1",
                    name: "Operating Systems",
                    old: "TUE P2 (09:00) in LH-3",
                    new: "TUE P2 (09:00) in LH-5",
                    reason: "Room LH-3 closed for maintenance",
                  },
                  {
                    code: "EE202-L2",
                    name: "Network Analysis",
                    old: "WED P4 (11:00) in LH-3",
                    new: "THU P4 (11:00) in LH-2",
                    reason: "Displaced by CS301 migration",
                  },
                  {
                    code: "MA201-T1",
                    name: "Discrete Maths Tutorial",
                    old: "THU P1 (08:00) in LH-3",
                    new: "FRI P1 (08:00) in CR-3",
                    reason: "Room capacity matched to CR-3",
                  },
                ].map((diff) => (
                  <div
                    key={diff.code}
                    className="p-2.5 bg-[#080A0C] border border-white/10 rounded-[3px] flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{diff.code}</span>
                        <span className="text-[#9CA3AF] text-[11px]">{diff.name}</span>
                      </div>
                      <span className="text-[10px] text-[#6B7280]">{diff.reason}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="p-1 bg-rose-950/30 text-rose-300 border border-rose-500/30 rounded">
                        {diff.old}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="p-1 bg-emerald-950/30 text-emerald-300 border border-emerald-500/30 rounded">
                        {diff.new}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCENARIO 4: MIDSEM EXAM MATRIX */}
        {currentScenario === "exams" && (
          <div className="space-y-4">
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-[4px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-mono text-xs text-cyan-200">
                  <strong>MIDSEM EXAM ALLOCATION:</strong> 41 exams scheduled across Week 8. Effective venue capacity is halved (⌊capacity / 2⌋) for anti-cheating spacing.
                </span>
              </div>
              <TactileButton size="sm" variant="blue">
                EXPORT EXAM ROSTER
              </TactileButton>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <TelemetryCard
                label="TOTAL EXAMS"
                value="41"
                subValue="WEEK 8 ROSTER"
                delta={{ text: "100% ASSIGNED", type: "positive" }}
                status="online"
              />
              <TelemetryCard
                label="EFFECTIVE CAPACITY"
                value="⌊CAP / 2⌋"
                subValue="RULE H5 HALVED"
                delta={{ text: "ZERO OVERCROWDING", type: "positive" }}
                status="online"
              />
              <TelemetryCard
                label="STUDENT CLASHES"
                value="0"
                subValue="CONSECUTIVE EXAM CHECK"
                delta={{ text: "STRICT ISOLATION", type: "positive" }}
                status="online"
              />
              <TelemetryCard
                label="REQUIRED ROOMS"
                value="22 / 27"
                subValue="EXAM HALLS"
                delta={{ text: "OPTIMIZED SPREAD", type: "positive" }}
                status="online"
              />
            </div>

            {/* Exam Hall Seating Breakdown */}
            <div className="bg-[#0E1216] border border-white/10 rounded-[4px] p-3 space-y-3">
              <span className="font-mono text-xs text-white font-semibold">
                VENUE CAPACITY PARTITIONING UNDER RULE H5
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs">
                {[
                  { room: "AUDITORIUM", rawCap: 300, examCap: 150, allocated: 140, exam: "CS101 Midsem" },
                  { room: "SEMINAR HALL 1", rawCap: 120, examCap: 60, allocated: 58, exam: "EC201 Midsem" },
                  { room: "LECTURE HALL 1", rawCap: 80, examCap: 40, allocated: 40, exam: "MA201 Midsem" },
                ].map((hall) => (
                  <div key={hall.room} className="p-2.5 bg-[#080A0C] border border-white/10 rounded-[3px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{hall.room}</span>
                      <span className="text-[10px] text-cyan-300 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-500/30">
                        {hall.allocated}/{hall.examCap} SEATS
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9CA3AF]">
                      <span>Raw Cap: {hall.rawCap} &rarr; </span>
                      <strong className="text-emerald-400">Halved: {hall.examCap}</strong>
                    </div>
                    <div className="text-[11px] text-neutral-300 font-semibold truncate">
                      {hall.exam}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
