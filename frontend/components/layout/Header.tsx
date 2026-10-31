"use client";

import React, { useEffect, useState } from "react";
import { Dashboard, NavRouteId, SessionUser } from "@/lib/types";
import { DEMO_ACCOUNTS, NAV_ROUTES, ROLE_CONFIGS } from "@/lib/uiConfig";
import { LiveStatusBadge } from "@/components/tactile/LiveStatusBadge";
import {
  RotateCcw, GraduationCap, UserCheck, ShieldCheck, Layers, Calendar, Swords, CheckSquare, Wrench, Bot, Radio,
  Download, LogOut, Users,
} from "lucide-react";

interface HeaderProps {
  user: SessionUser;
  dashboard: Dashboard | null;
  workspaceRevision: number;
  onReset: () => void;
  isResetting?: boolean;
  activeNav: NavRouteId;
  onNavChange: (nav: NavRouteId) => void;
  onSwitchAccount: (username: string, password: string) => void;
  onSignOut: () => void;
  switching?: boolean;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
  department_coordinator: <Layers className="w-3.5 h-3.5 text-cyan-400" />,
  faculty: <UserCheck className="w-3.5 h-3.5 text-amber-400" />,
  club: <GraduationCap className="w-3.5 h-3.5 text-purple-400" />,
};

const NAV_ICONS: Record<NavRouteId, React.ReactNode> = {
  timetable: <Calendar className="w-3.5 h-3.5" />,
  exams: <GraduationCap className="w-3.5 h-3.5" />,
  spectra_clash: <Swords className="w-3.5 h-3.5" />,
  approvals: <CheckSquare className="w-3.5 h-3.5" />,
  disruptions: <Wrench className="w-3.5 h-3.5" />,
  ai_booking: <Bot className="w-3.5 h-3.5" />,
  exports: <Download className="w-3.5 h-3.5" />,
};

export function Header({
  user, dashboard, workspaceRevision, onReset, isResetting = false, activeNav, onNavChange, onSwitchAccount,
  onSignOut, switching = false,
}: HeaderProps) {
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const update = () =>
      setTimeString(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" }) + " IST");
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const roleConfig = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.club;
  const visibleNav = NAV_ROUTES.filter((r) => roleConfig.allowedNav.includes(r.id));
  const hard = dashboard?.hard_violation_count;
  const solverBadge =
    !dashboard || dashboard.sessions_scheduled === 0
      ? { status: "idle" as const, label: "NO TIMETABLE YET" }
      : hard === 0
      ? { status: "online" as const, label: `0 HARD VIOLATIONS // SOFT ${dashboard.soft_total ?? "-"}` }
      : { status: "alert" as const, label: `${hard} HARD VIOLATIONS` };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080A0C]/95 backdrop-blur-md border-b border-white/10 select-none">
      <div className="flex flex-wrap items-center justify-between px-3 py-2 gap-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-2.5 py-1 bg-[#0E1216] border border-cyan-500/30 rounded-[3px]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <div>
              <span className="font-mono text-sm font-black tracking-wider text-white">
                LOCUS <span className="text-cyan-400">CIT</span>
              </span>
              <p className="font-mono text-[9px] text-[#9CA3AF] tracking-tight">Campus scheduling &amp; venue management</p>
            </div>
          </div>
          <div className="hidden xl:flex items-center gap-2 font-mono text-[11px] text-[#9CA3AF]">
            <span>DATASET: <strong className="text-cyan-400">{dashboard?.dataset_id || "..."}</strong></span>
            <span className="text-[#6B7280]">|</span>
            <span>
              SESSIONS: <strong className="text-white">{dashboard ? `${dashboard.sessions_scheduled}/${dashboard.sessions_total}` : "..."}</strong>
            </span>
            <span className="text-[#6B7280]">|</span>
            <span className="tabular-nums text-neutral-400">{timeString}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#12161C] border border-white/10 rounded-[3px] font-mono text-xs"
            title="Changes every time the shared demo workspace is modified">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span className="text-neutral-400">Revision</span>
            <strong className="text-emerald-400">#{workspaceRevision}</strong>
          </div>
          {user.role === "admin" && (
            <button
              onClick={onReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-500/50 rounded-[3px] font-mono text-xs font-semibold disabled:opacity-50 cursor-pointer"
              title="Restore the clean demo state (demo accounts are kept)"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
              <span>{isResetting ? "RESETTING..." : "RESET DEMO DATA"}</span>
            </button>
          )}
          <LiveStatusBadge status={solverBadge.status} label={solverBadge.label} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[#0E1216] border-b border-white/5 gap-2">
        <div className="flex items-center gap-2 font-mono text-xs min-w-0">
          {ROLE_ICON[user.role]}
          <span className="text-white font-bold truncate">{user.display_name}</span>
          <span className="px-1.5 py-0.5 rounded-[2px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[10px]">
            {roleConfig.badge}
          </span>
          <span className="hidden md:inline text-neutral-500 truncate">{roleConfig.persona}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="font-mono text-[10px] uppercase text-amber-400/90 mr-1 flex items-center gap-1 shrink-0">
            <Users className="w-3 h-3" /> SWITCH DEMO ACCOUNT:
          </span>
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.username}
              disabled={switching || a.username === user.username}
              onClick={() => onSwitchAccount(a.username, a.password)}
              className={`px-2 py-0.5 rounded-[3px] font-mono text-[11px] border shrink-0 cursor-pointer disabled:cursor-default ${
                a.username === user.username
                  ? "bg-[#1E2530] text-cyan-300 border-cyan-400 font-bold"
                  : "bg-[#12161C] text-neutral-400 border-white/5 hover:border-white/20 hover:text-white"
              }`}
            >
              {a.label}
            </button>
          ))}
          <button
            onClick={onSignOut}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[3px] font-mono text-[11px] border border-white/10 text-neutral-300 hover:text-white hover:border-white/30 shrink-0 cursor-pointer"
          >
            <LogOut className="w-3 h-3" /> SIGN OUT
          </button>
        </div>
      </div>

      <nav className="flex items-center px-3 py-1 bg-[#090C0E] overflow-x-auto gap-1" aria-label="Main">
        {visibleNav.map((route) => {
          const active = activeNav === route.id;
          return (
            <button
              key={route.id}
              onClick={() => onNavChange(route.id)}
              aria-current={active ? "page" : undefined}
              title={route.description}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] font-mono text-xs border shrink-0 cursor-pointer ${
                active
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/60 font-bold"
                  : "bg-transparent text-neutral-400 border-transparent hover:bg-white/5 hover:text-white"
              }`}
            >
              {NAV_ICONS[route.id]}
              <span>{route.label}</span>
              {route.id === "approvals" && dashboard && dashboard.pending_approvals > 0 && (
                <span className="ml-0.5 px-1 rounded-[2px] bg-amber-500/25 text-amber-300 text-[10px]">{dashboard.pending_approvals}</span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
