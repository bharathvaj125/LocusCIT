"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { describeError, health, login } from "@/lib/api";
import { StoredSession } from "@/lib/session";
import { DEMO_ACCOUNTS } from "@/lib/uiConfig";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

// a miniature timetable that assembles itself: decorative, not data
const BLOCKS: Array<[number, number, number, string]> = [
  [0, 0, 1, "#1F8A96"], [0, 1, 1, "#8A7F68"], [0, 2, 1, "#3F5BA9"], [0, 3, 2, "#E9A93A"],
  [1, 1, 3, "#6B4C9A"], [1, 5, 1, "#1F8A96"], [1, 6, 2, "#E4572E"],
  [2, 0, 1, "#2E7D5B"], [2, 2, 1, "#8A7F68"], [2, 4, 1, "#1F8A96"], [2, 5, 2, "#3F5BA9"],
  [3, 1, 1, "#E4572E"], [3, 2, 1, "#8A7F68"], [3, 5, 3, "#6B4C9A"],
  [4, 0, 2, "#1F8A96"], [4, 3, 1, "#E9A93A"], [4, 4, 1, "#2E7D5B"], [4, 6, 1, "#8A7F68"],
];

function Art() {
  return (
    <div className="relative w-full max-w-[440px]">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(9, 1fr)", gridTemplateRows: "repeat(5, 40px)" }} aria-hidden>
        {Array.from({ length: 45 }).map((_, i) => <div key={i} className="rounded-md border border-lagoon-200/15" />)}
        {BLOCKS.map(([r, c, span, color], i) => (
          <motion.div key={i} className="rounded-md origin-left" style={{ gridRow: r + 1, gridColumn: `${c + 1} / span ${span}`, background: color }}
            initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: [0, 1, 1, 1, 0], opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 9, times: [0, 0.12, 0.5, 0.9, 1], delay: i * 0.18, repeat: Infinity, repeatDelay: 0.4, ease: "easeOut" }} />
        ))}
      </div>
    </div>
  );
}

export function LoginScreen({ onSignedIn, notice }: { onSignedIn: (s: StoredSession) => void; notice?: string | null }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [server, setServer] = useState<"checking" | "up" | "down">("checking");

  useEffect(() => { health().then(() => setServer("up")).catch(() => setServer("down")); }, []);

  const signIn = async (u: string, p: string) => {
    setBusy(u); setError(null);
    try { onSignedIn(await login(u.trim().toLowerCase(), p)); } catch (e) { setError(describeError(e)); } finally { setBusy(null); }
  };

  return (
    <div className="relative z-[1] min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden lg:flex flex-col justify-between bg-lagoon-900 text-raised p-12 overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-sunrise-500 flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(228,87,46,0.8)]">
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden><path d="M3 12c2.5-4 5-4 8 0s5.5 4 8 0" stroke="#FBF8F2" strokeWidth="2.4" strokeLinecap="round" /><circle cx="11" cy="6" r="2" fill="#FBF8F2" /></svg>
          </div>
          <div className="leading-tight"><div className="font-display text-3xl font-semibold tracking-[-0.02em]">Locus</div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-200/80">Chilika Institute of Technology</div></div>
        </div>
        <div className="relative z-10 space-y-9">
          <h1 className="font-display text-[56px] leading-[1.02] font-semibold tracking-[-0.03em] max-w-[560px]">
            Timetables that keep the <span className="italic font-medium text-sunrise-500">lagoon</span> calm.
          </h1>
          <Art />
          <ul className="grid grid-cols-3 gap-6 max-w-[560px] text-sm text-lagoon-200">
            <li><strong className="block font-display text-3xl text-raised">189</strong>classes placed, none clashing</li>
            <li><strong className="block font-display text-3xl text-raised">41</strong>midsems across rooms</li>
            <li><strong className="block font-display text-3xl text-raised">25</strong>Spectra requests, each explained</li>
          </ul>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 overflow-hidden pointer-events-none" aria-hidden>
          <div className="wave-drift-slow absolute bottom-0 left-0 w-[200%] opacity-30"><svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-36"><path d="M0 60 Q 150 10 300 60 T 600 60 T 900 60 T 1200 60 V120 H0Z" fill="#1F8A96" /></svg></div>
          <div className="wave-drift absolute bottom-0 left-0 w-[200%] opacity-50"><svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24"><path d="M0 70 Q 150 30 300 70 T 600 70 T 900 70 T 1200 70 V120 H0Z" fill="#0E6270" /></svg></div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[460px] space-y-8">
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sunrise-500" /><div className="font-display text-3xl font-semibold tracking-[-0.02em]">Locus</div>
          </div>
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-lagoon-700">Sign in</p>
            <h2 className="font-display text-4xl font-semibold tracking-[-0.02em]">Welcome back</h2>
            <p className="text-sm flex items-center gap-2 text-ink-600">
              {server === "checking" && <><Loader2 className="w-3.5 h-3.5 animate-spin text-saffron-600" />Waking the server. This can take up to a minute.</>}
              {server === "up" && <><span className="w-2 h-2 rounded-full bg-mangrove-500" />Server online</>}
              {server === "down" && <><span className="w-2 h-2 rounded-full bg-sunrise-500" />Server not reachable yet; signing in will retry.</>}
            </p>
          </div>
          {notice && <p className="rounded-xl bg-saffron-50 text-saffron-600 px-4 py-3 text-sm">{notice}</p>}

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); signIn(username, password); }}>
            <label className="block"><span className="text-sm font-semibold">Username</span>
              <input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1.5 w-full h-12 px-4 rounded-xl bg-raised border border-line focus:border-lagoon-500 outline-none text-[15px]" /></label>
            <label className="block"><span className="text-sm font-semibold">Password</span>
              <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full h-12 px-4 rounded-xl bg-raised border border-line focus:border-lagoon-500 outline-none text-[15px]" /></label>
            {error && <p className="rounded-xl bg-sunrise-50 text-sunrise-600 px-4 py-3 text-sm" role="alert">{error}</p>}
            <Button type="submit" size="lg" className="w-full" loading={busy === username && !!username} disabled={!username || !password || !!busy} icon={<ArrowRight className="w-4 h-4" />}>Sign in</Button>
          </form>

          <div className="space-y-3">
            <div className="flex items-center gap-3"><div className="h-px flex-1 bg-line" /><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">or try a demo account</span><div className="h-px flex-1 bg-line" /></div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((a, i) => (
                <motion.button key={a.username} type="button" disabled={!!busy} onClick={() => signIn(a.username, a.password)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                  className={cn("text-left rounded-2xl bg-raised border border-line hover:border-lagoon-500 p-3.5 flex items-center gap-3 cursor-pointer disabled:opacity-60 shadow-card", i === 4 && "sm:col-span-2")}>
                  <span className="w-10 h-10 rounded-full bg-lagoon-50 text-lagoon-700 font-display text-lg font-semibold flex items-center justify-center shrink-0">{busy === a.username ? <Loader2 className="w-4 h-4 animate-spin" /> : a.label.slice(0, 1)}</span>
                  <span className="min-w-0"><span className="block text-sm font-semibold">{a.label}</span><span className="block text-xs text-ink-600 truncate">{a.role} · {a.blurb}</span><span className="block font-mono text-[10px] text-ink-400 mt-0.5">{a.username} / {a.password}</span></span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
