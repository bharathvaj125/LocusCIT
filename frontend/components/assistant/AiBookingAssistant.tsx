"use client";

import React, { useState } from "react";
import { RoleType, ParsedBookingDraft, DayOfWeek } from "@/lib/types";
import { parseNaturalLanguageBooking, submitBooking } from "@/lib/api";
import { ROOMS } from "@/lib/mockData";
import { TactileButton } from "@/components/tactile/TactileButton";
import { 
  Bot, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  MapPin, 
  Clock, 
  Users, 
  Sliders, 
  ShieldAlert,
  HelpCircle,
  FileText
} from "lucide-react";

interface AiBookingAssistantProps {
  currentRole: RoleType;
  onBookingSubmitted?: () => void;
}

const SAMPLE_QUERIES = [
  {
    label: "Hinglish Lab Request",
    text: "kal shaam 6 baje CS Lab chahiye for 40 students with projector and mic",
  },
  {
    label: "Dramatics Play (SH-1)",
    text: "Dramatics needs SH-1 Thursday 6 to 9 pm for 130 people with stage and pa system",
  },
  {
    label: "Guest Lecture (Morning)",
    text: "Prof. Sharma distinguished lecture on AI architecture Wednesday morning 10 AM LH-1",
  },
  {
    label: "Priority Abuse Attempt",
    text: "Dance Club declares institute event in Auditorium Friday 6 pm for 500 attendees",
  },
];

export function AiBookingAssistant({
  currentRole,
  onBookingSubmitted,
}: AiBookingAssistantProps) {
  const [inputText, setInputText] = useState("");
  const [draft, setDraft] = useState<ParsedBookingDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleParse = (queryText?: string) => {
    const textToParse = queryText || inputText;
    if (!textToParse.trim()) return;
    const parsed = parseNaturalLanguageBooking(textToParse, currentRole);
    setDraft(parsed);
    setSubmitSuccess(null);
  };

  const handleFieldChange = (field: keyof ParsedBookingDraft, value: any) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const handleSubmitFinal = async () => {
    if (!draft) return;
    setIsSubmitting(true);
    const res = await submitBooking({
      title: draft.title,
      requester: `${currentRole.toUpperCase()} Representative`,
      role: currentRole,
      requested_category: draft.requested_category,
      effective_category: draft.effective_category,
      attendance: draft.attendance,
      duration_periods: draft.duration_periods,
      day: draft.day,
      start_period: draft.start_period,
      end_period: draft.start_period + draft.duration_periods - 1,
      room_types: draft.room_types,
      needs: draft.features,
      requested_room: draft.requested_room || null,
      raw_text: draft.original_text,
    });

    setIsSubmitting(false);
    if (res.success) {
      setSubmitSuccess(`Booking request ${res.data.id} confirmed and queued into administrative review!`);
      if (onBookingSubmitted) onBookingSubmitted();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-[3px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                <Bot className="w-4 h-4" />
              </span>
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                NATURAL LANGUAGE BOOKING ASSISTANT (ENGLISH / HINGLISH)
              </h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-[2px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                DETERMINISTIC VALIDATION GUARD
              </span>
            </div>
            <p className="font-mono text-xs text-neutral-400 mt-1">
              Parses conversational requests into verified structured drafts. AI extracts intents; code deterministically enforces constraints.
            </p>
          </div>

          <div className="px-2.5 py-1 bg-[#12161C] border border-white/10 rounded-[3px] font-mono text-xs text-neutral-300">
            ACTIVE ROLE: <strong className="text-cyan-400 uppercase">{currentRole}</strong>
          </div>
        </div>

        {/* Quick-Test Prompts */}
        <div className="pt-2 border-t border-white/5 space-y-1.5 font-mono text-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
            QUICK TEST BENCH (CLICK TO LOAD &amp; PARSE):
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(sample.text);
                  handleParse(sample.text);
                }}
                className="px-2.5 py-1 bg-[#161B22] hover:bg-[#1E2530] text-neutral-300 hover:text-white border border-white/10 hover:border-cyan-500/40 rounded-[3px] text-left transition-colors cursor-pointer text-[11px]"
              >
                &bull; <strong className="text-cyan-300">{sample.label}</strong>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Box */}
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleParse();
              }
            }}
            placeholder="Type in English or Hinglish (e.g. 'kal shaam 6 baje CS Lab chahiye for 40 students with projector')..."
            className="flex-1 px-3 py-2 bg-[#12161C] border border-white/15 rounded text-white text-xs font-mono focus:outline-none focus:border-cyan-400 placeholder-neutral-500"
          />
          <TactileButton
            size="md"
            variant="primary"
            onClick={() => handleParse()}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            PARSE INTENT
          </TactileButton>
        </div>
      </div>

      {/* Structured Editable Draft Form */}
      {draft && (
        <div className="p-4 bg-[#0E1216] border border-cyan-500/40 rounded-[4px] space-y-4 font-mono text-xs animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase text-sm">
              <Sliders className="w-4 h-4 text-cyan-400" />
              EXTRACTED STRUCTURED BOOKING DRAFT (EDITABLE)
            </span>
            <span className="text-neutral-400 text-[10px]">
              Ready for Deterministic Verification
            </span>
          </div>

          {/* Ambiguity & Priority Warnings */}
          {draft.priority_capped && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-500/50 rounded text-rose-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Role Priority Cap Enforced:</strong> User role <span className="uppercase font-bold underline">{currentRole}</span> cannot claim category <span className="font-bold">"{draft.requested_category}"</span>. Automatically adjusted to effective priority: <span className="font-bold text-white">"{draft.effective_category}"</span>.
              </div>
            </div>
          )}

          {draft.ambiguities.length > 0 && (
            <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                Detected Ambiguities &amp; Inferences:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                {draft.ambiguities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.assumptions.length > 0 && (
            <div className="p-2 bg-[#12161C] border border-white/5 rounded text-neutral-300 text-[11px] space-y-0.5">
              <span className="text-cyan-400 font-bold block">Applied Normalizations:</span>
              {draft.assumptions.map((ass, i) => (
                <div key={i} className="text-neutral-400">&bull; {ass}</div>
              ))}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">EVENT TITLE</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#12161C] border border-white/15 rounded text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">HEADCOUNT ATTENDANCE</label>
              <input
                type="number"
                value={draft.attendance}
                onChange={(e) => handleFieldChange("attendance", Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#12161C] border border-white/15 rounded text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">REQUESTED ROOM WISH</label>
              <select
                value={draft.requested_room || "AUD"}
                onChange={(e) => handleFieldChange("requested_room", e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#12161C] border border-white/15 rounded text-white focus:outline-none focus:border-cyan-400"
              >
                {ROOMS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} - {r.name} ({r.capacity} seats)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">DAY OF WEEK</label>
              <select
                value={draft.day}
                onChange={(e) => handleFieldChange("day", e.target.value as DayOfWeek)}
                className="w-full px-2.5 py-1.5 bg-[#12161C] border border-white/15 rounded text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="MON">MON</option>
                <option value="TUE">TUE</option>
                <option value="WED">WED</option>
                <option value="THU">THU</option>
                <option value="FRI">FRI</option>
                <option value="SAT">SAT</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">START PERIOD</label>
              <select
                value={draft.start_period}
                onChange={(e) => handleFieldChange("start_period", Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#12161C] border border-white/15 rounded text-white focus:outline-none focus:border-cyan-400"
              >
                <option value={10}>P10 (18:00 - 19:00)</option>
                <option value={11}>P11 (19:00 - 20:00)</option>
                <option value={12}>P12 (20:00 - 21:00)</option>
                <option value={2}>P2 (09:00 - 10:00)</option>
                <option value={6}>P6 (14:00 - 15:00)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">DURATION (HOURS)</label>
              <input
                type="number"
                min={1}
                max={4}
                value={draft.duration_periods}
                onChange={(e) => handleFieldChange("duration_periods", Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#12161C] border border-white/15 rounded text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Submission and Success Feedback */}
          {submitSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-neutral-400 text-[11px]">
              Effective Category: <strong className="text-cyan-400">{draft.effective_category}</strong>
            </span>

            <div className="flex gap-2">
              <TactileButton size="sm" variant="ghost" onClick={() => setDraft(null)}>
                RESET DRAFT
              </TactileButton>
              <TactileButton
                size="sm"
                variant="primary"
                disabled={isSubmitting}
                onClick={handleSubmitFinal}
                icon={<Check className="w-3.5 h-3.5" />}
              >
                {isSubmitting ? "TRANSMITTING..." : "CONFIRM & SUBMIT TO QUEUE"}
              </TactileButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
