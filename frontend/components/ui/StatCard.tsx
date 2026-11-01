"use client";

import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/ui/primitives";
import { TONES, Tone } from "@/lib/dept";
import { cn } from "@/lib/utils";

/**
 * A number with a meaning: counts up when it appears, lifts and follows the pointer with a soft glow on hover,
 * shows a progress bar when it is part of a whole, and (when `onClick` is given) filters the list below it.
 * Plain text stays readable without any of the motion.
 */
export function StatCard({ label, value, suffix = "", decimals = 0, hint, icon, tone = "lagoon", progress, onClick, active, index = 0, valueText, className }: {
  label: string;
  value?: number | null;
  suffix?: string;
  decimals?: number;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  progress?: number;          // 0..1, drawn as a bar that fills when the card appears
  onClick?: () => void;
  active?: boolean;
  index?: number;
  valueText?: string;         // shown instead of the number (for example "-" before anything exists)
  className?: string;
}) {
  const t = TONES[tone];
  const calm = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(0);
  const glow = useMotionTemplate`radial-gradient(220px circle at ${mx}% ${my}%, ${t.hex}2e, transparent 70%)`;
  const Tag = (onClick ? motion.button : motion.div) as React.ElementType;
  const move = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };
  return (
    <Tag
      ref={ref}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      onPointerMove={calm ? undefined : move}
      aria-pressed={onClick ? !!active : undefined}
      initial={calm ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: calm ? 0 : Math.min(index, 8) * 0.05 }}
      whileHover={calm ? undefined : { y: -3 }}
      whileTap={onClick && !calm ? { scale: 0.98 } : undefined}
      className={cn(
        "group relative overflow-hidden text-left rounded-2xl bg-raised border p-4 shadow-card transition-colors",
        onClick ? "cursor-pointer" : "cursor-default",
        active ? "border-lagoon-500 ring-2 ring-lagoon-500/30" : "border-line hover:border-line-strong",
        className,
      )}
    >
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: glow }} />
      <span aria-hidden className={cn("absolute left-0 top-0 h-full w-[3px]", t.bar)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">{label}</p>
          <p className={cn("font-display text-4xl font-semibold mt-1 leading-none tabular", t.text)}>
            {valueText ?? (value == null ? "-" : <CountUp value={value} decimals={decimals} suffix={suffix} />)}
          </p>
        </div>
        {icon && <span className={cn("shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]", t.soft, t.text)}>{icon}</span>}
      </div>
      {progress !== undefined && (
        <div className="relative mt-3 h-1.5 rounded-full bg-sunk overflow-hidden" role="presentation">
          <motion.div className={cn("h-full rounded-full", t.bar)} initial={calm ? false : { width: 0 }} animate={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 + Math.min(index, 8) * 0.05 }} />
        </div>
      )}
      {hint && <p className="relative text-xs text-ink-600 mt-2">{hint}</p>}
    </Tag>
  );
}
