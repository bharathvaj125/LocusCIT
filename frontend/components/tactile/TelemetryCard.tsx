"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TelemetryCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  delta?: {
    text: string;
    type?: "positive" | "warning" | "negative" | "neutral";
  };
  icon?: React.ReactNode;
  status?: "online" | "warning" | "alert" | "neutral";
  className?: string;
  footer?: React.ReactNode;
}

export function TelemetryCard({
  label,
  value,
  subValue,
  delta,
  icon,
  status,
  className,
  footer,
}: TelemetryCardProps) {
  const statusBorder = {
    online: "border-emerald-500/30 group-hover:border-emerald-500/60",
    warning: "border-amber-500/30 group-hover:border-amber-500/60",
    alert: "border-rose-500/30 group-hover:border-rose-500/60",
    neutral: "border-cyan-500/30 group-hover:border-cyan-500/60",
  };

  const deltaColors = {
    positive: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
    warning: "text-amber-400 bg-amber-950/40 border-amber-500/30",
    negative: "text-rose-400 bg-rose-950/40 border-rose-500/30",
    neutral: "text-cyan-400 bg-cyan-950/40 border-cyan-500/30",
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between bg-[#0E1216] border border-white/10 rounded-[4px] p-3 transition-colors duration-150",
        "tactile-bevel hover:border-white/20",
        status && statusBorder[status],
        className,
      )}
    >
      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && <span className="text-[#9CA3AF] shrink-0">{icon}</span>}
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] truncate">
            {label}
          </span>
        </div>
        {delta && (
          <span
            className={cn(
              "font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] border",
              deltaColors[delta.type || "neutral"],
            )}
          >
            {delta.text}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-bold tracking-tight text-[#F3F4F6] tabular-nums">
          {value}
        </span>
        {subValue && (
          <span className="font-mono text-xs text-[#6B7280] truncate">
            {subValue}
          </span>
        )}
      </div>

      {/* Footer / Sub-readout */}
      {footer && (
        <div className="mt-2 pt-2 border-t border-white/5 font-mono text-[11px] text-[#9CA3AF]">
          {footer}
        </div>
      )}
    </div>
  );
}
