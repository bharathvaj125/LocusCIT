"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, LogOut, Search, Sparkles } from "lucide-react";
import { Dashboard, NavRouteId, SessionUser } from "@/lib/types";
import { DEMO_ACCOUNTS, NAV_ROUTES, ROLE_CONFIGS } from "@/lib/uiConfig";
import { Chip, Kbd } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { ThemeMenu } from "@/components/ui/ThemeMenu";

/** Station names for narrow screens; wide screens use the full page name. */
const SHORT: Partial<Record<NavRouteId, string>> = {
  exams: "Exams", spectra_clash: "Venues", organisations: "Orgs", ai_booking: "Assistant", disruptions: "Changes",
};
const WIDE: Partial<Record<NavRouteId, string>> = { exams: "Exams", spectra_clash: "Venues" };

/**
 * The page menu: a floating glass dock at the bottom of the screen. Every page is a station on one line; the line fills in
 * gold up to the page you are on and a small train glides there (with a little stretch and bounce). Hovering a station
 * lights its pill, the arrow keys move between stations, and a long list scrolls sideways and keeps the current page centred.
 */
function StationDock({ nav, onNav, routes, pending }: { nav: NavRouteId; onNav: (n: NavRouteId) => void; routes: typeof NAV_ROUTES; pending: number }) {
  const idx = Math.max(0, routes.findIndex((r) => r.id === nav));
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // keep the current station in view when the page changes or the screen is narrow (jump the first time, glide after that)
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
    <div className="fixed inset-x-0 bottom-3 z-30 flex justify-center px-3 pointer-events-none">
      <motion.nav aria-label="Pages" initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.1 }}
        className="pointer-events-auto max-w-full rounded-[24px] bg-deep/85 backdrop-blur-xl border border-white/10 shadow-pop">
        <div ref={scroller} className="dock-scroll overflow-x-auto px-2 pt-2.5 pb-1.5">
          <div ref={list} onKeyDown={onKey} className="dock relative mx-auto" style={{ width: `calc(var(--w) * ${routes.length})`, height: 92, ["--i" as string]: idx }}>
            <div className="absolute top-[34px] h-[4px] rounded-full bg-white/15" style={{ left: "calc(var(--w) * .5)", width: `calc(var(--w) * ${routes.length - 1})` }} aria-hidden />
            <div className="dock-fill absolute top-[34px] h-[4px] rounded-full bg-gradient-to-r from-lagoon-500/70 to-lagoon-500" style={{ left: "calc(var(--w) * .5)", width: "calc(var(--w) * var(--i))" }} aria-hidden />
            <div className="dock-train absolute top-[18px] z-[2] pointer-events-none" aria-hidden>
              <span key={idx} className="dock-train-body flex items-center justify-center gap-[5px] h-8 w-[68px] -translate-x-1/2 rounded-[16px_16px_7px_7px] bg-onbrand shadow-[0_0_22px_rgba(233,196,104,0.45)]">
                <i className="w-2.5 h-2.5 rounded-[3px] bg-deep" /><i className="w-3 h-3 rounded-full bg-lagoon-500 shadow-[0_0_8px_rgba(233,196,104,0.9)]" /><i className="w-2.5 h-2.5 rounded-[3px] bg-deep" />
              </span>
            </div>
            {routes.map((r, i) => {
              const active = i === idx;
              const done = i <= idx;
              return (
                <button key={r.id} data-station type="button" onClick={() => onNav(r.id)} aria-current={active ? "page" : undefined} title={r.description}
                  className="group absolute top-0 z-[3] h-[92px] flex flex-col items-center pt-[23px] cursor-pointer outline-none"
                  style={{ left: `calc(var(--w) * ${i})`, width: "var(--w)" }}>
                  <span aria-hidden className="absolute inset-x-1.5 inset-y-0.5 rounded-2xl bg-white/0 group-hover:bg-white/[0.07] group-focus-visible:bg-white/[0.07] group-focus-visible:ring-2 group-focus-visible:ring-lagoon-500 transition-colors duration-200" />
                  <span className={cn("relative w-[22px] h-[22px] rounded-full border-2 transition-all duration-300 group-hover:scale-125",
                    active ? "opacity-0 scale-50" : done ? "bg-lagoon-500 border-lagoon-500" : "bg-deep border-white/30 group-hover:border-lagoon-500")} />
                  {r.id === "approvals" && pending > 0 && (
                    <span className="absolute top-[14px] left-[calc(50%+8px)] min-w-[17px] h-[17px] px-1 rounded-full bg-sunrise-500 text-onbrand text-[10px] font-bold flex items-center justify-center ring-2 ring-[var(--color-deep)]">{pending}</span>
                  )}
                  <span className={cn("relative mt-[15px] font-mono text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] transition-colors duration-300 whitespace-nowrap",
                    active ? "text-onbrand" : "text-lagoon-200 group-hover:text-onbrand")}>
                    <span className="sm:hidden">{SHORT[r.id] ?? r.label}</span><span className="hidden sm:inline">{WIDE[r.id] ?? r.label}</span>
                  </span>
                  <span className={cn("relative font-mono text-[9px] mt-0.5 transition-colors", active ? "text-lagoon-500" : "text-lagoon-200/80")}>{String(i + 1).padStart(2, "0")}</span>
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
      <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur-md border-b border-line/70">
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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={nav} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <StationDock nav={nav} onNav={onNav} routes={routes} pending={pending} />
    </div>
  );
}
