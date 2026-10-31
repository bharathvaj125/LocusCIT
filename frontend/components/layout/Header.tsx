"use client";

import React, { useState, useEffect } from "react";
import { TactileButton } from "@/components/tactile/TactileButton";
import { LiveStatusBadge } from "@/components/tactile/LiveStatusBadge";
import { 
  Zap, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  Layers
} from "lucide-react";

export type RoleType = "admin" | "department_coordinator" | "faculty" | "club";
export type ScenarioType = "default" | "spectra_surge" | "disruption" | "exams";

interface HeaderProps {
  currentScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
  currentRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  onReset: () => void;
}

export function Header({
  currentScenario,
  onScenarioChange,
  currentRole,
  onRoleChange,
  onReset,
}: HeaderProps) {
  const [timeString, setTimeString] = useState<string>("00:00:00 UTC");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        `${now.toISOString().slice(11, 19)} UTC // ${now.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" })} IST`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const roles: { id: RoleType; label: string; icon: React.ReactNode }[] = [
    { id: "admin", label: "ADMIN (DEAN)", icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: "department_coordinator", label: "COORD (DEPT)", icon: <Layers className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: "faculty", label: "FACULTY", icon: <UserCheck className="w-3.5 h-3.5 text-amber-400" /> },
    { id: "club", label: "CLUB REP", icon: <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080A0C]/95 backdrop-blur-md border-b border-white/10 select-none">
      {/* Top Telemetry & Scenario Command Strip */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 gap-2 border-b border-white/5">
        
        {/* Left Branding & Live Radar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-[#0E1216] border border-white/10 rounded-[3px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-xs font-bold tracking-wider text-white">
              LOCUS<span className="text-emerald-400">::</span>CIT
            </span>
            <span className="font-mono text-[10px] px-1 py-0.2 rounded-[2px] bg-white/5 text-neutral-400 border border-white/5">
              SYS_V1.0
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-[#9CA3AF]">
            <span className="text-[#6B7280]">|</span>
            <span>NODE: <strong className="text-white">CIT-ODISHA-01</strong></span>
            <span className="text-[#6B7280]">|</span>
            <span>DATASET: <strong className="text-cyan-400">1,000 STU // 27 RMS</strong></span>
            <span className="text-[#6B7280]">|</span>
            <span className="tabular-nums text-[#9CA3AF]">{timeString}</span>
          </div>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-2">
          <LiveStatusBadge status="online" label="SOLVER_ACTIVE // CP-SAT" />
        </div>
      </div>

      {/* Primary Judge Quick-Action & Scenario Switcher */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[#0E1216] gap-2">
        {/* Scenario Presets for Judges (Zero-Hunting UX) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-amber-400/90 mr-1 flex items-center gap-1 shrink-0">
            <Zap className="w-3 h-3 text-amber-400" /> JUDGE PRESETS:
          </span>

          <TactileButton
            size="sm"
            variant="default"
            active={currentScenario === "default"}
            onClick={() => onScenarioChange("default")}
            hotkey="1"
          >
            BASELINE (WK 1-6)
          </TactileButton>

          <TactileButton
            size="sm"
            variant="amber"
            active={currentScenario === "spectra_surge"}
            onClick={() => onScenarioChange("spectra_surge")}
            icon={<Sparkles className="w-3 h-3" />}
            hotkey="2"
          >
            WEEK 7 SPECTRA SURGE (25 REQS)
          </TactileButton>

          <TactileButton
            size="sm"
            variant="danger"
            active={currentScenario === "disruption"}
            onClick={() => onScenarioChange("disruption")}
            icon={<AlertTriangle className="w-3 h-3" />}
            hotkey="3"
          >
            DISRUPTION (BLAST RADIUS)
          </TactileButton>

          <TactileButton
            size="sm"
            variant="blue"
            active={currentScenario === "exams"}
            onClick={() => onScenarioChange("exams")}
            icon={<GraduationCap className="w-3 h-3" />}
            hotkey="4"
          >
            MIDSEM EXAMS (HALVED CAP)
          </TactileButton>

          <div className="h-4 w-[1px] bg-white/10 mx-1 shrink-0" />

          <TactileButton
            size="sm"
            variant="ghost"
            onClick={onReset}
            icon={<RotateCcw className="w-3 h-3" />}
            hotkey="ESC"
          >
            RESET STATE
          </TactileButton>
        </div>

        {/* 1-Click Role Switcher */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-mono text-[10px] uppercase text-[#6B7280] mr-1 hidden sm:inline">
            ROLE:
          </span>
          {roles.map((r) => (
            <TactileButton
              key={r.id}
              size="sm"
              variant="default"
              active={currentRole === r.id}
              onClick={() => onRoleChange(r.id)}
              icon={r.icon}
            >
              {r.label}
            </TactileButton>
          ))}
        </div>
      </div>
    </header>
  );
}
