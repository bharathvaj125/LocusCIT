"use client";

import React, { useState, useEffect } from "react";
import { RoleType, NavRouteId } from "@/lib/types";
export type { RoleType };
import { ROLE_CONFIGS, NAV_ROUTES } from "@/lib/mockData";
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
  Layers, 
  Calendar, 
  Swords, 
  CheckSquare, 
  Wrench, 
  Bot,
  Radio,
  Download
} from "lucide-react";

export type ScenarioType = "default" | "spectra_surge" | "disruption" | "exams";

interface HeaderProps {
  currentScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
  currentRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  workspaceRevision: number;
  onReset: () => Promise<void> | void;
  isResetting?: boolean;
  activeNav: NavRouteId;
  onNavChange: (nav: NavRouteId) => void;
}

export function Header({
  currentScenario,
  onScenarioChange,
  currentRole,
  onRoleChange,
  workspaceRevision,
  onReset,
  isResetting = false,
  activeNav,
  onNavChange,
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

  // 4 Roles with exact labels required by spec
  const roleButtons: { id: RoleType; label: string; icon: React.ReactNode }[] = [
    { 
      id: "admin", 
      label: "Admin (Dean's Office)", 
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 
    },
    { 
      id: "department_coordinator", 
      label: "Department Coordinator (CSE)", 
      icon: <Layers className="w-3.5 h-3.5 text-cyan-400" /> 
    },
    { 
      id: "faculty", 
      label: "Faculty (Dr. F01)", 
      icon: <UserCheck className="w-3.5 h-3.5 text-amber-400" /> 
    },
    { 
      id: "club", 
      label: "Club Representative (Dance Club)", 
      icon: <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> 
    },
  ];

  const navIcons: Record<NavRouteId, React.ReactNode> = {
    timetable: <Calendar className="w-3.5 h-3.5" />,
    exams: <GraduationCap className="w-3.5 h-3.5" />,
    spectra_clash: <Swords className="w-3.5 h-3.5" />,
    approvals: <CheckSquare className="w-3.5 h-3.5" />,
    disruptions: <Wrench className="w-3.5 h-3.5" />,
    ai_booking: <Bot className="w-3.5 h-3.5" />,
    exports: <Download className="w-3.5 h-3.5" />,
  };

  // Filter allowed navigation links based on current role
  const activeRoleConfig = ROLE_CONFIGS[currentRole] || ROLE_CONFIGS.admin;
  const visibleNavRoutes = NAV_ROUTES.filter(route => 
    activeRoleConfig.allowedNav.includes(route.id)
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080A0C]/95 backdrop-blur-md border-b border-white/10 select-none">
      
      {/* Brand & Mission Status Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 gap-2 border-b border-white/5">
        
        {/* App Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-2.5 py-1 bg-[#0E1216] border border-cyan-500/30 rounded-[3px] shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-black tracking-wider text-white">
                  LOCUS <span className="text-cyan-400">CIT</span>
                </span>
                <span className="font-mono text-[9px] px-1 py-0.2 rounded-[2px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold">
                  v1.0
                </span>
              </div>
              <p className="font-mono text-[9px] text-[#9CA3AF] tracking-tight">
                Campus Operations &amp; Spatial Logistics Engine
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 font-mono text-[11px] text-[#9CA3AF]">
            <span className="text-[#6B7280]">|</span>
            <span>NODE: <strong className="text-white">CIT-MAIN-MATRIX</strong></span>
            <span className="text-[#6B7280]">|</span>
            <span>DATASET: <strong className="text-cyan-400">189 SESSIONS // 27 VENUES</strong></span>
            <span className="text-[#6B7280]">|</span>
            <span className="tabular-nums text-neutral-400">{timeString}</span>
          </div>
        </div>

        {/* Right Dock: Revision Pill, Reset Trigger (Admin only), Live Solver Status */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Workspace Revision Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#12161C] border border-white/10 rounded-[3px] font-mono text-xs">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-neutral-400">Workspace Revision:</span>
            <strong className="text-emerald-400">#{workspaceRevision}</strong>
          </div>

          {/* Admin "Reset Demo Data" Trigger */}
          {currentRole === "admin" && (
            <button
              onClick={onReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/50 hover:border-rose-400 rounded-[3px] font-mono text-xs font-semibold tracking-wide transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)] disabled:opacity-50 cursor-pointer"
              title="POST /api/admin/reset - Restores clean baseline demo state"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-rose-400 ${isResetting ? "animate-spin" : ""}`} />
              <span>{isResetting ? "RESETTING..." : "RESET DEMO DATA"}</span>
            </button>
          )}

          <LiveStatusBadge status="online" label="OR-TOOLS CP-SAT // ZERO CLASH" />
        </div>
      </div>

      {/* 4-Role Demo Switcher (Instant Impersonation) Strip */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[#0E1216] border-b border-white/5 gap-2">
        
        {/* Role Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-amber-400/90 mr-1 flex items-center gap-1 shrink-0">
            <Zap className="w-3 h-3 text-amber-400" /> ROLE IMPERSONATION:
          </span>

          {roleButtons.map((r) => {
            const isActive = currentRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onRoleChange(r.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] font-mono text-xs tracking-wide transition-all select-none cursor-pointer border ${
                  isActive
                    ? "bg-[#1E2530] text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-bold"
                    : "bg-[#12161C] text-neutral-400 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Persona Subtitle */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-neutral-400">
          <span className="text-neutral-600">//</span>
          <span className="text-neutral-300 font-medium">{activeRoleConfig.persona}</span>
        </div>
      </div>

      {/* Role-Aware Navigation Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#090C0E] overflow-x-auto gap-2">
        <div className="flex items-center gap-1 py-0.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 mr-2">
            ROUTES ({visibleNavRoutes.length}):
          </span>

          {visibleNavRoutes.map((route) => {
            const isActive = activeNav === route.id;
            return (
              <button
                key={route.id}
                onClick={() => onNavChange(route.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] font-mono text-xs transition-all select-none cursor-pointer border ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/60 font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                    : "bg-transparent text-neutral-400 border-transparent hover:bg-white/5 hover:text-white"
                }`}
                title={route.description}
              >
                {navIcons[route.id]}
                <span>{route.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scenario Presets Pill for Judges */}
        <div className="hidden md:flex items-center gap-1 font-mono text-[10px]">
          <span className="text-neutral-500">SCENARIO:</span>
          <button
            onClick={() => onScenarioChange("default")}
            className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
              currentScenario === "default" ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/40" : "text-neutral-400 hover:text-white"
            }`}
          >
            BASELINE
          </button>
          <button
            onClick={() => onScenarioChange("spectra_surge")}
            className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
              currentScenario === "spectra_surge" ? "bg-amber-400/20 text-amber-300 border border-amber-400/40" : "text-neutral-400 hover:text-white"
            }`}
          >
            SPECTRA
          </button>
          <button
            onClick={() => onScenarioChange("disruption")}
            className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
              currentScenario === "disruption" ? "bg-rose-400/20 text-rose-300 border border-rose-400/40" : "text-neutral-400 hover:text-white"
            }`}
          >
            DISRUPTIONS
          </button>
          <button
            onClick={() => onScenarioChange("exams")}
            className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
              currentScenario === "exams" ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/40" : "text-neutral-400 hover:text-white"
            }`}
          >
            EXAMS
          </button>
        </div>
      </div>
    </header>
  );
}
