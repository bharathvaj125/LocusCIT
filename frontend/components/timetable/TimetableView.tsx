"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Info, MapPin, Users } from "lucide-react";
import { DayOfWeek, Explanation, ReferenceData, Room, ScheduledSession, StudentGroup, Week7Closure, Week7Event } from "@/lib/types";
import { describeError, explainSession } from "@/lib/api";
import { TONES, Tone, deptTone, DAY_LABEL } from "@/lib/dept";
import { PERIOD_CLOCK, periodRange } from "@/lib/uiConfig";
import { Card, Chip, Drawer, Eyebrow, PageTitle, Skeleton, Tabs } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { Week7Grid } from "@/components/timetable/Week7Grid";

export interface TimetableEntities {
  group: StudentGroup[];
  faculty: ReferenceData["faculty"];
  room: Room[];
}
export type TimetableMode = "regular" | "week7";
export interface Week7Data { events: Week7Event[]; closures: Week7Closure[] }

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI"];
// grid columns: 1 day label, 2-6 = P1-P5, 7 = lunch band, 8-11 = P6-P9
const colOf = (p: number) => (p <= 5 ? p + 1 : p + 2);
const COLS = "88px repeat(5, minmax(108px, 1fr)) 26px repeat(4, minmax(108px, 1fr))";

function tonesFor(s: ScheduledSession): Tone {
  return s.kind === "lab" ? "plum" : deptTone(s.course_dept);
}

function SessionBlock({ s, dim, linked, onHover, onOpen, tall }: {
  s: ScheduledSession; dim: boolean; linked: boolean; onHover: (s: ScheduledSession | null) => void; onOpen: (s: ScheduledSession) => void; tall: boolean;
}) {
  const tone = TONES[tonesFor(s)];
  return (
    <motion.button
      layout="position"
      onMouseEnter={() => onHover(s)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(s)} onBlur={() => onHover(null)}
      onClick={() => onOpen(s)}
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: dim ? 0.28 : 1, scale: 1 }} whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={cn("relative w-full text-left overflow-hidden rounded-xl pl-3 pr-2 py-2 cursor-pointer flex flex-col justify-between gap-1 border border-transparent hover:shadow-card",
        tone.soft, linked && cn("ring-2", tone.ring), s.week7?.moved && "ring-2 ring-saffron-500", tall ? "min-h-[84px]" : "min-h-[84px]")}
      aria-label={`${s.course_title}, ${DAY_LABEL[s.day]} periods ${s.start_period} to ${s.end_period}, room ${s.room_id}${s.week7?.moved ? ", moved for Week 7" : ""}`}
    >
      <span className={cn("absolute left-0 top-0 bottom-0 w-[5px]", tone.bar)} />
      <span className="flex items-center gap-1.5 flex-wrap">
        <span className={cn("font-mono text-[10.5px] font-medium tracking-wide", tone.text)}>{s.course_id}</span>
        {s.kind === "lab" && <span className="font-mono text-[9px] px-1 rounded bg-plum-500 text-raised">{s.duration}H LAB</span>}
        {s.kind === "tutorial" && <span className="font-mono text-[9px] px-1 rounded bg-ink-900/80 text-raised">TUT</span>}
        {s.basket_slot && <span className="font-mono text-[9px] px-1 rounded bg-saffron-500 text-ink-900">{s.basket_slot}</span>}
        {s.week7?.moved && <span className="font-mono text-[9px] px-1 rounded bg-saffron-500 text-ink-900" title={`Moved for Week 7 because of ${s.week7.displaced_by ?? "an institute event"}`}>MOVED W7</span>}
        {s.is_underutilized && <span title="Room is under 40% full" className="w-1.5 h-1.5 rounded-full bg-saffron-500" />}
      </span>
      <span className="font-display text-[14px] font-semibold leading-tight line-clamp-2">{s.course_title}</span>
      <span className="text-[11px] text-ink-600 flex items-center gap-1.5 truncate">
        <MapPin className="w-3 h-3 shrink-0" />{s.room_id}<span className="text-ink-400">·</span><span className="truncate">{s.faculty_name.replace(/^(Dr\.|Prof\.)\s*/, "")}</span>
      </span>
    </motion.button>
  );
}

export function TimetableView({ sessions, loading, entities, pivot, onPivot, selectedId, onSelect, mode, onMode, week7, ref_ }: {
  sessions: ScheduledSession[]; loading: boolean; entities: TimetableEntities; pivot: "group" | "faculty" | "room";
  onPivot: (p: "group" | "faculty" | "room") => void; selectedId: string; onSelect: (id: string) => void;
  mode: TimetableMode; onMode: (m: TimetableMode) => void; week7: Week7Data; ref_: ReferenceData | null;
}) {
  const [hover, setHover] = useState<ScheduledSession | null>(null);
  const [open, setOpen] = useState<ScheduledSession | null>(null);

  const list = entities[pivot] as Array<{ id: string; name: string }>;
  const idx = list.findIndex((e) => e.id === selectedId);
  const cycle = (d: -1 | 1) => { if (list.length) onSelect(list[(idx + d + list.length) % list.length].id); };
  const pivots = [
    ...(entities.group.length ? [{ id: "group" as const, label: <><Users className="w-3.5 h-3.5" />Groups</> }] : []),
    ...(entities.faculty.length ? [{ id: "faculty" as const, label: <>Faculty</> }] : []),
    { id: "room" as const, label: <>Rooms</> },
  ];

  const group = pivot === "group" ? entities.group.find((g) => g.id === selectedId) : undefined;
  const fac = pivot === "faculty" ? entities.faculty.find((f) => f.id === selectedId) : undefined;
  const room = pivot === "room" ? entities.room.find((r) => r.id === selectedId) : undefined;

  const totalHours = sessions.reduce((a, s) => a + s.duration, 0);
  const title = group ? group.name : fac ? fac.name : room ? `${room.id}: ${room.name}` : "Timetable";
  const w7 = mode === "week7";
  const nMoved = sessions.filter((x) => x.week7?.moved).length;
  const sub = w7 ? `Spectra week: ${sessions.length} class${sessions.length === 1 ? "" : "es"} (${nMoved} moved) and ${week7.events.length} approved event${week7.events.length === 1 ? "" : "s"}, evenings to 22:00`
    : group ? `${sessions.length} sessions · ${totalHours} hours a week · ${group.size} students`
    : fac ? `${fac.department} · ${sessions.length} sessions · ${totalHours} of ${fac.max_hours_per_day * 5} possible hours`
    : room ? `${room.type.replace(/_/g, " ")} · ${room.capacity} seats${room.accessible ? " · accessible" : ""} · ${totalHours} teaching hours`
    : "";

  // group sessions per day and slot so parallel electives stack inside one cell
  const byDay = useMemo(() => {
    const out: Record<string, Array<{ key: string; start: number; span: number; items: ScheduledSession[] }>> = {};
    for (const d of DAYS) {
      const m = new Map<string, { key: string; start: number; span: number; items: ScheduledSession[] }>();
      for (const s of sessions.filter((x) => x.day === d)) {
        const k = `${s.start_period}-${s.duration}`;
        const cell = m.get(k) || { key: k, start: s.start_period, span: s.duration, items: [] };
        cell.items.push(s); m.set(k, cell);
      }
      out[d] = [...m.values()];
    }
    return out;
  }, [sessions]);

  const loadFor = (d: DayOfWeek) => sessions.filter((s) => s.day === d).reduce((a, s) => a + s.duration, 0);
  const isLinked = (s: ScheduledSession) => !!hover && hover.id !== s.id && hover.course_id === s.course_id;

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow={`Timetable · ${w7 ? "Week 7 (Spectra)" : "regular weeks"} · by ${pivot === "group" ? "student group" : pivot}`}
        title={title}
        subtitle={sub}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs id="mode" value={mode} onChange={onMode} items={[{ id: "regular" as const, label: <>Regular weeks</> }, { id: "week7" as const, label: <>Week 7 · Spectra</> }]} />
            <Tabs id="pivot" value={pivot} onChange={onPivot} items={pivots} />
          </div>
        }
      />

      <Card className="p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => cycle(-1)} aria-label="Previous" className="p-2 rounded-lg hover:bg-sunk cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
          <select value={selectedId} onChange={(e) => onSelect(e.target.value)} aria-label={`Choose ${pivot}`}
            className="h-10 pl-3 pr-8 rounded-xl bg-paper border border-line text-sm font-semibold min-w-[220px] max-w-[320px] cursor-pointer">
            {list.map((e) => <option key={e.id} value={e.id}>{e.id} · {e.name}</option>)}
          </select>
          <button onClick={() => cycle(1)} aria-label="Next" className="p-2 rounded-lg hover:bg-sunk cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-600 ml-auto flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-lagoon-500" />CSE</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />ECE</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-saffron-500" />EE</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sunrise-500" />ME</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-mangrove-500" />CE</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-stone-500" />Common</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-plum-500" />Lab</span>
          {w7 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sunrise-500" />Event</span>}
          {w7 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm ring-2 ring-saffron-500 bg-raised" />Class moved for Week 7</span>}
          <span className="hidden md:flex items-center gap-1 text-ink-400"><Info className="w-3.5 h-3.5" />Hover a class to trace its course; click for the reason</span>
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
        {w7 ? (
          <Week7Grid classes={sessions} events={week7.events} closures={week7.closures} loading={loading} pivot={pivot}
            renderClass={(s, tall) => (
              <SessionBlock s={s} tall={tall} dim={!!hover && hover.course_id !== s.course_id && hover.id !== s.id}
                linked={isLinked(s)} onHover={setHover} onOpen={setOpen} />
            )} />
        ) : loading && sessions.length === 0 ? (
          <div className="min-w-[1080px] space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : (
          <LayoutGroup>
            <div className="grid gap-1.5 min-w-[1080px] relative" style={{ gridTemplateColumns: COLS, gridTemplateRows: "auto repeat(5, minmax(92px, auto))" }}>
              {/* header */}
              <div />
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                <div key={p} style={{ gridColumn: colOf(p), gridRow: 1 }} className="px-1 pb-1">
                  <p className="font-mono text-[11px] font-medium tracking-wider text-lagoon-700">P{p}{(p === 2 || p === 6) && <span className="ml-1 text-plum-500">LAB</span>}</p>
                  <p className="font-mono text-[10px] text-ink-400">{PERIOD_CLOCK[p]}</p>
                </div>
              ))}
              {/* one continuous lunch band, not one per day */}
              <div style={{ gridColumn: 7, gridRow: "1 / span 6" }} className="rounded-xl bg-sunk/80 flex items-center justify-center overflow-hidden" title="Lunch 13:00 to 14:00: no classes">
                <span className="font-mono text-[10px] tracking-[0.3em] text-ink-400 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">LUNCH 13:00 - 14:00</span>
              </div>
              {DAYS.map((d, i) => {
                const load = loadFor(d);
                const max = fac?.max_hours_per_day ?? 4;
                return (
                  <React.Fragment key={d}>
                    <div style={{ gridColumn: 1, gridRow: i + 2 }} className="flex flex-col justify-center pr-2">
                      <span className="font-display text-[22px] font-semibold leading-none">{d}</span>
                      {pivot === "faculty" ? (
                        <span className={cn("mt-1.5 self-start font-mono text-[10px] px-1.5 py-0.5 rounded-md", load >= max ? "bg-sunrise-50 text-sunrise-600" : load === max - 1 ? "bg-saffron-50 text-saffron-600" : "bg-mangrove-50 text-mangrove-600")}>{load}/{max}h</span>
                      ) : (
                        <span className="text-[11px] text-ink-400 mt-1">{byDay[d].reduce((a, c) => a + c.items.length, 0)} sessions</span>
                      )}
                    </div>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                      <div key={p} style={{ gridColumn: colOf(p), gridRow: i + 2 }} className="rounded-xl border border-dashed border-line/80" aria-hidden />
                    ))}
                    {byDay[d].map((cell) => (
                      <div key={cell.key} style={{ gridColumn: `${colOf(cell.start)} / span ${cell.span}`, gridRow: i + 2 }} className="z-[2] flex flex-col gap-1.5">
                        {cell.items.map((s) => (
                          <SessionBlock key={s.id} s={s} tall={cell.items.length === 1}
                            dim={!!hover && hover.course_id !== s.course_id && hover.id !== s.id}
                            linked={isLinked(s)} onHover={setHover} onOpen={setOpen} />
                        ))}
                      </div>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          </LayoutGroup>
        )}
        {!loading && sessions.length === 0 && !(w7 && week7.events.length > 0) && (
          <p className="text-sm text-ink-600 text-center py-6">No classes for this {pivot}.</p>
        )}
        {w7 && !loading && (
          <p className="text-xs text-ink-400 mt-3">
            {pivot === "room" ? "Shows every approved event in this room." : pivot === "group" ? "Events appear here when this group is required to attend."
              : "Events appear here when this teacher requested them."} Every booking, with its status, is on Venues &amp; Spectra. Midsem exams (Week 8) are on their own page.
          </p>
        )}
      </Card>

      <SessionDrawer s={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function SessionDrawer({ s, onClose }: { s: ScheduledSession | null; onClose: () => void }) {
  const [why, setWhy] = useState<Explanation | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setWhy(null); setErr(null);
    if (s) explainSession(s.id).then(setWhy).catch((e) => setErr(describeError(e)));
  }, [s]);
  const alts = (why?.best_alternatives as Array<{ slot: string; soft_change: number; because: string[] }> | undefined) || [];
  const blocked = (why?.slots_blocked_by as Record<string, number> | undefined) || {};
  const util = s ? Math.round(s.capacity_ratio * 100) : 0;
  return (
    <Drawer open={!!s} onClose={onClose} eyebrow={s ? `${s.course_id} · ${s.kind}` : undefined} title={s ? s.course_title : ""} width={480}>
      {s && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[["When", `${DAY_LABEL[s.day]}, ${periodRange(s.start_period, s.end_period)}`], ["Where", `${s.room_id} · ${s.room_name}`], ["Teacher", s.faculty_name], ["Groups", s.groups.join(", ")]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-paper p-3"><Eyebrow className="text-ink-400">{k}</Eyebrow><p className="text-sm font-semibold mt-1">{v}</p></div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between text-sm"><span className="font-semibold">Room fill</span><span className="font-mono text-xs">{s.size} / {s.room_capacity} seats ({util}%)</span></div>
            <div className="h-2.5 rounded-full bg-sunk mt-2 overflow-hidden"><motion.div className={cn("h-full rounded-full", s.is_underutilized ? "bg-saffron-500" : "bg-lagoon-500")} initial={{ width: 0 }} animate={{ width: `${Math.min(100, util)}%` }} transition={{ duration: 0.7 }} /></div>
            {s.is_underutilized && <p className="text-xs text-saffron-600 mt-1.5">Under 40% full: costs 1 soft point, kept only because no better room is free.</p>}
          </div>
          {s.week7?.moved && s.week7.regular && (
            <div className="rounded-2xl bg-saffron-50 p-4 space-y-1">
              <Eyebrow>Moved for Week 7</Eyebrow>
              <p className="text-sm text-ink-900">Normally {DAY_LABEL[s.week7.regular.day]} P{s.week7.regular.start_period} in {s.week7.regular.room_id}. An approved institute event ({s.week7.displaced_by ?? "booking"}) needs that room, so this class is held at the time shown for this week only. The regular timetable is unchanged.</p>
            </div>
          )}
          <div className="rounded-2xl bg-lagoon-50 p-4 space-y-2">
            <Eyebrow>Why is it here?</Eyebrow>
            {!why && !err && <div className="space-y-2"><Skeleton className="h-4" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div>}
            {err && <p className="text-sm text-sunrise-600">{err}</p>}
            {why?.explanation.map((l, i) => <p key={i} className="text-sm text-ink-900 leading-relaxed">{l}</p>)}
          </div>
          {alts.length > 0 && (
            <div>
              <Eyebrow className="text-ink-400">If it moved alone</Eyebrow>
              <ul className="mt-2 space-y-1.5">
                {alts.map((a) => (
                  <li key={a.slot} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                    <span className="font-mono text-xs">{a.slot}</span>
                    <span className={cn("font-semibold text-xs", a.soft_change > 0 ? "text-sunrise-600" : a.soft_change < 0 ? "text-mangrove-600" : "text-ink-600")}>{a.soft_change > 0 ? "+" : ""}{a.soft_change} penalty</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Object.keys(blocked).length > 0 && (
            <div>
              <Eyebrow className="text-ink-400">Other slots ruled out by</Eyebrow>
              <ul className="mt-2 flex flex-wrap gap-1.5">{Object.entries(blocked).map(([k, v]) => <Chip key={k} tone="stone">{k} ×{v}</Chip>)}</ul>
            </div>
          )}
          <p className="text-xs text-ink-400">Facts come from the rule checks and penalty arithmetic on the server. No AI model is involved.</p>
        </>
      )}
    </Drawer>
  );
}
