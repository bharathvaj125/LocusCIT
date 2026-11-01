"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, DoorOpen, Eye, GraduationCap, MapPin } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { CampusOverview, RoomAvailability, describeError, fetchAvailability, fetchCampusOverview } from "@/lib/api";
import { CATEGORY_LABEL, CATEGORY_TONE, DAY_LABEL } from "@/lib/dept";
import { PERIOD_CLOCK, periodRange } from "@/lib/uiConfig";
import { NavRouteId } from "@/lib/types";
import { Card, Chip, CountUp, Eyebrow, Skeleton } from "@/components/ui/primitives";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/lib/utils";

const sel = "h-9 px-2 rounded-lg bg-paper border border-line text-sm font-semibold cursor-pointer";

/** The same read-only picture of the campus for every role: counts, whether a room is free, and approved events. */
export function CampusGlance({ onNav }: { onNav: (n: NavRouteId) => void }) {
  const { revision } = useApp();
  const [ov, setOv] = useState<CampusOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState("THU");
  const [from, setFrom] = useState(10);
  const [to, setTo] = useState(11);
  const [seats, setSeats] = useState(0);
  const [rooms, setRooms] = useState<RoomAvailability[] | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);
  const [showBusy, setShowBusy] = useState(false);

  useEffect(() => { fetchCampusOverview().then(setOv).catch((e) => setError(describeError(e))); }, [revision]);
  useEffect(() => {
    if (!ov?.timetable_ready) return;
    if (to < from) { setAvailError("The end period is before the start period."); setRooms(null); return; }
    setAvailError(null);
    const t = setTimeout(() => {
      fetchAvailability(day, from, to, seats).then((r) => setRooms(r.rooms)).catch((e) => { setRooms(null); setAvailError(describeError(e)); });
    }, 200);
    return () => clearTimeout(t);
  }, [ov?.timetable_ready, day, from, to, seats, revision]);

  const free = useMemo(() => (rooms || []).filter((r) => r.free), [rooms]);
  const busy = useMemo(() => (rooms || []).filter((r) => !r.free), [rooms]);
  const days = ov?.days || ["MON", "TUE", "WED", "THU", "FRI"];

  if (error) return <p className="text-sm text-sunrise-600">{error}</p>;
  if (!ov) return <Skeleton className="h-64" />;

  const s = ov.stats;
  return (
    <section className="space-y-4" aria-label="Campus at a glance">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold">Campus at a glance</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-600"><Eye className="w-3.5 h-3.5" />Read-only and the same for everyone</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard index={0} label="Sessions placed" value={s.sessions_scheduled} tone="lagoon" icon={<CalendarCheck className="w-4 h-4" />} progress={s.sessions_total ? s.sessions_scheduled / s.sessions_total : 0} hint={`of ${s.sessions_total} in the timetable`} onClick={() => onNav("timetable")} />
        <StatCard index={1} label="Rooms" value={s.rooms} tone="indigo" icon={<DoorOpen className="w-4 h-4" />} hint={`${s.event_rooms} can host events`} />
        <StatCard index={2} label="Approved events" value={s.approved_events} tone="plum" icon={<CalendarDays className="w-4 h-4" />} hint="Spectra week" onClick={() => onNav("spectra_clash")} />
        <StatCard index={3} label="Midsem papers placed" value={s.exams_scheduled} tone="saffron" icon={<GraduationCap className="w-4 h-4" />} progress={s.exams_total ? s.exams_scheduled / s.exams_total : 0} hint={`of ${s.exams_total} in exam week`} onClick={() => onNav("exams")} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2"><DoorOpen className="w-4 h-4 text-lagoon-700" /><h3 className="font-display text-xl font-semibold">Is a room free?</h3></div>
          {!ov.timetable_ready ? <p className="text-sm text-ink-600">Room availability appears once the timetable has been generated.</p> : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <select aria-label="Day" value={day} onChange={(e) => setDay(e.target.value)} className={sel}>{days.map((d) => <option key={d} value={d}>{d}</option>)}</select>
                <span className="text-ink-400">from</span>
                <select aria-label="From period" value={from} onChange={(e) => setFrom(Number(e.target.value))} className={sel}>{Array.from({ length: 13 }, (_, i) => i + 1).map((p) => <option key={p} value={p}>P{p} {PERIOD_CLOCK[p]}</option>)}</select>
                <span className="text-ink-400">to the end of</span>
                <select aria-label="To period" value={to} onChange={(e) => setTo(Number(e.target.value))} className={sel}>{Array.from({ length: 13 }, (_, i) => i + 1).map((p) => <option key={p} value={p}>P{p}</option>)}</select>
                <label className="flex items-center gap-1.5 text-ink-600">seats ≥<input type="number" min={0} value={seats} onChange={(e) => setSeats(Math.max(0, Number(e.target.value) || 0))} aria-label="Minimum seats" className="w-20 h-9 px-2 rounded-lg bg-paper border border-line" /></label>
              </div>
              {availError && <p className="text-sm text-sunrise-600" role="alert">{availError}</p>}
              {rooms && (
                <>
                  <p className="text-sm text-ink-600"><strong className="text-ink-900">{free.length}</strong> of {rooms.length} rooms that can host events are free on {DAY_LABEL[day as keyof typeof DAY_LABEL] || day}, {periodRange(from, to)}.</p>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-auto">
                    {free.map((r) => <span key={r.id} title={`${r.name} · ${r.type.replace(/_/g, " ")}${r.accessible ? " · accessible" : ""}`}><Chip tone="mangrove">{r.id} · {r.capacity}</Chip></span>)}
                    {free.length === 0 && <span className="text-sm text-ink-600">Nothing is free then. Try another time.</span>}
                  </div>
                  {busy.length > 0 && (
                    <div>
                      <button onClick={() => setShowBusy((v) => !v)} className="text-sm font-semibold text-lagoon-700 underline underline-offset-2 cursor-pointer">{showBusy ? "Hide" : "Show"} the {busy.length} taken rooms</button>
                      {showBusy && <ul className="mt-2 space-y-1 text-sm max-h-48 overflow-auto">{busy.map((r) => <li key={r.id} className="flex gap-2"><span className="font-mono text-xs w-20 shrink-0 text-ink-900">{r.id}</span><span className="text-ink-600 truncate">{r.held_by.join(", ")}</span></li>)}</ul>}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-lagoon-700" /><h3 className="font-display text-xl font-semibold">Approved events, Week 7</h3></div>
            <button onClick={() => onNav("spectra_clash")} className="text-sm font-semibold text-lagoon-700 underline underline-offset-2 cursor-pointer">Venue board</button></div>
          {ov.approved_events.length === 0 ? <p className="text-sm text-ink-600">No event has been approved yet.</p> : (
            <ul className="space-y-2 max-h-72 overflow-auto pr-1">
              {ov.approved_events.map((e) => (
                <li key={e.id} className="rounded-xl bg-paper px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] text-lagoon-700">{e.day} {periodRange(e.start, e.end)}</span>
                    {e.category && <Chip tone={CATEGORY_TONE[e.category] || "stone"} className="!text-[10px]">{CATEGORY_LABEL[e.category] || e.category}</Chip>}</div>
                  <p className="text-sm font-semibold leading-snug">{e.title}</p>
                  <p className="text-xs text-ink-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{e.room_id} · {e.requester}</p>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => onNav("timetable")} className={cn("w-full rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-left hover:border-lagoon-500 hover:bg-lagoon-50/60 cursor-pointer")}>Browse any timetable (read-only)</button>
        </Card>
      </div>
    </section>
  );
}
