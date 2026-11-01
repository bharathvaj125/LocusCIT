"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeChoice = "light" | "dark" | "system";
const KEY = "locus_theme";
const OPTIONS: Array<{ id: ThemeChoice; label: string; icon: React.ReactNode }> = [
  { id: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
  { id: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
  { id: "system", label: "Match my device", icon: <Monitor className="w-4 h-4" /> },
];

function stored(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch { /* storage can be blocked: fall back to the device setting */ }
  return "system";
}

function resolve(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(choice: ThemeChoice) {
  document.documentElement.setAttribute("data-theme", resolve(choice));
}

/** Light / dark / device switch for the top right corner. The choice is remembered in this browser only. */
export function ThemeMenu({ className, tone = "page" }: { className?: string; tone?: "page" | "deep" }) {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">("light");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = stored();
    setChoice(c);
    setMode(resolve(c));
  }, []);

  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => { apply("system"); setMode(resolve("system")); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [choice]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const pick = useCallback((c: ThemeChoice) => {
    setChoice(c);
    apply(c);
    setMode(resolve(c));
    try { localStorage.setItem(KEY, c); } catch { /* not remembered, still applied */ }
    setOpen(false);
  }, []);

  return (
    <div ref={box} className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Colour theme: ${choice === "system" ? "match my device" : choice}`}
        title="Light or dark"
        className={cn("p-2.5 rounded-xl cursor-pointer transition-colors",
          tone === "deep" ? "text-lagoon-200 hover:text-onbrand hover:bg-white/10" : "text-ink-600 hover:bg-sunk hover:text-ink-900")}>
        {mode === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" aria-label="Colour theme" initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl bg-raised text-ink-900 border border-line shadow-pop p-1.5">
            {OPTIONS.map((o) => (
              <button key={o.id} role="menuitemradio" aria-checked={choice === o.id} onClick={() => pick(o.id)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer text-left hover:bg-sunk", choice === o.id && "bg-lagoon-50")}>
                <span className="text-ink-600">{o.icon}</span>
                <span className="flex-1">{o.label}</span>
                {choice === o.id && <Check className="w-4 h-4 text-lagoon-700" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
