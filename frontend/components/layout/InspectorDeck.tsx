"use client";

import React, { useEffect, useState } from "react";
import { TactileButton } from "@/components/tactile/TactileButton";
import { LiveStatusBadge } from "@/components/tactile/LiveStatusBadge";
import { TelemetryCard } from "@/components/tactile/TelemetryCard";
import { Activity, Send, Sparkles, Clock, AlertTriangle, CheckSquare } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { fetchAudit } from "@/lib/api";

interface InspectorDeckProps {
  onOpenAssistant: (text: string) => void;
  onOpenApprovals: () => void;
}

export function InspectorDeck({ onOpenAssistant, onOpenApprovals }: InspectorDeckProps) {
  const { dashboard: d, user, revision, error } = useApp();
  const [nlPrompt, setNlPrompt] = useState("");
  const [audit, setAudit] = useState<Array<{ at: number; actor: string; action: string; detail: string }>>([]);

  useEffect(() => {
    if (user.role !== "admin") return;
    fetchAudit().then(setAudit).catch(() => setAudit([]));
  }, [user.role, revision]);

  const scheduled = d && d.sessions_scheduled > 0;

  return (
    <aside className="w-full lg:w-[360px] xl:w-[400px] bg-[#0E1216] border-l border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#080A0C]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">Live status</span>
        </div>
        <LiveStatusBadge status={error ? "alert" : d ? "online" : "idle"} label={error ? "SERVER ERROR" : d ? "CONNECTED" : "LOADING"} />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {error && <div className="p-2 bg-rose-950/50 border border-rose-500/40 rounded font-mono text-[11px] text-rose-200">{error}</div>}

        <div className="grid grid-cols-2 gap-2">
          <TelemetryCard
            label="HARD VIOLATIONS"
            value={scheduled ? String(d!.hard_violation_count ?? "-") : "-"}
            subValue="OFFICIAL VALIDATOR"
            status={!scheduled ? "neutral" : d!.hard_violation_count === 0 ? "online" : "alert"}
          />
          <TelemetryCard
            label="SOFT PENALTY"
            value={scheduled ? String(d!.soft_total ?? "-") : "-"}
            subValue="S1-S6"
            status="neutral"
          />
          <TelemetryCard
            label="SPECTRA DECISIONS"
            value={d ? `${d.booking_decisions}/${d.booking_requests}` : "-"}
            subValue={d?.booking_score != null ? `SCORE ${d.booking_score}/${d.booking_score_max}` : "NOT EVALUATED"}
            status={d && d.booking_decisions === d.booking_requests ? "online" : "neutral"}
          />
          <TelemetryCard
            label="ROOM UTILISATION"
            value={d ? `${d.utilisation.average_pct}%` : "-"}
            subValue="AVG TEACHING HOURS"
            status="neutral"
          />
        </div>

        {d && d.pending_approvals > 0 && (
          <button onClick={onOpenApprovals}
            className="w-full text-left p-2.5 bg-amber-950/30 border border-amber-500/40 rounded-[4px] font-mono text-[11px] text-amber-200 hover:bg-amber-950/50 cursor-pointer">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <CheckSquare className="w-3.5 h-3.5" /> {d.pending_approvals} pending approval{d.pending_approvals > 1 ? "s" : ""}
            </span>
            {d.pending_proposals.map((p) => (
              <span key={p.proposal_id} className="block text-amber-200/80">
                • {p.type} {p.proposal_id} ({p.moved_count ?? "?"} moves)
              </span>
            ))}
            {d.pending_bookings.slice(0, 4).map((b) => (
              <span key={b.id} className="block text-amber-200/80">• {b.id}: {b.title}</span>
            ))}
          </button>
        )}

        {d && d.conflicts.length > 0 && (
          <div className="p-2.5 bg-rose-950/30 border border-rose-500/40 rounded-[4px] font-mono text-[11px] space-y-1">
            <span className="flex items-center gap-1.5 font-bold text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5" /> Current conflicts
            </span>
            {d.conflicts.slice(0, 8).map((c, i) => (
              <span key={i} className="block text-rose-200/90">[{c.rule}] {c.detail}</span>
            ))}
          </div>
        )}

        <div className="bg-[#161B22] border border-white/10 rounded-[4px] p-3 space-y-2">
          <span className="font-mono text-[11px] font-bold uppercase text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Ask in English / Hinglish
          </span>
          <p className="text-xs text-[#9CA3AF]">
            Type a venue request; it opens as an editable draft in the AI Assistant. The rules engine decides, not the AI.
          </p>
          <textarea
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            placeholder='e.g. "seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye"'
            className="w-full bg-[#080A0C] border border-white/10 rounded-[4px] p-2.5 text-xs text-white placeholder-[#6B7280] resize-none focus:outline-none focus:border-cyan-500/80"
            rows={2}
          />
          <div className="flex justify-end">
            <TactileButton size="sm" variant="amber" disabled={!nlPrompt.trim()} icon={<Send className="w-3 h-3" />}
              onClick={() => onOpenAssistant(nlPrompt)}>
              OPEN DRAFT
            </TactileButton>
          </div>
        </div>

        {user.role === "admin" && (
          <div className="bg-[#161B22] border border-white/10 rounded-[4px] p-3 space-y-2">
            <span className="font-mono text-[11px] font-bold uppercase text-[#9CA3AF] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Audit log (latest)
            </span>
            <div className="space-y-1 font-mono text-[11px] max-h-64 overflow-y-auto">
              {audit.length === 0 && <span className="text-neutral-500">No events yet.</span>}
              {audit.map((a, i) => (
                <div key={i} className="p-1.5 bg-[#080A0C] border-l-2 border-cyan-500/60 text-neutral-300 rounded-r-[2px]">
                  <span className="text-[#6B7280]">
                    [{new Date(a.at * 1000).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" })}]
                  </span>{" "}
                  <span className="text-cyan-300">{a.actor}</span> {a.action.replace(/_/g, " ")}
                  {a.detail && a.detail !== "-" && <span className="text-neutral-500"> {a.detail.slice(0, 60)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#080A0C] border border-white/5 rounded-[4px] p-2.5 text-xs">
          <span className="font-mono text-[10px] text-[#9CA3AF] uppercase font-bold block mb-1">Booking priority (highest first)</span>
          <ol className="font-mono text-[10px] text-[#6B7280] space-y-0.5 list-decimal list-inside">
            <li><strong className="text-white">Exams</strong></li>
            <li><strong className="text-white">Regular classes</strong></li>
            <li><strong className="text-white">Institute events</strong> (only Admin can claim)</li>
            <li><strong className="text-white">Guest lectures</strong></li>
            <li><strong className="text-white">Department events</strong></li>
            <li><strong className="text-white">Club events</strong></li>
          </ol>
          <p className="font-mono text-[10px] text-[#6B7280] mt-1">Ties go to the earlier request. A role cannot raise its own category.</p>
        </div>
      </div>
    </aside>
  );
}
