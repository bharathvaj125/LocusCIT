"use client";

import React from "react";
import { ScheduledSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  MapPin, 
  Users, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  GraduationCap, 
  Layers, 
  Activity, 
  Sliders
} from "lucide-react";

interface SessionCardProps {
  session: ScheduledSession;
  onClick: (session: ScheduledSession) => void;
  compact?: boolean;
}

export function SessionCard({ session, onClick, compact = false }: SessionCardProps) {
  const isLab = session.kind === "lab";
  const isElectiveBasket = Boolean(session.basket_slot);
  const isUnderutilized = session.is_underutilized;

  // Visual variants based on session kind
  const kindStyles = {
    lab: "bg-[#1E1435]/90 border-purple-500/40 hover:border-purple-400/80 hover:bg-[#251842] text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.15)]",
    tutorial: "bg-[#251C12]/90 border-amber-500/40 hover:border-amber-400/80 hover:bg-[#302315] text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.12)]",
    lecture: "bg-[#0E1B26]/90 border-cyan-500/30 hover:border-cyan-400/70 hover:bg-[#132433] text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.12)]",
  }[session.kind];

  return (
    <div
      onClick={() => onClick(session)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(session);
        }
      }}
      className={cn(
        "group relative flex flex-col justify-between p-2 rounded-[3px] border transition-all duration-150 cursor-pointer select-none text-left overflow-hidden",
        kindStyles,
        isUnderutilized && "border-amber-400/70 ring-1 ring-amber-400/30",
        isElectiveBasket && "ring-1 ring-cyan-400/40",
        session.duration > 1 && "h-full min-h-[72px]"
      )}
    >
      {/* Top micro status bar */}
      <div className="flex items-center justify-between gap-1 w-full text-[10px] font-mono leading-none mb-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold tracking-wider text-white">
            {session.course_id}
          </span>

          {/* Elective Basket Badge */}
          {isElectiveBasket && (
            <span className="px-1 py-0.5 rounded-[2px] bg-cyan-400/20 text-cyan-300 border border-cyan-400/50 font-bold uppercase tracking-tight text-[9px] flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
              {session.basket_slot}
            </span>
          )}

          {/* Multi-hour Lab badge */}
          {isLab && (
            <span className="px-1 py-0.5 rounded-[2px] bg-purple-500/25 text-purple-300 border border-purple-500/50 font-bold uppercase tracking-tight text-[9px]">
              {session.duration}H LAB
            </span>
          )}
        </div>

        {/* Underutilized indicator */}
        {isUnderutilized && (
          <span 
            className="flex items-center gap-0.5 text-amber-400 bg-amber-950/60 border border-amber-500/40 px-1 py-0.2 rounded-[2px] text-[9px] shrink-0 font-bold"
            title={`Underutilized venue: ${Math.round(session.capacity_ratio * 100)}% filled (<40%)`}
          >
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            &lt;40%
          </span>
        )}
      </div>

      {/* Main course title */}
      <div className="font-sans text-xs font-medium text-neutral-100 line-clamp-1 group-hover:text-cyan-300 transition-colors">
        {session.course_title}
      </div>

      {/* Footer telemetry */}
      <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/10 font-mono text-[10px] text-neutral-400 leading-tight">
        <div className="flex items-center gap-1 truncate">
          <MapPin className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
          <span className="text-white font-medium truncate">{session.room_id}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-400 truncate">{session.faculty_name.replace("Dr. ", "").replace("Prof. ", "")}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-neutral-400">
          <Users className="w-2.5 h-2.5 text-neutral-500" />
          <span>{session.size}</span>
        </div>
      </div>
    </div>
  );
}
