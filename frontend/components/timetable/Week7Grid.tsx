"use client";

import React, { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { DayOfWeek, ScheduledSession, Week7Closure, Week7Event } from "@/lib/types";
import { CATEGORY_LABEL, CATEGORY_TONE, DAY_LABEL, TONES } from "@/lib/dept";
import { PERIOD_CLOCK, periodRange } from "@/lib/uiConfig";
import { cleanReason } from "@/lib/reason";
import { Chip, Drawer, Eyebrow, Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
// grid columns: 1 day, 2-6 = P1-P5, 7 lunch band, 8-11 = P6-P9, 12 evening band, 13-16 = P10-P13
const colOf = (p: number) => (p <= 5 ? p + 1 : p <= 9 ? p + 2 : p + 3);
const COLS = "88px repeat(5, minmax(108px, 1fr)) 26px repeat(4, minmax(108px, 1fr)) 26px repeat(4, minmax(108px, 1fr))";

type Item = { kind: "class"; s: ScheduledSession } | { kind: "event"; e: Week7Event };
interface Cell { start: number; end: number; items: Item[] }

/** Items with the same time stack inside one cell (parallel electives); overlapping cells go on separate lanes. */
function lanesFor(items: Item[]): Cell[][] {
  const cells = new Map<string, Cell>();
  for (const it of items) {
    const start = it.kind === "class" ? it.s.start_period : it.e.start;
    const end = it.kind === "class" ? it.s.end_period : it.e.end;
    const k = `${start}-${end}`;
    const c = cells.get(k) || { start, end, items: [] };
    c.items.push(it);
    cells.set(k, c);
  }
  const lanes: Cell[][] = [];
  for (const c of [...cells.values()].sort((a, b) => a.start - b.start || a.end - b.end)) {
    const lane = lanes.find((l) => l[l.length - 1].end < c.start);
    if (lane) lane.push(c); else lanes.push([c]);
  }
  return lanes.length ? lanes : [[]];
}

function EventBlock({ e, showRoom, onOpen }: { e: Week7Event; showRoom: boolean; onOpen: (e: Week7Event) => void }) {
  const tone = TONES[CATEGORY_TONE[e.category] || "plum"];
  const alt = e.status === "alternative_offered";
  return (
    <button onClick={() => onOpen(e)}
      aria-label={`${e.title}, ${CATEGORY_LABEL[e.category] || "event"}, ${DAY_LABEL[e.day]} periods ${e.start} to ${e.end}, room ${e.room_id}${alt ? ", alternative offered" : ""}`}
      className={cn("relative w-full flex-1 text-left overflow-hidden rounded-xl pl-3 pr-2 py-2 cursor-pointer flex flex-col justify-between gap-1 min-h-[84px] hover:shadow-card border",
        tone.soft, alt ? "border-dashed border-ink-400/60" : "border-transparent")}>
      <span className={cn("absolute left-0 top-0 bottom-0 w-[5px]", tone.bar)} />
      <span className="flex items-center gap-1.5 flex-wrap">
        <span className={cn("font-mono text-[10px] font-medium tracking-wide uppercase", tone.text)}>{CATEGORY_LABEL[e.category] || "Event"}</span>
        {alt && <span className="font-mono text-[9px] px-1 rounded bg-deep/80 text-onbrand">ALTERNATIVE</span>}
      </span>
      <span className="font-display text-[14px] font-semibold leading-tight line-clamp-2">{e.title}</span>
      <span className="text-[11px] text-ink-600 flex items-center gap-1.5 truncate">
        <MapPin className="w-3 h-3 shrink-0" />{showRoom ? e.room_id : e.requester}<span className="text-ink-400">·</span><span className="font-mono">{periodRange(e.start, e.end)}</span>
      </span>
    </button>
  );
}

export function Week7Grid({ classes, events, closures, loading, pivot, renderClass }: {
  classes: ScheduledSession[]; events: Week7Event[]; closures: Week7Closure[]; loading: boolean; pivot: "group" | "faculty" | "room";
  renderClass: (s: ScheduledSession, tall: boolean) => React.ReactNode;
}) {
  const [open, setOpen] = useState<Week7Event | null>(null);

  const { rows, tracks } = useMemo(() => {
    let next = 2;
    const tracks = ["auto"];
    const rows = DAYS.map((d, i) => {
      const items: Item[] = [...classes.filter((s) => s.day === d).map((s) => ({ kind: "class" as const, s })),
        ...events.filter((e) => e.day === d).map((e) => ({ kind: "event" as const, e }))];
      const lanes = lanesFor(items);
      const out = { day: d, first: next, lanes, nClasses: items.filter((x) => x.kind === "class").length, nEvents: items.filter((x) => x.kind === "event").length };
      lanes.forEach(() => tracks.push("minmax(92px, auto)"));
      next += lanes.length;
      if (i < DAYS.length - 1) { tracks.push("10px"); next += 1; }      // spacer between days
      return out;
    });
    return { rows, tracks };
  }, [classes, events]);
  const lastRow = tracks.length;
  const closed = (d: DayOfWeek, p: number) => closures.find((c) => c.day === d && c.periods.includes(p));

  if (loading && classes.length === 0 && events.length === 0) {
    return <div className="min-w-[1500px] space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  }
  return (
    <>
      <div className="grid gap-1.5 min-w-[1500px] relative" aria-label="Week 7 timetable"
        style={{ gridTemplateColumns: COLS, gridTemplateRows: tracks.join(" ") }}>
        {rows.map((r, i) => (
          <div key={`band-${r.day}`} aria-hidden style={{ gridColumn: "1 / -1", gridRow: `${r.first} / span ${r.lanes.length}`, margin: -5 }}
            className={cn("rounded-2xl border border-line", i % 2 ? "bg-paper" : "bg-raised")} />
        ))}
        <div />
        {PERIODS.map((p) => (
          <div key={p} style={{ gridColumn: colOf(p), gridRow: 1 }} className="px-1 pb-1">
            <p className={cn("font-mono text-[11px] font-medium tracking-wider", p >= 10 ? "text-plum-600" : "text-lagoon-700")}>P{p}{p >= 10 && <span className="ml-1 text-[9px] text-ink-400">EVENTS</span>}</p>
            <p className="font-mono text-[10px] text-ink-400">{PERIOD_CLOCK[p]}</p>
          </div>
        ))}
        <div style={{ gridColumn: 7, gridRow: `1 / span ${lastRow}` }} className="rounded-xl bg-sunk/80 flex items-center justify-center overflow-hidden" title="Lunch 13:00 to 14:00: no classes">
          <span className="font-mono text-[10px] tracking-[0.3em] text-ink-400 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">LUNCH 13:00 - 14:00</span>
        </div>
        <div style={{ gridColumn: 12, gridRow: `1 / span ${lastRow}` }} className="rounded-xl bg-plum-50/70 flex items-center justify-center overflow-hidden" title="From 18:00 only events can be booked">
          <span className="font-mono text-[10px] tracking-[0.3em] text-plum-600 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">EVENING · EVENTS ONLY</span>
        </div>
        {rows.map((r) => (
          <React.Fragment key={r.day}>
            <div style={{ gridColumn: 1, gridRow: `${r.first} / span ${r.lanes.length}` }} className={cn("sticky left-0 z-[3] flex flex-col justify-center pl-3 pr-2 border-l-4 border-lagoon-500/70 rounded-l-xl", rows.indexOf(r) % 2 ? "bg-paper" : "bg-raised")}>
              <span className="font-display text-[22px] font-semibold leading-none">{r.day}</span>
              <span className="text-[11px] text-ink-400 mt-1">{r.nClasses} class{r.nClasses === 1 ? "" : "es"} · {r.nEvents} event{r.nEvents === 1 ? "" : "s"}</span>
            </div>
            {r.lanes.map((_, li) => PERIODS.map((p) => {
              const c = li === 0 ? closed(r.day, p) : undefined;
              return (
                <div key={`${r.day}-${li}-${p}`} style={{ gridColumn: colOf(p), gridRow: r.first + li }} aria-hidden title={c ? `Closed: ${c.reason}` : undefined}
                  className={cn("rounded-xl border border-dashed", c ? "border-sunrise-500/40 bg-sunrise-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(228,87,46,0.10)_6px,rgba(228,87,46,0.10)_12px)]" : p >= 10 ? "border-plum-500/20 bg-plum-50/30" : "border-line/80")} />
              );
            }))}
            {r.lanes.map((lane, li) => lane.map((cell) => (
              <div key={`${r.day}-${li}-${cell.start}-${cell.end}`}
                style={{ gridColumn: `${colOf(cell.start)} / ${colOf(cell.end) + 1}`, gridRow: r.first + li }} className="z-[2] flex flex-col gap-1.5">
                {cell.items.map((it) => it.kind === "class"
                  ? <React.Fragment key={it.s.id}>{renderClass(it.s, cell.items.length === 1)}</React.Fragment>
                  : <EventBlock key={it.e.id} e={it.e} showRoom={pivot !== "room"} onOpen={setOpen} />)}
              </div>
            )))}
          </React.Fragment>
        ))}
      </div>
      <Drawer open={!!open} onClose={() => setOpen(null)} eyebrow={open ? `${CATEGORY_LABEL[open.category] || "Event"} · ${open.id}` : undefined} title={open?.title ?? ""} width={460}>
        {open && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[["When", `${DAY_LABEL[open.day]}, ${periodRange(open.start, open.end)}`], ["Where", open.room_id], ["Requested by", open.requester], ["Status", open.status === "approved" ? "Approved" : "Alternative offered"]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-paper p-3"><Eyebrow className="text-ink-400">{k}</Eyebrow><p className="text-sm font-semibold mt-1">{v}</p></div>
              ))}
            </div>
            {open.reason && (
              <div className="rounded-2xl bg-lagoon-50 p-4 space-y-2"><Eyebrow>Why this decision</Eyebrow><p className="text-sm text-ink-900 leading-relaxed">{cleanReason(open.reason)}</p></div>
            )}
            <Chip tone="plum">Week 7 only</Chip>
          </>
        )}
      </Drawer>
    </>
  );
}
