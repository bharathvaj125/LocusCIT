"use client";

import React, { useState, useMemo } from "react";
import { BookingRequest, RoleType, DayOfWeek } from "@/lib/types";
import { SPECTRA_BOOKINGS, ROOMS } from "@/lib/mockData";
import { submitBooking } from "@/lib/api";
import { TactileButton } from "@/components/tactile/TactileButton";
import { 
  Sparkles, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Send, 
  Check, 
  Layers, 
  Accessibility,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

interface SpectraClashMatrixProps {
  bookings?: BookingRequest[];
  currentRole: RoleType;
  onRefresh?: () => void;
}

export function SpectraClashMatrix({
  bookings = SPECTRA_BOOKINGS,
  currentRole,
  onRefresh,
}: SpectraClashMatrixProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // New Booking Form State
  const [newTitle, setNewTitle] = useState("");
  const [newRequester, setNewRequester] = useState("Robotics Club");
  const [newCategory, setNewCategory] = useState<"institute_event" | "guest_lecture" | "department_event" | "club_event">("club_event");
  const [newAttendance, setNewAttendance] = useState(60);
  const [newDuration, setNewDuration] = useState(2);
  const [newDay, setNewDay] = useState<DayOfWeek>("THU");
  const [newStartPeriod, setNewStartPeriod] = useState(10);
  const [newRoomWish, setNewRoomWish] = useState("SH-1");
  const [newFeatures, setNewFeatures] = useState<string[]>(["pa_system"]);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Filtered requests
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filterStatus !== "all" && b.status !== filterStatus) return false;
      if (filterCategory !== "all" && b.effective_category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchReq = b.requester.toLowerCase().includes(q);
        const matchId = b.id.toLowerCase().includes(q);
        if (!matchTitle && !matchReq && !matchId) return false;
      }
      return true;
    });
  }, [bookings, filterStatus, filterCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      approved: bookings.filter((b) => b.status === "approved").length,
      alternatives: bookings.filter((b) => b.status === "alternative_offered").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  }, [bookings]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback("Validating capacity and constraint compliance...");

    const endPeriod = newStartPeriod + newDuration - 1;
    const res = await submitBooking({
      title: newTitle || "Campus Cultural Event",
      requester: newRequester,
      role: currentRole,
      requested_category: newCategory,
      effective_category: currentRole === "club" ? "club_event" : newCategory,
      attendance: Number(newAttendance),
      duration_periods: Number(newDuration),
      day: newDay,
      start_period: Number(newStartPeriod),
      end_period: endPeriod,
      room_types: ["seminar_hall", "auditorium"],
      needs: newFeatures,
      requested_room: newRoomWish,
    });

    if (res.success) {
      setFormFeedback(`Booking ${res.data.id} submitted successfully into administrative queue!`);
      setTimeout(() => {
        setIsCreating(false);
        setFormFeedback(null);
        if (onRefresh) onRefresh();
      }, 1500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Telemetry Counters */}
      <div className="p-4 bg-[#0E1216] border border-white/10 rounded-[4px] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-[3px] bg-amber-950/60 border border-amber-500/40 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                SPECTRA WEEK 7 CLASH &amp; PRIORITY MATRIX
              </h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-[2px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                PRIORITY PROTOCOL ACTIVE
              </span>
            </div>
            <p className="font-mono text-xs text-neutral-400 mt-1">
              Priority Order: Institute (5) &gt; Guest (4) &gt; Dept (3) &gt; Club (2). Tie-breaking by submitted timestamp.
            </p>
          </div>

          <TactileButton
            size="sm"
            variant="amber"
            onClick={() => setIsCreating(!isCreating)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            {isCreating ? "CLOSE FORM" : "SUBMIT NEW BOOKING"}
          </TactileButton>
        </div>

        {/* Priority Scorecard Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs pt-2 border-t border-white/5">
          <div className="p-2 bg-[#12161C] border border-white/10 rounded-[3px]">
            <span className="text-[10px] text-neutral-400 block">TOTAL REQUESTS</span>
            <span className="text-base font-bold text-white mt-0.5 block">{stats.total}</span>
          </div>
          <div className="p-2 bg-[#12161C] border border-emerald-500/30 rounded-[3px]">
            <span className="text-[10px] text-emerald-400 block">APPROVED</span>
            <span className="text-base font-bold text-emerald-300 mt-0.5 block">{stats.approved}</span>
          </div>
          <div className="p-2 bg-[#12161C] border border-cyan-500/30 rounded-[3px]">
            <span className="text-[10px] text-cyan-400 block">ALTERNATIVES</span>
            <span className="text-base font-bold text-cyan-300 mt-0.5 block">{stats.alternatives}</span>
          </div>
          <div className="p-2 bg-[#12161C] border border-rose-500/30 rounded-[3px]">
            <span className="text-[10px] text-rose-400 block">REJECTED</span>
            <span className="text-base font-bold text-rose-300 mt-0.5 block">{stats.rejected}</span>
          </div>
          <div className="p-2 bg-[#12161C] border border-white/10 rounded-[3px]">
            <span className="text-[10px] text-neutral-500 block">WITHDRAWN</span>
            <span className="text-base font-bold text-neutral-400 mt-0.5 block">{stats.cancelled}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search title, club, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 w-48"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">ALL STATUSES</option>
              <option value="approved">APPROVED ONLY</option>
              <option value="alternative_offered">ALTERNATIVES ONLY</option>
              <option value="rejected">REJECTED ONLY</option>
              <option value="cancelled">WITHDRAWN ONLY</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1 bg-[#161B22] border border-white/10 rounded-[3px] text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">ALL CATEGORIES</option>
              <option value="institute_event">INSTITUTE (WT 5)</option>
              <option value="guest_lecture">GUEST LECTURE (WT 4)</option>
              <option value="department_event">DEPARTMENT (WT 3)</option>
              <option value="club_event">CLUB (WT 2)</option>
            </select>
          </div>

          <span className="text-neutral-400">
            SHOWING <strong className="text-white">{filteredBookings.length}</strong> REQUESTS
          </span>
        </div>
      </div>

      {/* New Booking Submission Drawer */}
      {isCreating && (
        <form onSubmit={handleCreateBooking} className="p-4 bg-[#130E1D] border border-amber-500/40 rounded-[4px] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 uppercase">
              <Plus className="w-4 h-4 text-amber-400" />
              CREATE STRUCTURED VENUE BOOKING REQUEST
            </span>
            <span className="text-neutral-400 text-[10px]">
              Active Role: <strong className="text-white uppercase">{currentRole}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">EVENT TITLE</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Robotics Workshop / Band Practice"
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">REQUESTER ORGANISATION</label>
              <input
                type="text"
                required
                value={newRequester}
                onChange={(e) => setNewRequester(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">REQUESTED CATEGORY</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white focus:outline-none focus:border-amber-400"
              >
                <option value="club_event">Club Event (Weight 2)</option>
                <option value="department_event">Department Event (Weight 3)</option>
                <option value="guest_lecture">Guest Lecture (Weight 4)</option>
                <option value="institute_event">Institute Event (Weight 5)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">EXPECTED ATTENDANCE</label>
              <input
                type="number"
                min={10}
                max={800}
                value={newAttendance}
                onChange={(e) => setNewAttendance(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">DAY &amp; START PERIOD</label>
              <div className="flex gap-2">
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value as any)}
                  className="w-1/2 px-2 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white"
                >
                  <option value="MON">MON</option>
                  <option value="TUE">TUE</option>
                  <option value="WED">WED</option>
                  <option value="THU">THU</option>
                  <option value="FRI">FRI</option>
                </select>
                <select
                  value={newStartPeriod}
                  onChange={(e) => setNewStartPeriod(Number(e.target.value))}
                  className="w-1/2 px-2 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white"
                >
                  <option value={10}>P10 (18:00)</option>
                  <option value={11}>P11 (19:00)</option>
                  <option value={12}>P12 (20:00)</option>
                  <option value={2}>P2 (09:00)</option>
                  <option value={6}>P6 (14:00)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-neutral-400 block text-[10px] mb-1">PREFERRED VENUE WISH</label>
              <select
                value={newRoomWish}
                onChange={(e) => setNewRoomWish(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0E1216] border border-white/15 rounded text-white"
              >
                {ROOMS.filter(r => r.allowed_uses.includes("event")).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.id} - {r.name} ({r.capacity} seats)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-emerald-400 text-xs">
              {formFeedback || "Deterministic rules check: Venue allows events & attendance fits capacity."}
            </span>
            <div className="flex gap-2">
              <TactileButton size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                CANCEL
              </TactileButton>
              <TactileButton size="sm" variant="amber" type="submit" icon={<Send className="w-3.5 h-3.5" />}>
                SUBMIT REQUEST
              </TactileButton>
            </div>
          </div>
        </form>
      )}

      {/* Requests Matrix List */}
      <div className="space-y-2">
        {filteredBookings.map((req) => {
          const isApproved = req.status === "approved";
          const isAlt = req.status === "alternative_offered";
          const isRejected = req.status === "rejected";
          const isCancelled = req.status === "cancelled";

          return (
            <div
              key={req.id}
              onClick={() => setSelectedBooking(req)}
              className={`p-3 bg-[#0E1216] border rounded-[4px] cursor-pointer transition-all hover:bg-[#12161C] ${
                selectedBooking?.id === req.id ? "border-cyan-400 ring-1 ring-cyan-400/30" : "border-white/10"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">
                    {req.id}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-300 uppercase">
                    {req.requester}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 uppercase">
                    {req.effective_category.replace("_", " ")}
                  </span>
                </div>

                {/* Status Pill */}
                <div>
                  {isApproved && (
                    <span className="px-2 py-0.5 rounded-[2px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> APPROVED DIRECT
                    </span>
                  )}
                  {isAlt && (
                    <span className="px-2 py-0.5 rounded-[2px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-cyan-400" /> ALTERNATIVE OFFERED
                    </span>
                  )}
                  {isRejected && (
                    <span className="px-2 py-0.5 rounded-[2px] bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-400" /> REJECTED
                    </span>
                  )}
                  {isCancelled && (
                    <span className="px-2 py-0.5 rounded-[2px] bg-neutral-800 text-neutral-400 border border-white/10 text-[10px] font-mono font-bold">
                      WITHDRAWN BY CLUB
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Spatial Allocation */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-neutral-100">
                  {req.title}
                </span>

                <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {req.day} P{req.start_period}{req.duration_periods > 1 ? `-P${req.end_period}` : ""}
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    Venue: <strong className="text-white">{req.assigned_room || req.requested_room || "None"}</strong>
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-400" />
                    Att: {req.attendance}
                  </span>
                </div>
              </div>

              {/* Rationale explanation */}
              <p className="font-mono text-[11px] text-neutral-400 mt-1.5 pt-1.5 border-t border-white/5">
                <strong className="text-neutral-300">Rationale:</strong> {req.reason}
                {req.displaced_class && (
                  <span className="text-amber-400 font-semibold block mt-0.5">
                    &bull; Week 7 Session Override: Regular class {req.displaced_class} legally relocated for festival week.
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
