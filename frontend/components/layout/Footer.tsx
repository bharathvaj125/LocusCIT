"use client";

import React, { useEffect, useState } from "react";
import { Activity, Database, Server } from "lucide-react";
import { API_BASE, lastLatency } from "@/lib/api";

interface FooterProps {
  revision: string;
  activeFilterSummary: string;
}

export function Footer({ revision, activeFilterSummary }: FooterProps) {
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLatency(lastLatency()), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <footer className="w-full bg-[#080A0C] border-t border-white/10 px-3 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono text-[#9CA3AF] select-none shrink-0 z-40 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-cyan-300 font-semibold">{revision}</span>
        </div>
        <span className="hidden sm:inline text-white/20">|</span>
        <span className="hidden sm:inline text-[11px] text-white/80 truncate">{activeFilterSummary}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden md:flex items-center gap-1 text-[10px] text-[#6B7280]" title="Backend API">
          <Server className="w-3 h-3" /> {API_BASE.replace(/^https?:\/\//, "")}
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-[2px] border border-emerald-500/20"
          title="Round trip of the last API request">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>{latency ? `${latency} ms last request` : "measuring..."}</span>
        </div>
      </div>
    </footer>
  );
}
