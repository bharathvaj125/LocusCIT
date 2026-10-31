"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface LiveStatusBadgeProps {
  status: "online" | "warning" | "alert" | "neutral" | "idle";
  label?: string;
  className?: string;
  pulse?: boolean;
}

export function LiveStatusBadge({
  status,
  label,
  className,
  pulse = true,
}: LiveStatusBadgeProps) {
  const configs = {
    online: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-950/40",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
      ping: "bg-emerald-400",
      defaultLabel: "SYS_ONLINE",
    },
    warning: {
      border: "border-amber-500/30",
      bg: "bg-amber-950/40",
      text: "text-amber-400",
      dot: "bg-amber-400",
      ping: "bg-amber-400",
      defaultLabel: "WARN_LOAD",
    },
    alert: {
      border: "border-rose-500/30",
      bg: "bg-rose-950/40",
      text: "text-rose-400",
      dot: "bg-rose-400",
      ping: "bg-rose-400",
      defaultLabel: "CLASH_DETECTED",
    },
    neutral: {
      border: "border-cyan-500/30",
      bg: "bg-cyan-950/40",
      text: "text-cyan-400",
      dot: "bg-cyan-400",
      ping: "bg-cyan-400",
      defaultLabel: "TELEMETRY_SYNC",
    },
    idle: {
      border: "border-white/10",
      bg: "bg-white/5",
      text: "text-neutral-400",
      dot: "bg-neutral-400",
      ping: "bg-neutral-400",
      defaultLabel: "STANDBY",
    },
  }[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] border font-mono text-[11px] uppercase tracking-wider select-none",
        configs.bg,
        configs.border,
        configs.text,
        className,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              configs.ping,
            )}
          />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", configs.dot)} />
      </span>
      <span className="font-medium">{label || configs.defaultLabel}</span>
    </div>
  );
}
