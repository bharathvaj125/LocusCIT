"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Users } from "lucide-react";
import { DayOfWeek, ExamSession } from "@/lib/types";
import { useApp } from "@/lib/appContext";
import { ApiError, describeError, fetchExams } from "@/lib/api";
import { TONES, deptTone, DAY_LABEL } from "@/lib/dept";
import { Card, Chip, Drawer, EmptyState, Eyebrow, PageTitle, Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function ExamsBoard() {
  const { ref, revision, user, dashboard } = useApp();
  const [exams, setExams] = useState<ExamSession[]>([]);
  const [state, setState] = useState<{ loading: boolean; error: string | null; empty: boolean }>({ loading: true, error: null, empty: false });
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");
  const [venue, setVenue] = useState("all");
  const [open, setOpen] = useState<ExamSession | null>(null);

  useEffect(() => {
    if (!ref) return;
    setState((s) => ({ ...s, loading: true }));
    fetchExams(ref)
      .then((r) => { setExams(r); setState({ loading: false, error: null, empty: false }); })
      .catch((e) => {
        setExams([]);
        setState(e instanceof ApiError && e.status === 404 ? { loading: false, error: null, empty: true } : { loading: false, error: describeError(e), empty: false });
      });
  }, [ref, revision]);

  const days = (ref?.calendar.exam_week.days || []) as DayOfWeek[];
  const slots = ref?.calendar.exam_week.sessions || [];
  const venues = useMemo(() => {
    const m = new Map<string, string>();
    exams.forEach((e) => e.room_details.forEach((r) => m.set(r.id, r.name)));
    return Array.from(m, ([id, name]) => ({ id, name })).sort((a, b) => a.id.localeCompare(b.id));
  }, [exams]);
  const filtered = useMemo(() => exams.filter((e) => {
    if (group !== "all" && !e.groups.includes(group)) return false;
    if (venue !== "all" && !e.rooms.includes(venue)) return false;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      const hay = [e.course_title, e.course_id, e.exam_id, e.day, e.slot, ...e.rooms, ...e.room_details.map((r) => r.name), ...e.groups];
      if (!hay.some((x) => x.toLowerCase().includes(s))) return false;
    }
    return true;
  }), [exams, group, venue, q]);
  // when the search or the venue filter names a room, list what sits in it day by day
  const venueFocus = useMemo(() => {
    const s = q.trim().toLowerCase();
    const hit = venue !== "all" ? venue : venues.find((v) => s && (v.id.toLowerCase() === s || v.name.toLowerCase() === s))?.id;
    if (!hit) return null;
    return { id: hit, name: venues.find((v) => v.id === hit)?.name || "", rows: exams.filter((e) => e.rooms.includes(hit)).sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.slot.localeCompare(b.slot)) };
  }, [q, venue, venues, exams, days]);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Midsem exams"
        title={<>Exam week, <span className="italic font-medium text-lagoon-700">Monday to Saturday</span></>}
        subtitle="Each paper gets one slot and as many rooms as it needs. A room seats half its capacity, and no room or student group has two papers in a slot."
        actions={<><Chip tone="mangrove" dot>{exams.length} of {dashboard?.exams_total ?? "?"} scheduled</Chip>{dashboard?.exam_soft_penalty != null && <Chip tone="lagoon">{dashboard.exam_soft_penalty === 0 ? "No group has two on one day" : `same-day penalty ${dashboard.exam_soft_penalty}`}</Chip>}</>}
      />

      <Card className="p-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a paper or a venue (CS101, LH-1…)" aria-label="Search by paper or venue"
            className="h-10 pl-9 pr-3 rounded-xl bg-paper border border-line text-sm w-72 max-w-full" />
        </div>
        <select value={venue} onChange={(e) => setVenue(e.target.value)} aria-label="Filter by venue"
          className="h-10 px-3 rounded-xl bg-paper border border-line text-sm font-semibold cursor-pointer">
          <option value="all">All venues</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.id} · {v.name}</option>)}
        </select>
        <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Filter by student group"
          className="h-10 px-3 rounded-xl bg-paper border border-line text-sm font-semibold cursor-pointer">
          <option value="all">All student groups</option>
          {(ref?.student_groups || []).map((g) => <option key={g.id} value={g.id}>{g.id} ({g.size})</option>)}
        </select>
        <span className="ml-auto text-sm text-ink-600">Showing <strong className="text-ink-900">{filtered.length}</strong> paper{filtered.length === 1 ? "" : "s"}</span>
      </Card>

      {venueFocus && !state.loading && (
        <Card className="p-4 space-y-2" role="status">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-lagoon-700" /><p className="font-semibold">{venueFocus.id} <span className="text-ink-400 font-normal">{venueFocus.name}</span></p><Chip tone="stone">{venueFocus.rows.length} paper{venueFocus.rows.length === 1 ? "" : "s"}</Chip></div>
          {venueFocus.rows.length === 0 ? <p className="text-sm text-ink-600">No exam is held in this room.</p> : (
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {venueFocus.rows.map((e) => <li key={e.exam_id} className="flex gap-2"><span className="font-mono text-xs text-lagoon-700 w-24 shrink-0">{e.day} {e.slot} {e.time_range}</span><span className="truncate"><strong>{e.course_id}</strong> {e.course_title}</span></li>)}
            </ul>
          )}
        </Card>
      )}

      {state.loading && <div className="grid grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>}
      {state.error && <p className="text-sm text-sunrise-600">{state.error}</p>}
      {state.empty && (
        <EmptyState title="No exam schedule yet" body={user.role === "admin" ? "Generate the timetable, then run step 2 on the Overview page." : "An Admin has to schedule the exams first."} />
      )}

      {!state.loading && !state.empty && !state.error && (
        <Card className="p-4 overflow-x-auto">
          <div className="min-w-[1000px] grid gap-2" style={{ gridTemplateColumns: `96px repeat(${days.length}, minmax(0, 1fr))` }}>
            <div />
            {days.map((d) => (
              <div key={d} className="px-2 pb-1"><p className="font-display text-xl font-semibold leading-none">{d}</p><p className="text-[11px] text-ink-400">{DAY_LABEL[d]}</p></div>
            ))}
            {slots.map((slot) => (
              <React.Fragment key={slot.id}>
                <div className="pt-2 pr-2"><p className={cn("font-mono text-xs font-medium", slot.id === "AM" ? "text-lagoon-700" : "text-saffron-600")}>{slot.id}</p><p className="font-mono text-[10px] text-ink-400">{slot.start}-{slot.end}</p></div>
                {days.map((d) => {
                  const here = filtered.filter((e) => e.day === d && e.slot === slot.id);
                  return (
                    <div key={d + slot.id} className="rounded-xl bg-paper/70 border border-line/70 p-1.5 min-h-[120px] space-y-1.5">
                      {here.map((e, i) => {
                        const tone = TONES[deptTone(e.department)];
                        return (
                          <motion.button key={e.exam_id} onClick={() => setOpen(e)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -2 }}
                            className={cn("relative w-full text-left rounded-lg pl-3 pr-2 py-2 overflow-hidden cursor-pointer hover:shadow-card", tone.soft)}>
                            <span className={cn("absolute left-0 top-0 bottom-0 w-1", tone.bar)} />
                            <span className={cn("font-mono text-[10px] font-medium", tone.text)}>{e.course_id}</span>
                            <span className="block font-display text-[13px] font-semibold leading-tight line-clamp-2">{e.course_title}</span>
                            <span className="mt-1 flex flex-wrap gap-1">{e.rooms.map((r) => <span key={r} className="font-mono text-[9.5px] px-1 rounded bg-raised/80 text-ink-600">{r}</span>)}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      <Drawer open={!!open} onClose={() => setOpen(null)} eyebrow={open ? `${open.exam_id} · ${open.day} ${open.slot}` : undefined} title={open?.course_title || ""}>
        {open && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-paper p-3"><Eyebrow className="text-ink-400">When</Eyebrow><p className="text-sm font-semibold mt-1">{DAY_LABEL[open.day]}, {open.time_range}</p></div>
              <div className="rounded-xl bg-paper p-3"><Eyebrow className="text-ink-400">Students</Eyebrow><p className="text-sm font-semibold mt-1 flex items-center gap-1.5"><Users className="w-4 h-4" />{open.candidate_count} in {open.groups.join(", ")}</p></div>
            </div>
            <div>
              <div className="flex items-baseline justify-between"><Eyebrow>Rooms used</Eyebrow><span className="text-xs text-ink-600">{open.total_effective_seats} seats for {open.candidate_count} students</span></div>
              <ul className="mt-3 space-y-2.5">
                {open.room_details.map((r, i) => (
                  <li key={r.id}>
                    <div className="flex items-center justify-between text-sm"><span className="font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-lagoon-700" />{r.id} <span className="text-ink-400 font-normal">{r.name}</span></span><span className="font-mono text-xs text-ink-600">{r.capacity} → {r.effective_seats} seats</span></div>
                    <div className="h-2 rounded-full bg-sunk mt-1.5 overflow-hidden"><motion.div className="h-full bg-lagoon-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${(100 * r.effective_seats) / Math.max(1, open.total_effective_seats)}%` }} transition={{ duration: 0.6, delay: i * 0.08 }} /></div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ink-600 mt-3 rounded-xl bg-lagoon-50 px-3 py-2">
                {open.total_effective_seats >= open.candidate_count ? `Seats are enough: ${open.total_effective_seats - open.candidate_count} spare.` : "Not enough seats."} Each room is counted at half its capacity.
              </p>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
