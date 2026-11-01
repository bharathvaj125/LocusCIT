"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Building2, CalendarDays, CheckSquare, ChevronDown, Download, GraduationCap, CalendarPlus, Landmark, LayoutDashboard, LogOut, MessageSquareText, Search, Sparkles, Users as UsersIcon, Wrench } from "lucide-react";
import { Dashboard, NavRouteId, SessionUser } from "@/lib/types";
import { DEMO_ACCOUNTS, NAV_ROUTES, ROLE_CONFIGS } from "@/lib/uiConfig";
import { Chip, Kbd } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { ThemeMenu } from "@/components/ui/ThemeMenu";

const ICONS: Record<NavRouteId, React.ReactNode> = {
  overview: <LayoutDashboard className="w-[22px] h-[22px]" />, timetable: <CalendarDays className="w-[22px] h-[22px]" />, exams: <GraduationCap className="w-[22px] h-[22px]" />,
  spectra_clash: <Building2 className="w-[22px] h-[22px]" />, approvals: <CheckSquare className="w-[22px] h-[22px]" />, disruptions: <Wrench className="w-[22px] h-[22px]" />,
  ai_booking: <MessageSquareText className="w-[22px] h-[22px]" />, exports: <Download className="w-[22px] h-[22px]" />, users: <UsersIcon className="w-[22px] h-[22px]" />,
  organisations: <Landmark className="w-[22px] h-[22px]" />,
  schedule: <CalendarPlus className="w-[22px] h-[22px]" />,
};

/** Station names for narrow screens; wide screens use the full page name. */
const SHORT: Partial<Record<NavRouteId, string>> = {
  exams: "Exams", spectra_clash: "Venues", organisations: "Orgs", ai_booking: "Assistant", disruptions: "Changes",
};
const WIDE: Partial<Record<NavRouteId, string>> = { exams: "Exams", spectra_clash: "Venues" };

/**
 * The page menu: a floating glass dock at the bottom of the screen. Each page is an icon with its name; the page you are on
 * is the highlighted gold capsule. Hovering lights a pill, the arrow keys move between pages, and on a narrow screen the dock
 * scrolls sideways and keeps the current page in view.
 */
function StationDock({ nav, onNav, routes, pending }: { nav: NavRouteId; onNav: (n: NavRouteId) => void; routes: typeof NAV_ROUTES; pending: number }) {
  const idx = Math.max(0, routes.findIndex((r) => r.id === nav));
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // keep the current page in view when it changes or the screen is narrow (jump the first time, glide after that)
  const placed = useRef(false);
  useEffect(() => {
    const el = scroller.current;
    const st = list.current?.querySelectorAll<HTMLElement>("[data-station]")[idx];
    if (!el || !st) return;
    el.scrollTo({ left: st.offsetLeft + st.offsetWidth / 2 - el.clientWidth / 2, behavior: placed.current ? "smooth" : "auto" });
    placed.current = true;
  }, [idx, routes.length]);

  const onKey = (e: React.KeyboardEvent) => {
    const all = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("[data-station]") || []);
    const at = all.indexOf(document.activeElement as HTMLButtonElement);
    const to = e.key === "ArrowRight" ? at + 1 : e.key === "ArrowLeft" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : null;
    if (to === null || at < 0) return;
    e.preventDefault();
    all[(to + all.length) % all.length]?.focus();
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-3 pointer-events-none">
      <motion.nav aria-label="Pages" initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.1 }}
        className="pointer-events-auto max-w-full rounded-[28px] bg-deep/95 border border-white/10 shadow-pop">
        <div ref={scroller} className="dock-scroll overflow-x-auto py-3">
          <div ref={list} onKeyDown={onKey} className="dock mx-auto flex">
            {routes.map((r, i) => {
              const active = i === idx;
              return (
                <button key={r.id} data-station type="button" onClick={() => onNav(r.id)} aria-current={active ? "page" : undefined} title={r.description}
                  className="group relative shrink-0 flex flex-col items-center gap-2 py-1 cursor-pointer outline-none" style={{ width: "var(--w)" }}>
                  <span className={cn("relative flex items-center justify-center h-11 w-[60px] rounded-full transition-all duration-300",
                    active ? "bg-gradient-to-b from-[#F1D58A] to-lagoon-500 text-deep shadow-[0_6px_22px_rgba(233,196,104,0.35)]"
                      : "text-lagoon-200 group-hover:bg-white/10 group-hover:text-onbrand group-focus-visible:ring-2 group-focus-visible:ring-lagoon-500")}>
                    {ICONS[r.id]}
                    {r.id === "approvals" && pending > 0 && (
                      <span className="absolute -top-1 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sunrise-500 text-onbrand text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--color-deep)]">{pending}</span>
                    )}
                  </span>
                  <span className={cn("font-mono text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap transition-colors duration-300",
                    active ? "text-onbrand" : "text-lagoon-200 group-hover:text-onbrand")}>
                    <span className="sm:hidden">{SHORT[r.id] ?? r.label}</span><span className="hidden sm:inline">{WIDE[r.id] ?? r.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </div>
  );
}

/** Who is signed in, top right: name and role, with the account menu (switch demo account, replay the intro, sign out). */
function AccountMenu({ user, onSwitch, onSignOut, switching }: { user: SessionUser; onSwitch: (u: string, p: string) => void; onSignOut: () => void; switching: boolean }) {
  const roleConfig = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.club;
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  const name = user.display_name.replace(/ \(.*/, "");
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Signed in as ${name}, ${roleConfig.badge}`}
        className="flex items-center gap-2.5 h-11 pl-1.5 pr-2.5 sm:pr-3 rounded-full bg-raised border border-line hover:border-line-strong transition-colors cursor-pointer">
        <span className="w-8 h-8 rounded-full bg-lagoon-500 text-deep font-display font-semibold flex items-center justify-center text-[15px]">{name.slice(0, 1)}</span>
        <span className="hidden sm:block text-left leading-tight max-w-[170px]">
          <span className="block text-[13px] font-semibold text-ink-900 truncate">{name}</span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-600">{roleConfig.badge}</span>
        </span>
        <ChevronDown className={cn("w-4 h-4 text-ink-400 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-2 z-50 w-[300px] rounded-2xl bg-raised text-ink-900 shadow-pop border border-line p-2">
            <div className="px-2.5 pt-1.5 pb-2.5 border-b border-line mb-1">
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-ink-600">{roleConfig.badge}{user.org ? ` · ${user.org}` : user.department ? ` · ${user.department}` : ""}</p>
            </div>
            <p className="px-2.5 pt-1 pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">Switch demo account</p>
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.username} role="menuitem" disabled={switching || a.username === user.username} onClick={() => { setOpen(false); onSwitch(a.username, a.password); }}
                className={cn("w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default", a.username === user.username ? "bg-lagoon-50" : "hover:bg-sunk")}>
                <span><span className="block text-[13px] font-semibold">{a.label}</span><span className="block text-[11px] text-ink-400">{a.role}</span></span>
                {a.username === user.username && <Chip tone="mangrove">you</Chip>}
              </button>
            ))}
            <div className="border-t border-line mt-1 pt-1 space-y-0.5">
              <button role="menuitem" onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent("replay_intro")); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-semibold text-ink-600 hover:bg-sunk cursor-pointer"><Sparkles className="w-4 h-4 text-lagoon-500" /> Replay intro</button>
              <button role="menuitem" onClick={onSignOut} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-semibold text-sunrise-600 hover:bg-sunrise-50 cursor-pointer"><LogOut className="w-4 h-4" /> Sign out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Shell({ user, dashboard, nav, onNav, onSwitch, onSignOut, onSearch, switching, children }: {
  user: SessionUser; dashboard: Dashboard | null; nav: NavRouteId; onNav: (n: NavRouteId) => void;
  onSwitch: (u: string, p: string) => void; onSignOut: () => void; onSearch: () => void; switching: boolean; children: React.ReactNode;
}) {
  const roleConfig = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.club;
  const routes = NAV_ROUTES.filter((r) => roleConfig.allowedNav.includes(r.id));
  const pending = dashboard?.pending_approvals ?? 0;
  return (
    <div className="relative z-[1] min-h-screen">
      <header className="sticky top-0 z-20 bg-paper/95 border-b border-line/70">
        <div className="flex items-center gap-3 px-4 md:px-8 h-[68px] max-w-[1500px] mx-auto">
          <button onClick={() => onNav("overview")} aria-label="Locus, go to the overview" className="flex items-center gap-3 shrink-0 cursor-pointer">
            <span className="relative w-10 h-10 rounded-xl bg-deep p-1 border border-lagoon-500/40 flex items-center justify-center shadow-[0_4px_14px_rgba(201,150,46,0.25)]">
              <Image src="/locus_mark.png" alt="" width={32} height={32} className="object-contain" priority />
            </span>
            <span className="hidden md:block leading-tight text-left">
              <span className="font-display text-[22px] font-semibold text-ink-900 tracking-[-0.02em] flex items-center gap-1.5">
                Locus <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-lagoon-500/15 text-gold font-bold border border-lagoon-500/40">CIT</span>
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-600">Chilika Inst. of Tech.</span>
            </span>
          </button>
          <button onClick={onSearch}
            className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl bg-raised border border-line hover:border-line-strong text-ink-400 text-sm min-w-0 w-full max-w-[360px] md:ml-4 cursor-pointer">
            <Search className="w-4 h-4 shrink-0" /><span className="truncate">Search groups, faculty, rooms, screens</span><span className="ml-auto hidden sm:flex shrink-0 items-center"><Kbd>Ctrl K</Kbd></span>
          </button>
          <div className="flex-1" />
          <button onClick={() => onNav("approvals")} aria-label={`${pending} pending approvals`} className="relative p-2.5 rounded-xl hover:bg-sunk text-ink-600 cursor-pointer">
            <Bell className="w-5 h-5" />
            {pending > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-sunrise-500 text-onbrand text-[10px] font-bold flex items-center justify-center">{pending}</span>}
          </button>
          <ThemeMenu />
          <AccountMenu user={user} onSwitch={onSwitch} onSignOut={onSignOut} switching={switching} />
        </div>
      </header>

      <main className="px-4 md:px-8 py-7 pb-40 max-w-[1500px] mx-auto">
        {children}
      </main>

      <StationDock nav={nav} onNav={onNav} routes={routes} pending={pending} />
    </div>
  );
}
