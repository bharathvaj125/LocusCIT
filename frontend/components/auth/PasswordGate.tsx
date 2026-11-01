"use client";

import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { changePassword, describeError } from "@/lib/api";
import { Button, Card, Eyebrow } from "@/components/ui/primitives";

const FIELD = "w-full h-11 px-3 rounded-xl bg-paper border border-line text-sm focus:border-lagoon-500 outline-none";

/** Shown instead of the app while an account still has the temporary password an Admin gave it. */
export function PasswordGate({ username, onDone, onSignOut }: { username: string; onDone: () => void; onSignOut: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (next !== again) { setError("The two new passwords are not the same."); return; }
    setBusy(true);
    try { await changePassword(current, next); onDone(); } catch (e) { setError(describeError(e)); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-[440px] p-7 space-y-5">
        <div className="space-y-2">
          <span className="w-11 h-11 rounded-xl bg-primary text-onprimary flex items-center justify-center"><KeyRound className="w-5 h-5" /></span>
          <Eyebrow>First sign-in</Eyebrow>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Choose your own <span className="italic font-medium text-gold">password</span></h1>
          <p className="text-sm text-ink-600">Hello {username}. The password an Admin gave you is temporary. Pick one only you know: at least 8 characters, with a letter and a digit.</p>
        </div>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Temporary password</Eyebrow><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={FIELD} autoComplete="current-password" required /></label>
          <label className="block space-y-1.5"><Eyebrow className="text-ink-400">New password</Eyebrow><input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={FIELD} autoComplete="new-password" required minLength={8} /></label>
          <label className="block space-y-1.5"><Eyebrow className="text-ink-400">New password again</Eyebrow><input type="password" value={again} onChange={(e) => setAgain(e.target.value)} className={FIELD} autoComplete="new-password" required minLength={8} /></label>
          {error && <p className="text-sm text-sunrise-600 bg-sunrise-50 rounded-xl px-4 py-3" role="alert">{error}</p>}
          <Button type="submit" loading={busy} className="w-full">Save and continue</Button>
        </form>
        <button onClick={onSignOut} className="text-sm text-ink-600 underline cursor-pointer">Sign out instead</button>
      </Card>
    </div>
  );
}
