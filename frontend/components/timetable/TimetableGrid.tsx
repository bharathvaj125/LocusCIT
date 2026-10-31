"use client";

import React, { useState, useMemo } from "react";
import { 
  ScheduledSession, 
  DayOfWeek, 
  Room, 
  Faculty, 
  StudentGroup 
} from "@/lib/types";
import { 
  STUDENT_GROUPS, 
  FACULTY_MEMBERS, 
  ROOMS 
} from "@/lib/mockData";
import { SessionCard } from "./SessionCard";
import { SessionInspectModal } from "./SessionInspectModal";
import { TactileButton } from "@/components/tactile/TactileButton";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  GraduationCap, 
  Layers, 
  AlertTriangle, 
  Moon, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Accessibility, 
  Search, 
  Sparkles,
  Info
} from "lucide-react";

interface TimetableGridProps {
  sessions: ScheduledSession[];
  activePivot: "group" | "faculty" | "room";
  onPivotChange: (pivot: "group" | "faculty" | "room") => void;
  selectedId: string;
  onSelectId: (id: string) => void;
  showEvening: boolean;
  onToggleEvening: () => void;
}

const DAYS: { id: DayOfWeek; label: string; index: string }[] = [
  { id: "MON", label: "MONDAY", index: "DAY 01" },
  { id: "TUE", label: "TUESDAY", index: "DAY 02" },
  { id: "WED", label: "WEDNESDAY", index: "DAY 03" },
  { id: "THU", label: "THURSDAY", index: "DAY 04" },
  { id: "FRI", label: "FRIDAY", index: "DAY 05" },
];

export function TimetableGrid({
  sessions,
  activePivot,
  onPivotChange,
  selectedId,
  onSelectId,
  showEvening,
  onToggleEvening,
}: TimetableGridProps) {
  const [inspectedSession, setInspectedSession] = useState<ScheduledSession | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quick lookup maps
  const roomMap = useMemo(() => new Map(ROOMS.map(r => [r.id, r])), []);
  const facMap = useMemo(() => new Map(FACULTY_MEMBERS.map(f => [f.id, f])), []);
  const groupMap = useMemo(() => new Map(STUDENT_GROUPS.map(g => [g.id, g])), []);

  // Filter current entity object
  const currentGroup = activePivot === "group" ? groupMap.get(selectedId) : undefined;
  const currentFaculty = activePivot === "faculty" ? facMap.get(selectedId) : undefined;
  const currentRoom = activePivot === "room" ? roomMap.get(selectedId) : undefined;

  // Filter sessions matching current pivot selection
  const relevantSessions = useMemo(() => {
    return sessions.filter(s => {
      if (activePivot === "group") {
        return s.groups.includes(selectedId);
      }
      if (activePivot === "faculty") {
        return s.faculty_id === selectedId;
      }
      if (activePivot === "room") {
        return s.room_id === selectedId;
      }
      return true;
    });
  }, [sessions, activePivot, selectedId]);

  // Compute daily faculty hours load if pivoted by faculty
  const dailyFacultyLoad = useMemo(() => {
    const loads: Record<DayOfWeek, number> = { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0 };
    if (activePivot === "faculty") {
      relevantSessions.forEach(s => {
        loads[s.day] = (loads[s.day] || 0) + s.duration;
      });
    }
    return loads;
  }, [relevantSessions, activePivot]);

  // Filterable list of entities based on search
  const filteredEntities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (activePivot === "group") {
      return STUDENT_GROUPS.filter(g => 
        !query || g.id.toLowerCase().includes(query) || g.name.toLowerCase().includes(query)
      );
    }
    if (activePivot === "faculty") {
      return FACULTY_MEMBERS.filter(f => 
        !query || f.id.toLowerCase().includes(query) || f.name.toLowerCase().includes(query) || f.department.toLowerCase().includes(query)
      );
    }
    if (activePivot === "room") {
      return ROOMS.filter(r => 
        !query || r.id.toLowerCase().includes(query) || r.name.toLowerCase().includes(query) || r.type.toLowerCase().includes(query)
      );
    }
    return [];
  }, [activePivot, searchQuery]);

  // Cycle to prev / next entity
  const handleCycle = (direction: -1 | 1) => {
    const currentList = filteredEntities;
    if (currentList.length === 0) return;
    const currentIndex = currentList.findIndex(e => e.id === selectedId);
    if (currentIndex === -1) {
      onSelectId(currentList[0].id);
      return;
    }
    const nextIndex = (currentIndex + direction + currentList.length) % currentList.length;
    onSelectId(currentList[nextIndex].id);
  };

  // Build grid data for a specific day
  const getDayGrid = (day: DayOfWeek) => {
    const daySessions = relevantSessions.filter(s => s.day === day);
    
    // Sort by start_period
    daySessions.sort((a, b) => a.start_period - b.start_period);

    // Morning segment (P1 - P5)
    const morningSlots: Array<{ period: number; session?: ScheduledSession; span: number; isCovered?: boolean }> = [];
    const morningOccupiedPeriods = new Set<number>();

    // Register multi-hour session coverage
    daySessions.forEach(s => {
      if (s.start_period <= 5) {
        for (let p = s.start_period + 1; p <= Math.min(5, s.end_period); p++) {
          morningOccupiedPeriods.add(p);
        }
      }
    });

    for (let p = 1; p <= 5; p++) {
      if (morningOccupiedPeriods.has(p)) {
        continue; // covered by multi-period session
      }
      const s = daySessions.find(session => session.start_period === p);
      if (s) {
        morningSlots.push({ period: p, session: s, span: Math.min(5 - p + 1, s.duration) });
      } else {
        morningSlots.push({ period: p, span: 1 });
      }
    }

    // Afternoon segment (P6 - P9)
    const afternoonSlots: Array<{ period: number; session?: ScheduledSession; span: number; isCovered?: boolean }> = [];
    const afternoonOccupiedPeriods = new Set<number>();

    daySessions.forEach(s => {
      if (s.start_period >= 6 && s.start_period <= 9) {
        for (let p = s.start_period + 1; p <= Math.min(9, s.end_period); p++) {
          afternoonOccupiedPeriods.add(p);
        }
      }
    });

    for (let p = 6; p <= 9; p++) {
      if (afternoonOccupiedPeriods.has(p)) {
        continue;
      }
      const s = daySessions.find(session => session.start_period === p);
      if (s) {
        afternoonSlots.push({ period: p, session: s, span: Math.min(9 - p + 1, s.duration) });
      } else {
        afternoonSlots.push({ period: p, span: 1 });
      }
    }

    // Evening segment (P10 - P13)
    const eveningSlots: Array<{ period: number; session?: ScheduledSession; span: number }> = [];
    if (showEvening) {
      for (let p = 10; p <= 13; p++) {
        const s = daySessions.find(session => session.start_period === p);
        eveningSlots.push({ period: p, session: s, span: 1 });
      }
    }

    return { morningSlots, afternoonSlots, eveningSlots };
  };

  return (
    <div className="space-y-3">
      {/* Dynamic Multi-Pivot Header Bar */}
      <div className="p-3 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3 shadow-md">
        
        {/* Top Controls: Pivot Switcher + Cycle + Evening Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Pivot Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#161B22] border border-white/10 rounded-[3px]">
            <span className="font-mono text-[10px] uppercase text-neutral-400 px-2 flex items-center gap-1 font-bold">
              <Filter className="w-3 h-3 text-cyan-400" /> PIVOT:
            </span>

            <TactileButton
              size="sm"
              variant={activePivot === "group" ? "primary" : "ghost"}
              active={activePivot === "group"}
              onClick={() => {
                onPivotChange("group");
                onSelectId("Y1-A");
              }}
              icon={<Users className="w-3.5 h-3.5" />}
            >
              STUDENT GROUP ({STUDENT_GROUPS.length})
            </TactileButton>

            <TactileButton
              size="sm"
              variant={activePivot === "faculty" ? "amber" : "ghost"}
              active={activePivot === "faculty"}
              onClick={() => {
                onPivotChange("faculty");
                onSelectId("F01");
              }}
              icon={<GraduationCap className="w-3.5 h-3.5" />}
            >
              FACULTY LOAD ({FACULTY_MEMBERS.length})
            </TactileButton>

            <TactileButton
              size="sm"
              variant={activePivot === "room" ? "blue" : "ghost"}
              active={activePivot === "room"}
              onClick={() => {
                onPivotChange("room");
                onSelectId("LH-1");
              }}
              icon={<MapPin className="w-3.5 h-3.5" />}
            >
              VENUE & ROOMS ({ROOMS.length})
            </TactileButton>
          </div>

          {/* Quick Search & Entity Navigator */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={`Search ${activePivot}s...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 w-36 sm:w-44"
              />
            </div>

            {/* Entity Dropdown Selector */}
            <select
              value={selectedId}
              onChange={(e) => onSelectId(e.target.value)}
              className="px-2.5 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs font-mono text-white focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[200px]"
            >
              {filteredEntities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} - {e.name}
                </option>
              ))}
            </select>

            {/* Quick Cycle Buttons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleCycle(-1)}
                className="p-1.5 bg-[#161B22] border border-white/10 hover:border-cyan-500/50 text-neutral-300 hover:text-white rounded-[3px]"
                title="Previous entity"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCycle(1)}
                className="p-1.5 bg-[#161B22] border border-white/10 hover:border-cyan-500/50 text-neutral-300 hover:text-white rounded-[3px]"
                title="Next entity"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Evening Event Grid Toggle */}
            <TactileButton
              size="sm"
              variant={showEvening ? "amber" : "default"}
              active={showEvening}
              onClick={onToggleEvening}
              icon={<Moon className="w-3.5 h-3.5" />}
            >
              {showEvening ? "EVENING GRID [P10-P13] ON" : "EVENING GRID OFF"}
            </TactileButton>
          </div>
        </div>

        {/* Selected Entity Tactical Telemetry Deck */}
        <div className="p-2.5 bg-[#12161C] border border-white/10 rounded-[3px] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          
          {/* Group View Telemetry */}
          {activePivot === "group" && currentGroup && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2 py-0.5 rounded-[2px] bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-bold">
                GROUP // {currentGroup.id}
              </span>
              <span className="text-white font-sans font-medium">
                {currentGroup.name}
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-300">
                HEADCOUNT: <strong className="text-white">{currentGroup.size}</strong> Students
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-300">
                YEAR: <strong className="text-cyan-400">Year {currentGroup.year}</strong> ({currentGroup.department})
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-emerald-400">
                SCHEDULED: {relevantSessions.length} Sessions ({relevantSessions.reduce((acc, s) => acc + s.duration, 0)} Hours/Wk)
              </span>
            </div>
          )}

          {/* Faculty View Telemetry */}
          {activePivot === "faculty" && currentFaculty && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2 py-0.5 rounded-[2px] bg-amber-950/60 border border-amber-500/50 text-amber-300 font-bold">
                FACULTY // {currentFaculty.id}
              </span>
              <span className="text-white font-sans font-medium">
                {currentFaculty.name}
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-300">
                DEPARTMENT: <strong className="text-white">{currentFaculty.department}</strong>
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-300">
                MAX DAILY TEACHING CEILING: <strong className="text-amber-400">&le; {currentFaculty.max_hours_per_day} Hours</strong>
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-300">
                TOTAL ASSIGNED: <strong className="text-cyan-400">{relevantSessions.reduce((acc, s) => acc + s.duration, 0)} Hours/Wk</strong>
              </span>
            </div>
          )}

          {/* Room View Telemetry */}
          {activePivot === "room" && currentRoom && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2 py-0.5 rounded-[2px] bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-bold">
                VENUE // {currentRoom.id}
              </span>
              <span className="text-white font-sans font-medium">
                {currentRoom.name} ({currentRoom.building})
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-300">
                CAPACITY: <strong className="text-emerald-400">{currentRoom.capacity} Seats</strong>
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-300 capitalize">
                TYPE: <strong className="text-white">{currentRoom.type.replace("_", " ")}</strong>
              </span>
              <span className="text-neutral-400">|</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Accessibility className="w-3.5 h-3.5" />
                {currentRoom.accessible ? "ACCESSIBLE" : "STANDARD ACCESS"}
              </span>
            </div>
          )}

          {/* Quick Legend & Help Hint */}
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Lecture
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> 3H Lab
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Underutilized (&lt;40%)
            </span>
          </div>
        </div>
      </div>

      {/* Main Timetable Matrix Board */}
      <div className="bg-[#080A0C] border border-white/10 rounded-[4px] overflow-hidden shadow-xl">
        
        {/* Column Time Period Headers */}
        <div className="grid grid-cols-[100px_repeat(5,1fr)_80px_repeat(4,1fr)] border-b border-white/10 bg-[#0E1216] font-mono text-center divide-x divide-white/5 select-none">
          
          {/* Top-Left Matrix Label */}
          <div className="p-2 flex flex-col justify-center items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider bg-[#12161C]">
            <span>LOCUS</span>
            <span className="text-cyan-400">SCHEDULE</span>
          </div>

          {/* Morning Teaching Periods P1 - P5 (08:00 - 13:00) */}
          <div className="p-2 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-cyan-300">P1</span>
            <span className="text-[10px] text-neutral-400">08:00 - 09:00</span>
          </div>

          <div className="p-2 flex flex-col items-center justify-center bg-cyan-950/10">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-cyan-300">P2</span>
              <span className="text-[8px] px-1 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-[2px]">
                LAB
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">09:00 - 10:00</span>
          </div>

          <div className="p-2 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-cyan-300">P3</span>
            <span className="text-[10px] text-neutral-400">10:00 - 11:00</span>
          </div>

          <div className="p-2 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-cyan-300">P4</span>
            <span className="text-[10px] text-neutral-400">11:00 - 12:00</span>
          </div>

          <div className="p-2 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-cyan-300">P5</span>
            <span className="text-[10px] text-neutral-400">12:00 - 13:00</span>
          </div>

          {/* Strict Lunch Break Divider Header */}
          <div className="p-2 flex flex-col items-center justify-center bg-[#1B1914] border-x-2 border-amber-500/30 text-amber-400">
            <span className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> RECESS
            </span>
            <span className="text-[9px] text-amber-300/80">13:00 - 14:00</span>
          </div>

          {/* Afternoon Teaching Periods P6 - P9 (14:00 - 18:00) */}
          <div className="p-2 flex flex-col items-center justify-center bg-cyan-950/10">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-cyan-300">P6</span>
              <span className="text-[8px] px-1 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-[2px]">
                LAB
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">14:00 - 15:00</span>
          </div>

          <div className="p-2 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-cyan-300">P7</span>
            <span className="text-[10px] text-neutral-400">15:00 - 16:00</span>
          </div>

          <div className="p-2 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-cyan-300">P8</span>
            <span className="text-[10px] text-neutral-400">16:00 - 17:00</span>
          </div>

          <div className="p-2 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-cyan-300">P9</span>
            <span className="text-[10px] text-neutral-400">17:00 - 18:00</span>
          </div>
        </div>

        {/* Day Rows (Monday through Friday) */}
        <div className="divide-y divide-white/5">
          {DAYS.map((day) => {
            const grid = getDayGrid(day.id);
            const facultyLoad = dailyFacultyLoad[day.id];
            const maxFacultyLoad = currentFaculty?.max_hours_per_day || 4;
            const isApproachingLimit = facultyLoad === 3;
            const isMaxLimit = facultyLoad >= maxFacultyLoad;

            return (
              <div 
                key={day.id}
                className="grid grid-cols-[100px_repeat(5,1fr)_80px_repeat(4,1fr)] divide-x divide-white/5 min-h-[96px] bg-[#0A0D10]/50 hover:bg-[#0E1216]/60 transition-colors"
              >
                {/* Day Header Column with Faculty Load Telemetry */}
                <div className="p-2 bg-[#12161C] flex flex-col justify-between select-none">
                  <div>
                    <span className="font-mono text-[9px] text-neutral-500 block">
                      {day.index}
                    </span>
                    <span className="font-mono text-sm font-bold text-white tracking-wider">
                      {day.id}
                    </span>
                  </div>

                  {/* Faculty Daily Load Badge */}
                  {activePivot === "faculty" && (
                    <div className="mt-1 pt-1 border-t border-white/10 font-mono text-[10px]">
                      <div className="text-neutral-400 text-[9px]">LOAD:</div>
                      <span className={`px-1 py-0.2 rounded-[2px] font-bold inline-block mt-0.5 ${
                        isMaxLimit 
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" 
                          : isApproachingLimit 
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}>
                        {facultyLoad}h / {maxFacultyLoad}h
                        {isMaxLimit ? " [MAX]" : isApproachingLimit ? " [WARN]" : " [OK]"}
                      </span>
                    </div>
                  )}

                  {activePivot !== "faculty" && (
                    <span className="font-mono text-[10px] text-neutral-500">
                      {relevantSessions.filter(s => s.day === day.id).length} SESSIONS
                    </span>
                  )}
                </div>

                {/* Morning Slots: P1 to P5 */}
                {grid.morningSlots.map((slot) => {
                  const spanClass = {
                    1: "col-span-1",
                    2: "col-span-2",
                    3: "col-span-3",
                    4: "col-span-4",
                    5: "col-span-5",
                  }[slot.span] || "col-span-1";

                  return (
                    <div 
                      key={`morning-${day.id}-${slot.period}`}
                      className={`p-1 flex flex-col justify-center ${spanClass} min-h-[90px]`}
                    >
                      {slot.session ? (
                        <SessionCard 
                          session={slot.session} 
                          onClick={setInspectedSession} 
                        />
                      ) : (
                        <div className="w-full h-full border border-dashed border-white/5 rounded-[3px] flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                          <span className="font-mono text-[9px] text-neutral-600">FREE</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Strict Lunch Break Divider (13:00 - 14:00) */}
                <div 
                  className="relative p-1 flex flex-col items-center justify-center bg-[#15120C] border-x-2 border-amber-500/30 text-amber-500/50 select-none overflow-hidden"
                  style={{
                    backgroundImage: "repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.05) 8px, transparent 8px, transparent 16px)"
                  }}
                  title="CIT Sanctioned Mandatory Lunch Protocol (13:00-14:00) - No sessions allowed"
                >
                  <div className="absolute inset-0 flex items-center justify-center rotate-90 pointer-events-none">
                    <span className="font-mono text-[9px] tracking-widest font-bold text-amber-400/50 whitespace-nowrap">
                      // LUNCH PROTOCOL //
                    </span>
                  </div>
                </div>

                {/* Afternoon Slots: P6 to P9 */}
                {grid.afternoonSlots.map((slot) => {
                  const spanClass = {
                    1: "col-span-1",
                    2: "col-span-2",
                    3: "col-span-3",
                    4: "col-span-4",
                  }[slot.span] || "col-span-1";

                  return (
                    <div 
                      key={`afternoon-${day.id}-${slot.period}`}
                      className={`p-1 flex flex-col justify-center ${spanClass} min-h-[90px]`}
                    >
                      {slot.session ? (
                        <SessionCard 
                          session={slot.session} 
                          onClick={setInspectedSession} 
                        />
                      ) : (
                        <div className="w-full h-full border border-dashed border-white/5 rounded-[3px] flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                          <span className="font-mono text-[9px] text-neutral-600">FREE</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Evening Events Grid (P10 - P13, 18:00 - 22:00) Optional Drawer */}
      {showEvening && (
        <div className="p-3 bg-[#130E1D] border border-purple-500/30 rounded-[4px] space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-[2px] bg-purple-950/80 text-purple-400 border border-purple-500/40">
                <Moon className="w-3.5 h-3.5" />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-purple-300">
                SPECTRA EVENING EVENTS MATRIX // PERIODS P10 - P13 (18:00 - 22:00)
              </span>
            </div>
            <span className="font-mono text-[10px] text-purple-400/80">
              Allocated For Non-Academic Campus Events & Culturals
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs pt-1">
            <div className="p-2 bg-[#1A1329] border border-purple-500/20 rounded-[3px]">
              <span className="text-purple-300 font-bold block">P10 [18:00 - 19:00]</span>
              <span className="text-[10px] text-neutral-400 mt-1 block">Cultural Rehearsals & Soundchecks</span>
            </div>
            <div className="p-2 bg-[#1A1329] border border-purple-500/20 rounded-[3px]">
              <span className="text-purple-300 font-bold block">P11 [19:00 - 20:00]</span>
              <span className="text-[10px] text-neutral-400 mt-1 block">Stage Play: Andha Yug (SH-1)</span>
            </div>
            <div className="p-2 bg-[#1A1329] border border-purple-500/20 rounded-[3px]">
              <span className="text-purple-300 font-bold block">P12 [20:00 - 21:00]</span>
              <span className="text-[10px] text-neutral-400 mt-1 block">Battle of the Bands (Main Auditorium)</span>
            </div>
            <div className="p-2 bg-[#1A1329] border border-purple-500/20 rounded-[3px]">
              <span className="text-purple-300 font-bold block">P13 [21:00 - 22:00]</span>
              <span className="text-[10px] text-neutral-400 mt-1 block">Night Jam Session & Awards</span>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Session & Constraints Modal */}
      <SessionInspectModal
        session={inspectedSession}
        onClose={() => setInspectedSession(null)}
        room={inspectedSession ? roomMap.get(inspectedSession.room_id) : undefined}
        faculty={inspectedSession ? facMap.get(inspectedSession.faculty_id) : undefined}
        groupObjects={inspectedSession ? inspectedSession.groups.map(gid => groupMap.get(gid)!).filter(Boolean) : []}
      />
    </div>
  );
}
