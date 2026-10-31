"use client";

import React, { useState, useMemo } from "react";
import { ExamSession, DayOfWeek } from "@/lib/types";
import { EXAMS_DATA, STUDENT_GROUPS } from "@/lib/mockData";
import { TactileButton } from "@/components/tactile/TactileButton";
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Filter, 
  Layers, 
  AlertTriangle 
} from "lucide-react";

interface ExamsDeckProps {
  exams?: ExamSession[];
}

const EXAM_DAYS: { id: DayOfWeek; label: string }[] = [
  { id: "MON", label: "MON (Day 1)" },
  { id: "TUE", label: "TUE (Day 2)" },
  { id: "WED", label: "WED (Day 3)" },
  { id: "THU", label: "THU (Day 4)" },
  { id: "FRI", label: "FRI (Day 5)" },
  { id: "SAT", label: "SAT (Day 6)" },
];

export function ExamsDeck({ exams = EXAMS_DATA }: ExamsDeckProps) {
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [selectedSlot, setSelectedSlot] = useState<"all" | "AM" | "PM">("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inspectedExam, setInspectedExam] = useState<ExamSession | null>(null);

  // Filter exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (selectedDay !== "all" && e.day !== selectedDay) return false;
      if (selectedSlot !== "all" && e.slot !== selectedSlot) return false;
      if (selectedGroup !== "all" && !e.groups.includes(selectedGroup)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.course_title.toLowerCase().includes(q);
        const matchId = e.course_id.toLowerCase().includes(q);
        const matchExamId = e.exam_id.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchExamId) return false;
      }
      return true;
    });
  }, [exams, selectedDay, selectedSlot, selectedGroup, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Exam Telemetry Stats */}
      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-[3px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                <GraduationCap className="w-4 h-4" />
              </span>
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                MIDSEM EXAMINATION MATRIX // 41 PAPERS
              </h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-[2px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                CAPACITY HALVED (0.50x)
              </span>
            </div>
            <p className="font-mono text-xs text-neutral-400 mt-1">
              Examination halls configured with 1-seat spacing anti-cheat protocol. Monday through Saturday.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 bg-[#12161C] border border-white/10 rounded-[3px] text-neutral-300">
              AM SLOT: <strong className="text-cyan-400">09:30 - 11:30</strong>
            </span>
            <span className="px-2.5 py-1 bg-[#12161C] border border-white/10 rounded-[3px] text-neutral-300">
              PM SLOT: <strong className="text-amber-400">14:00 - 16:00</strong>
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search course or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 w-44"
              />
            </div>

            {/* Day Selector */}
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-2.5 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">ALL DAYS (MON-SAT)</option>
              {EXAM_DAYS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>

            {/* Slot Selector */}
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value as any)}
              className="px-2.5 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">ALL SLOTS (AM &amp; PM)</option>
              <option value="AM">AM (09:30 - 11:30)</option>
              <option value="PM">PM (14:00 - 16:00)</option>
            </select>

            {/* Student Group Selector */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2.5 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[180px]"
            >
              <option value="all">ALL STUDENT GROUPS</option>
              {STUDENT_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.id} ({g.size} Students)
                </option>
              ))}
            </select>
          </div>

          <span className="text-neutral-400">
            SHOWING <strong className="text-white">{filteredExams.length}</strong> OF {exams.length} PAPERS
          </span>
        </div>
      </div>

      {/* Exam Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredExams.map((exam) => {
          const seatDeficit = exam.total_effective_seats < exam.candidate_count;
          const isInspected = inspectedExam?.exam_id === exam.exam_id;

          return (
            <div
              key={exam.exam_id}
              onClick={() => setInspectedExam(exam)}
              className={`p-3 bg-[#0E1216] border rounded-[4px] cursor-pointer transition-all hover:bg-[#13171E] ${
                isInspected
                  ? "border-emerald-400 ring-1 ring-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white tracking-wider">
                    {exam.course_id}
                  </span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-white/10 text-neutral-300">
                    {exam.department}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                    {exam.day} // {exam.slot}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-sans text-xs font-semibold text-neutral-100 line-clamp-1 mb-2">
                {exam.course_title}
              </h3>

              {/* Multi-Room Allocation Badges */}
              <div className="space-y-1.5 mb-2 font-mono text-[11px]">
                <div className="text-neutral-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    Allocated Halls ({exam.rooms.length}):
                  </span>
                  <span className="text-white font-medium">
                    {exam.total_effective_seats} Halved Seats
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {exam.room_details.map((r) => (
                    <span
                      key={r.id}
                      className="px-1.5 py-0.5 rounded-[2px] bg-[#161B22] border border-white/10 text-neutral-300 text-[10px]"
                      title={`${r.name}: Capacity ${r.capacity} -> Effective ${r.effective_seats}`}
                    >
                      {r.id} <strong className="text-emerald-400">({r.effective_seats})</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer Capacity Telemetry */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between font-mono text-[10px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-neutral-500" />
                  Candidates: <strong className="text-white">{exam.candidate_count}</strong>
                </span>

                <span className={`font-semibold ${
                  seatDeficit ? "text-rose-400" : "text-emerald-400"
                }`}>
                  {seatDeficit ? "CAPACITY DEFICIT" : "SEATS COMPLIANT"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exam Seating Inspector Flyout */}
      {inspectedExam && (
        <div className="p-4 bg-[#12161C] border border-emerald-500/40 rounded-[4px] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="font-bold text-white">
                EXAMINATION HALL SPECIFICATION // {inspectedExam.exam_id} ({inspectedExam.course_id})
              </span>
            </div>
            <button
              onClick={() => setInspectedExam(null)}
              className="text-neutral-400 hover:text-white text-xs underline cursor-pointer"
            >
              CLOSE SPEC
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2.5 bg-[#161B22] border border-white/10 rounded-[3px]">
              <span className="text-neutral-400 block text-[10px]">TIME WINDOW</span>
              <span className="text-white font-bold text-xs mt-0.5 block">
                {inspectedExam.day} {inspectedExam.slot} ({inspectedExam.time_range})
              </span>
              <span className="text-neutral-400 text-[10px]">Duration: 2.0 Hours</span>
            </div>

            <div className="p-2.5 bg-[#161B22] border border-white/10 rounded-[3px]">
              <span className="text-neutral-400 block text-[10px]">REGISTERED CANDIDATES</span>
              <span className="text-white font-bold text-xs mt-0.5 block">
                {inspectedExam.candidate_count} Students
              </span>
              <span className="text-neutral-400 text-[10px]">
                Groups: {inspectedExam.groups.join(", ")}
              </span>
            </div>

            <div className="p-2.5 bg-[#161B22] border border-white/10 rounded-[3px]">
              <span className="text-neutral-400 block text-[10px]">EFFECTIVE SEATING MARGIN</span>
              <span className="text-emerald-400 font-bold text-xs mt-0.5 block">
                {inspectedExam.total_effective_seats} Seats Allocated
              </span>
              <span className="text-neutral-400 text-[10px]">
                Margin: +{inspectedExam.total_effective_seats - inspectedExam.candidate_count} Excess Seats
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
