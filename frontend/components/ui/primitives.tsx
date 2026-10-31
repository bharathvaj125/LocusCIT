"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONES, Tone } from "@/lib/dept";

/* ------------------------------------------------------------------ Button */
type ButtonVariant = "primary" | "secondary" | "ghost" | "success" | "danger" | "sunrise";
const BUTTON: Record<ButtonVariant, string> = {
  primary: "bg-lagoon-700 text-raised hover:bg-lagoon-900 shadow-[0_1px_0_rgba(255,255,255,0.15)_inset]",
  secondary: "bg-raised text-ink-900 border border-line hover:border-line-strong hover:bg-white",
  ghost: "text-ink-600 hover:bg-sunk hover:text-ink-900",
  success: "bg-mangrove-500 text-raised hover:bg-mangrove-600",
  danger: "bg-raised text-sunrise-600 border border-sunrise-500/60 hover:bg-sunrise-50",
  sunrise: "bg-sunrise-500 text-raised hover:bg-sunrise-600",
};

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", icon, loading, className, children, disabled, ...rest }: ButtonProps) {
  const sizes = { sm: "px-3 py-1.5 text-[13px] gap-1.5 rounded-lg", md: "px-4 py-2.5 text-sm gap-2 rounded-xl", lg: "px-5 py-3 text-[15px] gap-2 rounded-xl" }[size];
  return (
    <motion.button
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      whileHover={disabled || loading ? undefined : { y: -1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      className={cn("inline-flex items-center justify-center font-semibold transition-colors select-none disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer", sizes, BUTTON[variant], className)}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </motion.button>
  );
}

/* -------------------------------------------------------------- Chip / Tag */
export function Chip({ tone = "lagoon", children, className, dot }: { tone?: Tone | "ink"; children: React.ReactNode; className?: string; dot?: boolean }) {
  const style = tone === "ink" ? "bg-ink-900 text-raised" : cn(TONES[tone].soft, TONES[tone].text);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", style, className)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", tone === "ink" ? "bg-raised" : TONES[tone].dot)} />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (["approved", "done", "ok", "applied"].includes(s)) return "mangrove";
  if (["alternative_offered", "alternative offered", "pending", "pending_approval", "pending_negotiation", "awaiting_response", "accepted", "computing"].includes(s)) return "lagoon";
  if (["needs_review", "needs review", "stale", "unknown", "expired"].includes(s)) return "saffron";
  if (["rejected", "infeasible", "error", "invalid", "failed_validation", "declined", "failed_revalidation"].includes(s)) return "sunrise";
  return "stone";
}

/* ------------------------------------------------------------------- Card */
export function Card({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl bg-raised border border-line shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-lagoon-700", className)}>{children}</p>;
}

export function PageTitle({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1.5 min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-display text-[34px] md:text-[40px] leading-[1.08] tracking-[-0.02em] font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-[15px] text-ink-600 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- Skeleton */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

/* ------------------------------------------------------------ Empty state */
export function EmptyState({ title, body, action, tone = "lagoon" }: { title: string; body?: React.ReactNode; action?: React.ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-raised/60 px-6 py-10 flex flex-col items-center text-center gap-3">
      <svg width="76" height="56" viewBox="0 0 76 56" fill="none" aria-hidden className="bob">
        <rect x="6" y="10" width="64" height="40" rx="8" fill={TONES[tone].hex} opacity="0.12" />
        <rect x="14" y="20" width="22" height="10" rx="3" fill={TONES[tone].hex} opacity="0.45" />
        <rect x="40" y="20" width="22" height="10" rx="3" fill={TONES[tone].hex} opacity="0.25" />
        <rect x="14" y="34" width="48" height="6" rx="3" fill={TONES[tone].hex} opacity="0.2" />
        <circle cx="60" cy="12" r="6" fill="#E4572E" opacity="0.9" />
      </svg>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {body && <p className="text-sm text-ink-600 max-w-md">{body}</p>}
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------- Kbd */
export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex items-center whitespace-nowrap font-mono text-[10px] leading-none px-1.5 py-1 rounded-md border border-line bg-raised text-ink-400">{children}</kbd>;
}

/* ---------------------------------------------------------------- CountUp */
export function CountUp({ value, decimals = 0, className, suffix = "" }: { value: number; decimals?: number; className?: string; suffix?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toFixed(decimals) + suffix);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { mv.set(value); return; }
    const c = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [value, inView, reduce, mv]);
  return <motion.span ref={ref} className={cn("tabular", className)}>{text}</motion.span>;
}

/* ------------------------------------------------------------------- Ring */
export function Ring({ value, size = 96, stroke = 10, tone = "lagoon", label }: { value: number; size?: number; stroke?: number; tone?: Tone; label?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sunk)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TONES[tone].hex} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{label}</div>
    </div>
  );
}

/* -------------------------------------------------------------- Sparkline */
export function Sparkline({ points, width = 220, height = 56, tone = "lagoon" }: { points: number[]; width?: number; height?: number; tone?: Tone }) {
  if (points.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...points), min = Math.min(...points);
  const span = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * (width - 8) + 4);
  const ys = points.map((p) => height - 6 - ((p - min) / span) * (height - 12));
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} aria-hidden>
      <motion.path d={d} fill="none" stroke={TONES[tone].hex} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={4.5} fill={TONES[tone].hex} />
    </svg>
  );
}

/* ------------------------------------------------------------------- Tabs */
export function Tabs<T extends string>({ value, onChange, items, id }: { value: T; onChange: (v: T) => void; items: Array<{ id: T; label: React.ReactNode }>; id: string }) {
  return (
    <div role="tablist" className="inline-flex p-1 rounded-xl bg-sunk border border-line gap-0.5">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button key={it.id} role="tab" aria-selected={active} onClick={() => onChange(it.id)}
            className={cn("relative px-3.5 py-1.5 text-[13px] font-semibold rounded-lg cursor-pointer transition-colors", active ? "text-ink-900" : "text-ink-600 hover:text-ink-900")}>
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-lg bg-raised shadow-card" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
            <span className="relative z-10 flex items-center gap-1.5">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- Drawer */
export function Drawer({ open, onClose, title, eyebrow, children, footer, width = 460 }: {
  open: boolean; onClose: () => void; title: React.ReactNode; eyebrow?: string; children: React.ReactNode; footer?: React.ReactNode; width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Details"}
            className="fixed right-0 top-0 bottom-0 z-50 bg-raised border-l border-line shadow-pop flex flex-col max-w-full"
            style={{ width }}
            initial={{ x: width }} animate={{ x: 0 }} exit={{ x: width }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
          >
            <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-line">
              <div className="min-w-0">
                {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
                <h2 className="font-display text-2xl font-semibold leading-tight mt-1">{title}</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-ink-600 hover:bg-sunk cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-line bg-paper/60">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------------------------------------------- Seal */
/** The validator seal: the one trust signal that appears everywhere. */
export function Seal({ hard, soft, loading }: { hard: number | null | undefined; soft?: number | null; loading?: boolean }) {
  const none = hard === null || hard === undefined;
  const ok = !none && hard === 0;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full pl-1.5 pr-3.5 py-1.5 text-[12.5px] font-semibold",
        loading || none ? "bg-sunk text-ink-600" : ok ? "bg-mangrove-50 text-mangrove-600" : "bg-sunrise-50 text-sunrise-600"
      )}
      title="Checked by the official validator before anything is saved"
    >
      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center", loading || none ? "bg-line-strong/60" : ok ? "bg-mangrove-500 seal-pulse" : "bg-sunrise-500")}>
        {ok ? (
          <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <motion.path d="M2.5 6.4 5 8.8 9.6 3.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
          </motion.svg>
        ) : (
          <span className="text-[10px] text-white font-bold">{none ? "·" : "!"}</span>
        )}
      </span>
      {loading || none ? "No timetable yet" : ok ? `0 hard violations${soft != null ? `  ·  soft ${soft}` : ""}` : `${hard} hard violation${hard === 1 ? "" : "s"}`}
    </div>
  );
}

/* ---------------------------------------------------------------- Banner */
export function Banner({ tone = "lagoon", children, onClose }: { tone?: Tone; children: React.ReactNode; onClose?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-xl px-4 py-3 text-sm flex items-start gap-3", TONES[tone].soft, TONES[tone].text)} role="status">
      <div className="flex-1">{children}</div>
      {onClose && <button onClick={onClose} aria-label="Dismiss" className="opacity-70 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>}
    </motion.div>
  );
}

/* ----------------------------------------------------------- Stepper dot */
export function StepDot({ state, n }: { state: "done" | "active" | "todo"; n: number }) {
  return (
    <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-colors",
      state === "done" ? "bg-mangrove-500 text-raised" : state === "active" ? "bg-lagoon-700 text-raised ring-4 ring-lagoon-200" : "bg-sunk text-ink-400")}>
      {state === "done" ? <Check className="w-4 h-4" /> : n}
    </span>
  );
}

/* ---------------------------------------------------------- useLocalState */
export function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
