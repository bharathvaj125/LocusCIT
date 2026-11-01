"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Bell, Building2, CalendarDays, CheckSquare, ChevronsUpDown, Download, GraduationCap, LayoutDashboard, LogOut, Menu, MessageSquareText,
  Search, Sparkles, Wrench, X,
} from "lucide-react";
import { Dashboard, NavRouteId, SessionUser } from "@/lib/types";
import { DEMO_ACCOUNTS, NAV_ROUTES, ROLE_CONFIGS } from "@/lib/uiConfig";
import { Chip, Kbd } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { ThemeMenu } from "@/components/ui/ThemeMenu";

const ICONS: Record<NavRouteId, React.ReactNode> = {
  overview: <LayoutDashboard className="w-[18px] h-[18px]" />,
  timetable: <CalendarDays className="w-[18px] h-[18px]" />,
  exams: <GraduationCap className="w-[18px] h-[18px]" />,
  spectra_clash: <Building2 className="w-[18px] h-[18px]" />,
  approvals: <CheckSquare className="w-[18px] h-[18px]" />,
  disruptions: <Wrench className="w-[18px] h-[18px]" />,
  ai_booking: <MessageSquareText className="w-[18px] h-[18px]" />,
  exports: <Download className="w-[18px] h-[18px]" />,
};

function Waves() {
  return (
    <div className="absolute left-0 right-0 bottom-0 h-28 overflow-hidden pointer-events-none" aria-hidden>
      <div className="wave-drift-slow absolute bottom-0 left-0 w-[200%] opacity-30">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24"><path d="M0 60 Q 150 10 300 60 T 600 60 T 900 60 T 1200 60 V120 H0Z" fill="#2F4FA6" /></svg>
      </div>
      <div className="wave-drift absolute bottom-0 left-0 w-[200%] opacity-45">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16"><path d="M0 70 Q 150 30 300 70 T 600 70 T 900 70 T 1200 70 V120 H0Z" fill="#1C2F66" /></svg>
      </div>
    </div>
  );
}

function Rail({ user, dashboard, nav, onNav, onSwitch, onSignOut, onClose, switching }: {
  user: SessionUser; dashboard: Dashboard | null; nav: NavRouteId; onNav: (n: NavRouteId) => void;
  onSwitch: (u: string, p: string) => void; onSignOut: () => void; onClose?: () => void; switching: boolean;
}) {
  const roleConfig = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.club;
  const routes = NAV_ROUTES.filter((r) => roleConfig.allowedNav.includes(r.id));
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menu]);

  return (
    <div className="relative h-full w-[248px] bg-deep text-lagoon-200 flex flex-col overflow-hidden">
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-xl bg-deep p-1 border border-lagoon-500/40 flex items-center justify-center shadow-[0_4px_14px_rgba(201,150,46,0.25)]">
          <Image src="/locus_mark.png" alt="Locus Logo" width={32} height={32} className="object-contain" priority />
        </div>
        <div className="leading-tight">
          <div className="font-display text-[22px] font-semibold text-onbrand tracking-[-0.02em] flex items-center gap-1.5">
            Locus
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-lagoon-500/15 text-lagoon-500 font-bold border border-lagoon-500/40">CIT</span>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-lagoon-200/80">Chilika Inst. of Tech.</div>
        </div>
        {onClose && <button onClick={onClose} aria-label="Close menu" className="ml-auto p-1.5 text-lagoon-200 cursor-pointer"><X className="w-5 h-5" /></button>}
      </div>

      <nav className="px-3 flex-1 overflow-y-auto relative z-10" aria-label="Main">
        <LayoutGroup id="rail">
          <ul className="space-y-1">
            {routes.map((r) => {
              const active = nav === r.id;
              return (
                <li key={r.id}>
                  <button onClick={() => onNav(r.id)} aria-current={active ? "page" : undefined} title={r.description}
                    className={cn("relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors cursor-pointer", active ? "text-onbrand" : "text-lagoon-200 hover:text-onbrand hover:bg-white/5")}>
                    {active && <motion.span layoutId="rail-active" className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-lagoon-500/40" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                    {active && <motion.span layoutId="rail-dot" className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-lagoon-500" />}
                    <span className="relative z-10">{ICONS[r.id]}</span>
                    <span className="relative z-10">{r.label}</span>
                    {r.id === "approvals" && dashboard && dashboard.pending_approvals > 0 && (
                      <span className="relative z-10 ml-auto min-w-5 h-5 px-1.5 rounded-full bg-sunrise-500 text-onbrand text-[11px] font-bold flex items-center justify-center">{dashboard.pending_approvals}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </nav>

      <div className="relative z-10 p-3" ref={menuRef}>
        <AnimatePresence>
          {menu && (
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className="absolute bottom-[76px] left-3 right-3 rounded-2xl bg-raised text-ink-900 shadow-pop border border-line p-2">
              <p className="px-2 pt-1 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">Switch demo account</p>
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.username} disabled={switching || a.username === user.username} onClick={() => { setMenu(false); onSwitch(a.username, a.password); }}
                  className={cn("w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default", a.username === user.username ? "bg-lagoon-50" : "hover:bg-sunk")}>
                  <span><span className="block text-[13px] font-semibold">{a.label}</span><span className="block text-[11px] text-ink-400">{a.role}</span></span>
                  {a.username === user.username && <Chip tone="mangrove">you</Chip>}
                </button>
              ))}
              <div className="border-t border-line mt-1 pt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setMenu(false);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("replay_intro"));
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-semibold text-ink-600 hover:bg-sunk cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-lagoon-500" /> Replay Intro Reveal
                </button>
                <button onClick={onSignOut} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-semibold text-sunrise-600 hover:bg-sunrise-50 cursor-pointer"><LogOut className="w-4 h-4" /> Sign out</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left cursor-pointer">
          <span className="w-9 h-9 rounded-full bg-lagoon-500 text-deep font-display font-semibold flex items-center justify-center text-[15px]">{user.display_name.slice(0, 1)}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-onbrand truncate">{user.display_name.replace(/ \(.*/, "")}</span>
            <span className="block text-[11px] text-lagoon-200/80">{roleConfig.badge}</span>
          </span>
          <ChevronsUpDown className="w-4 h-4 text-lagoon-200/70" />
        </button>
      </div>
      <Waves />
    </div>
  );
}

export function Shell({ user, dashboard, nav, onNav, onSwitch, onSignOut, onSearch, switching, children }: {
  user: SessionUser; dashboard: Dashboard | null; nav: NavRouteId; onNav: (n: NavRouteId) => void;
  onSwitch: (u: string, p: string) => void; onSignOut: () => void; onSearch: () => void; switching: boolean; children: React.ReactNode;
}) {
  const [mobile, setMobile] = useState(false);
  const go = (n: NavRouteId) => { setMobile(false); onNav(n); };
  const pending = dashboard?.pending_approvals ?? 0;
  return (
    <div className="relative z-[1] min-h-screen lg:pl-[248px]">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[248px] z-30">
        <Rail user={user} dashboard={dashboard} nav={nav} onNav={go} onSwitch={onSwitch} onSignOut={onSignOut} switching={switching} />
      </aside>
      <AnimatePresence>
        {mobile && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 lg:hidden" initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: "spring", stiffness: 380, damping: 40 }}>
              <Rail user={user} dashboard={dashboard} nav={nav} onNav={go} onSwitch={onSwitch} onSignOut={onSignOut} onClose={() => setMobile(false)} switching={switching} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur-md border-b border-line/70">
        <div className="flex items-center gap-3 px-4 md:px-8 h-16">
          <button onClick={() => setMobile(true)} aria-label="Open menu" className="lg:hidden p-2 -ml-2 rounded-lg text-ink-600 hover:bg-sunk cursor-pointer"><Menu className="w-5 h-5" /></button>
          <button onClick={onSearch}
            className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl bg-raised border border-line hover:border-line-strong text-ink-400 text-sm min-w-0 w-full max-w-[360px] cursor-pointer">
            <Search className="w-4 h-4 shrink-0" /><span className="truncate">Search groups, faculty, rooms, screens</span><span className="ml-auto hidden sm:flex shrink-0 items-center"><Kbd>Ctrl K</Kbd></span>
          </button>
          <div className="flex-1" />
          <button onClick={() => onNav("approvals")} aria-label={`${pending} pending approvals`} className="relative p-2.5 rounded-xl hover:bg-sunk text-ink-600 cursor-pointer">
            <Bell className="w-5 h-5" />
            {pending > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-sunrise-500 text-onbrand text-[10px] font-bold flex items-center justify-center">{pending}</span>}
          </button>
          <ThemeMenu />
        </div>
      </header>

      <main className="px-4 md:px-8 py-7 pb-24 max-w-[1500px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={nav} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
