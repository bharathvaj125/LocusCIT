"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "amber" | "blue" | "danger" | "default" | "ghost";
  size?: "sm" | "md" | "lg";
  hotkey?: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export function TactileButton({
  children,
  className,
  variant = "default",
  size = "md",
  hotkey,
  icon,
  active = false,
  disabled,
  ...props
}: TactileButtonProps) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5 min-h-[28px]",
    md: "px-3 py-1.5 text-xs tracking-wide gap-2 min-h-[34px]",
    lg: "px-4 py-2.5 text-sm tracking-wide gap-2.5 min-h-[42px]",
  }[size];

  const variantClasses = {
    primary: cn(
      "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50 hover:border-emerald-500/60",
      active && "bg-emerald-500 text-black border-emerald-400 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.35)]",
    ),
    amber: cn(
      "bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/50 hover:border-amber-500/60",
      active && "bg-amber-500 text-black border-amber-400 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.35)]",
    ),
    blue: cn(
      "bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/50 hover:border-cyan-500/60",
      active && "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.35)]",
    ),
    danger: cn(
      "bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/50 hover:border-rose-500/60",
      active && "bg-rose-500 text-white border-rose-400 font-semibold shadow-[0_0_12px_rgba(244,63,94,0.35)]",
    ),
    default: cn(
      "bg-[#161B22] text-[#F3F4F6] border border-white/10 hover:bg-[#1E242D] hover:border-white/20",
      active && "bg-[#252D37] text-white border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.25)]",
    ),
    ghost: cn(
      "bg-transparent text-[#9CA3AF] border border-transparent hover:bg-white/5 hover:text-white",
      active && "bg-white/10 text-white border-white/15",
    ),
  }[variant];

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center font-mono select-none rounded-[4px] transition-all duration-100 ease-out",
        "tactile-bevel active:translate-y-[1px] disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed",
        sizeClasses,
        variantClasses,
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="truncate">{children}</span>
      {hotkey && (
        <kbd className="ml-1 px-1 py-0.2 text-[10px] font-mono rounded-[2px] bg-black/40 text-neutral-400 border border-white/10">
          {hotkey}
        </kbd>
      )}
    </button>
  );
}
