"use client";

import React from "react";
import { Terminal, Activity, Key, Database } from "lucide-react";

interface FooterProps {
  revision?: string;
  latencyMs?: number;
  activeFilterSummary?: string;
}

export function Footer({
  revision = "CIT-REV-4029.0",
  latencyMs = 12,
  activeFilterSummary = "ALL_BRANCHES // Y1-Y3 // 27_VENUES",
}: FooterProps) {
  return (
    <footer className="w-full bg-[#080A0C] border-t border-white/10 px-3 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono text-[#9CA3AF] select-none shrink-0 z-40">
      {/* Left: Active Filters & DB State */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[#F3F4F6]">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-cyan-300 font-semibold">{revision}</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
          <span className="text-[#6B7280]">FILTER:</span>
          <span className="text-white/80">{activeFilterSummary}</span>
        </div>
      </div>

      {/* Right: Latency & Hotkeys */}
      <div className="flex items-center gap-4">
        {/* Hotkey Guide */}
        <div className="hidden md:flex items-center gap-2 text-[10px] text-[#6B7280]">
          <span className="flex items-center gap-1">
            <Key className="w-3 h-3 text-amber-400/80" /> HOTKEYS:
          </span>
          <span className="bg-white/5 px-1 py-0.2 rounded border border-white/10 text-neutral-300">
            [1..4] Presets
          </span>
          <span className="bg-white/5 px-1 py-0.2 rounded border border-white/10 text-neutral-300">
            [ESC] Reset
          </span>
        </div>

        {/* Telemetry Latency */}
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-[2px] border border-emerald-500/20">
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>{latencyMs}ms LATENCY</span>
        </div>
      </div>
    </footer>
  );
}
