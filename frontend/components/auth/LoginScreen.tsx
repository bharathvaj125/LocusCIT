"use client";

import React, { useEffect, useState } from "react";
import { LogIn, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { describeError, health, login } from "@/lib/api";
import { StoredSession } from "@/lib/session";
import { DEMO_ACCOUNTS } from "@/lib/uiConfig";
import { TactileButton } from "@/components/tactile/TactileButton";

export function LoginScreen({ onSignedIn, notice }: { onSignedIn: (s: StoredSession) => void; notice?: string | null }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [server, setServer] = useState<"checking" | "up" | "down">("checking");

  useEffect(() => {
    // wake the (possibly sleeping) free backend while the user reads the page
    health()
      .then(() => setServer("up"))
      .catch(() => setServer("down"));
  }, []);

  const signIn = async (u: string, p: string) => {
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await login(u.trim().toLowerCase(), p));
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0C] text-[#F3F4F6] flex items-center justify-center p-4 console-grid">
      <div className="w-full max-w-md bg-[#0E1216] border border-cyan-500/30 rounded-[4px] shadow-[0_0_40px_rgba(6,182,212,0.12)] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-[3px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <div className="font-mono text-base font-black tracking-wider text-white">
              LOCUS <span className="text-cyan-400">CIT</span>
            </div>
            <p className="font-mono text-[11px] text-neutral-400">Campus scheduling &amp; venue management</p>
          </div>
        </div>

        <div className="font-mono text-[11px] flex items-center gap-1.5">
          {server === "checking" && (
            <span className="text-amber-300 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Waking the server (can take up to a minute)...
            </span>
          )}
          {server === "up" && <span className="text-emerald-400">Server online</span>}
          {server === "down" && (
            <span className="text-rose-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Server not reachable yet; it may still be starting. Signing in will retry.
            </span>
          )}
        </div>

        {notice && (
          <div className="p-2 bg-amber-950/40 border border-amber-500/40 rounded text-amber-200 font-mono text-[11px]">{notice}</div>
        )}

        <form
          className="space-y-3 font-mono text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            signIn(username, password);
          }}
        >
          <div>
            <label htmlFor="u" className="text-neutral-400 block text-[10px] mb-1">USERNAME</label>
            <input
              id="u"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#12161C] border border-white/15 rounded text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label htmlFor="p" className="text-neutral-400 block text-[10px] mb-1">PASSWORD</label>
            <input
              id="p"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#12161C] border border-white/15 rounded text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          {error && <div className="p-2 bg-rose-950/50 border border-rose-500/40 rounded text-rose-200">{error}</div>}
          <TactileButton type="submit" variant="primary" size="md" disabled={busy || !username || !password}
            icon={busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}>
            {busy ? "SIGNING IN..." : "SIGN IN"}
          </TactileButton>
        </form>

        <div className="pt-3 border-t border-white/10 space-y-2">
          <p className="font-mono text-[10px] uppercase text-neutral-400">Demo accounts (one click signs in):</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.username}
                type="button"
                disabled={busy}
                onClick={() => signIn(a.username, a.password)}
                className="px-2.5 py-2 bg-[#161B22] hover:bg-[#1E2530] border border-white/10 hover:border-cyan-500/50 rounded-[3px] text-left font-mono text-[11px] text-neutral-300 hover:text-white disabled:opacity-50 cursor-pointer"
              >
                <strong className="text-cyan-300 block">{a.label}</strong>
                <span className="text-neutral-500">{a.username} / {a.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
