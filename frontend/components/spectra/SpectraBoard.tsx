"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarPlus, CheckCircle2, HelpCircle, Search, TriangleAlert, XCircle } from "lucide-react";
import { BookingRequest, DayOfWeek, Explanation } from "@/lib/types";
import { useApp } from "@/lib/appContext";
import { ApiError, VenueBoard, describeError, explainBooking, fetchBookings, fetchVenueBoard, scheduleManualEvent } from "@/lib/api";
import { CATEGORY_LABEL, CATEGORY_TONE, DAY_LABEL, TONES } from "@/lib/dept";
import { PERIOD_CLOCK, periodRange } from "@/lib/uiConfig";
import { Button, Card, Chip, Drawer, EmptyState, Eyebrow, PageTitle, Skeleton, Tabs } from "@/components/ui/primitives";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const FEATURES = ["projector", "pa_system", "stage", "computers", "power_benches", "accessible", "ac"];
const STATUS_STYLE: Record<string, { tone: "mangrove" | "lagoon" | "sunrise" | "stone" | "saffron"; label: string; icon: React.ReactNode }> = {
  approved: { tone: "mangrove", label: "Approved", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  alternative_offered: { tone: "lagoon", label: "Alternative offered", icon: <ArrowRight className="w-3.5 h-3.5" /> },
  rejected: { tone: "sunrise", label: "Rejected", icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { tone: "stone", label: "Cancelled by requester", icon: <XCircle className="w-3.5 h-3.5" /> },
  pending: { tone: "saffron", label: "Not decided yet", icon: <HelpCircle className="w-3.5 h-3.5" /> },
};

export function SpectraBoard() {
  const { user, revision } = useApp();
  const [tab, setTab] = useState<"decisions" | "board">("decisions");
  const [manual, setManual] = useState(false);
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Venues and Spectra, Week 7"
        title={<>Who gets which room, <span className="italic font-medium text-lagoon-700">and why</span></>}
        subtitle="Requests are decided by priority: institute events, then guest lectures, department events and clubs. A role can never claim a higher category than it holds."
        actions={<Button variant="secondary" icon={<CalendarPlus className="w-4 h-4" />} onClick={() => setManual(true)}>Schedule an event</Button>}
      />
      <Tabs id="spectra" value={tab} onChange={setTab} items={[{ id: "decisions", label: <>Decisions</> }, { id: "board", label: <>Venue board</> }]} />
      {tab === "decisions" ? <Decisions key={revision} /> : <Board key={revision} />}
      <ManualDrawer open={manual} onClose={() => setManual(false)} canAutoBook={user.role === "admin" || user.role === "department_coordinator"} />
    </div>
  );
}

/* ------------------------------------------------------------------ decisions */
function Decisions() {
  const [bookings, setBookings] = useState<BookingRequest[] | null>(null);
  const [decided, setDecided] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<BookingRequest | null>(null);
  const [why, setWhy] = useState<Explanation | string | null>(null);

  useEffect(() => {
    fetchBookings().then((b) => { setBookings(b.requests); setDecided(b.decided); }).catch((e) => setError(describeError(e)));
  }, []);
  useEffect(() => {
    setWhy(null);
    if (open && open.status !== "pending") explainBooking(open.id).then(setWhy).catch((e) => setWhy(describeError(e)));
  }, [open]);

  const list = useMemo(() => (bookings || []).filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    if (cat !== "all" && b.effective_category !== cat) return false;
    if (q.trim() && ![b.title, b.requester, b.id].some((x) => x.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [bookings, status, cat, q]);
  const count = (s: string) => (bookings || []).filter((b) => b.status === s).length;

  if (error) return <p className="text-sm text-sunrise-600">{error}</p>;
  if (!bookings) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (bookings.length === 0) return <EmptyState title="No requests to show" body="There are no requests visible to your account." />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {([["Requests", bookings.length, "text-ink-900"], ["Approved", count("approved"), "text-mangrove-500"], ["Alternatives", count("alternative_offered"), "text-lagoon-500"], ["Rejected", count("rejected"), "text-sunrise-500"], ["Cancelled", count("cancelled"), "text-stone-500"]] as const).map(([l, n, c]) => (
          <Card key={l} className="p-4"><Eyebrow className="text-ink-400">{l}</Eyebrow><p className={cn("font-display text-4xl font-semibold mt-1", c)}>{n}</p></Card>
        ))}
      </div>
      {!decided && <p className="text-sm text-saffron-600 bg-saffron-50 rounded-xl px-4 py-3">These requests have not been decided yet. An Admin runs step 3 on the Overview page.</p>}
      <Card className="p-3 flex flex-wrap items-center gap-3">
        <div className="relative"><Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a request" aria-label="Find a request" className="h-10 pl-9 pr-3 rounded-xl bg-paper border border-line text-sm w-56" /></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="h-10 px-3 rounded-xl bg-paper border border-line text-sm font-semibold cursor-pointer">
          <option value="all">Any decision</option>{Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="h-10 px-3 rounded-xl bg-paper border border-line text-sm font-semibold cursor-pointer">
          <option value="all">Any category</option>{Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="ml-auto text-sm text-ink-600">{list.length} shown</span>
      </Card>
      <ul className="space-y-3">
        {list.map((b, i) => {
          const st = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
          const ct = TONES[CATEGORY_TONE[b.effective_category] || "stone"];
          return (
            <motion.li key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <button onClick={() => setOpen(b)} className="w-full text-left cursor-pointer group">
                <Card className="p-4 pl-5 relative overflow-hidden group-hover:border-lagoon-500 transition-colors">
                  <span className={cn("absolute left-0 top-0 bottom-0 w-1.5", ct.bar)} />
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-medium text-ink-600">{b.id}</span>
                    <Chip tone={CATEGORY_TONE[b.effective_category] || "stone"}>{CATEGORY_LABEL[b.effective_category] || b.effective_category}</Chip>
                    {b.effective_category !== b.requested_category && <Chip tone="sunrise" className="!font-medium">asked for {CATEGORY_LABEL[b.requested_category]?.toLowerCase()}</Chip>}
                    <Chip tone={st.tone} className="ml-auto">{st.icon}{st.label}</Chip>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="font-display text-lg font-semibold">{b.title}</h3>
                    <p className="text-sm text-ink-600">{b.requester} · {b.attendance} people</p>
                  </div>
                  <p className="font-mono text-xs text-ink-600 mt-1.5">
                    {b.status === "approved" || b.status === "alternative_offered"
                      ? `${b.day} ${periodRange(b.start_period, b.end_period)} in ${b.assigned_room}`
                      : `asked ${(b.windows || []).map((w) => `${w.day} P${w.from_period}-P${w.to_period}`).join(" or ")}`}
                    {b.requested_room && b.requested_room !== b.assigned_room && <span className="text-ink-400"> · wished {b.requested_room}</span>}
                  </p>
                  <p className="text-sm text-ink-600 mt-2 line-clamp-2">{b.reason}</p>
                </Card>
              </button>
            </motion.li>
          );
        })}
      </ul>
      <Drawer open={!!open} onClose={() => setOpen(null)} eyebrow={open ? `${open.id} · ${open.requester}` : undefined} title={open?.title || ""}>
        {open && (
          <>
            <Chip tone={(STATUS_STYLE[open.status] || STATUS_STYLE.pending).tone}>{(STATUS_STYLE[open.status] || STATUS_STYLE.pending).label}</Chip>
            <div className="rounded-2xl bg-lagoon-50 p-4 space-y-2">
              <Eyebrow>The reasoning</Eyebrow>
              <p className="text-sm">{open.reason}</p>
              {open.displaced_class && <p className="text-sm text-saffron-600">Week 7 only: class {open.displaced_class} was moved to another legal slot.</p>}
            </div>
            {open.status !== "pending" && (
              <div>
                <Eyebrow className="text-ink-400">Priority facts</Eyebrow>
                <div className="mt-2 space-y-2 text-sm">
                  {why === null && <Skeleton className="h-16" />}
                  {typeof why === "string" && <p className="text-sunrise-600">{why}</p>}
                  {why && typeof why !== "string" && why.explanation.map((l, i) => <p key={i} className="leading-relaxed">{l}</p>)}
                </div>
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}

/* ---------------------------------------------------------------- venue board */
const colOf = (p: number) => (p <= 5 ? p + 1 : p + 2); // column 1 is the room label, column 7 the lunch band
function Board() {
  const [data, setData] = useState<VenueBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<DayOfWeek>("THU");
  const [onlyEvents, setOnlyEvents] = useState(true);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => { fetchVenueBoard().then(setData).catch((e) => setError(describeError(e))); }, []);
  if (error) return <p className="text-sm text-sunrise-600">{error}</p>;
  if (!data) return <Skeleton className="h-[480px]" />;

  const rooms = data.rooms.filter((r) => !onlyEvents || r.events_ok);
  const cols = "132px repeat(5, minmax(46px, 1fr)) 18px repeat(4, minmax(46px, 1fr)) repeat(4, minmax(46px, 1fr))";
  const rowOf = (rid: string) => rooms.findIndex((r) => r.id === rid) + 2;
  const evCount = data.events.filter((e) => e.day === day).length;

  return (
    <div className="space-y-4">
      <Card className="p-3 flex flex-wrap items-center gap-3">
        <Tabs id="boardday" value={day} onChange={setDay} items={data.days.map((d) => ({ id: d, label: <>{d}</> }))} />
        <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer ml-2"><input type="checkbox" checked={onlyEvents} onChange={(e) => setOnlyEvents(e.target.checked)} />Only rooms that can host events</label>
        <span className="ml-auto text-sm text-ink-600">{evCount} event{evCount === 1 ? "" : "s"} on {DAY_LABEL[day]}</span>
      </Card>
      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[1020px] grid gap-y-1 gap-x-0.5 relative" style={{ gridTemplateColumns: cols, gridTemplateRows: `auto repeat(${rooms.length}, 34px)` }}>
          <div />
          {Array.from({ length: 13 }, (_, i) => i + 1).map((p) => (
            <div key={p} style={{ gridColumn: colOf(p), gridRow: 1 }} className={cn("pb-1.5 text-center", p >= 10 && "bg-plum-50/60 rounded-t-md")}>
              <p className="font-mono text-[10px] font-medium text-lagoon-700">P{p}</p><p className="font-mono text-[9px] text-ink-400">{PERIOD_CLOCK[p]}</p>
            </div>
          ))}
          <div style={{ gridColumn: 7, gridRow: `1 / span ${rooms.length + 1}` }} className="rounded-md bg-sunk/70" title="Lunch 13:00 to 14:00" />
          {rooms.map((r, i) => (
            <React.Fragment key={r.id}>
              <div style={{ gridColumn: 1, gridRow: i + 2 }} className="flex items-center pr-2 min-w-0" title={`${r.name} · ${r.capacity} seats`}>
                <span className="font-mono text-[11px] font-medium truncate">{r.id}</span><span className="ml-auto text-[10px] text-ink-400">{r.capacity}</span>
              </div>
              {Array.from({ length: 13 }, (_, k) => k + 1).map((p) => (
                <div key={p} style={{ gridColumn: colOf(p), gridRow: i + 2 }} className={cn("rounded-[5px] border border-line/50", p >= 10 ? "bg-plum-50/40" : "bg-paper/60")} aria-hidden />
              ))}
            </React.Fragment>
          ))}
          {data.closures.filter((c) => c.day === day && rowOf(c.room_id) > 1).map((c, i) => {
            const ps = [...c.periods].sort((a, b) => a - b);
            return <div key={"cl" + i} style={{ gridColumn: `${colOf(ps[0])} / ${colOf(ps[ps.length - 1]) + 1}`, gridRow: rowOf(c.room_id) }} title={`Closed: ${c.reason}`}
              className="z-[2] rounded-[5px] bg-[repeating-linear-gradient(135deg,var(--color-line)_0_5px,transparent_5px_10px)] border border-line-strong/60 flex items-center justify-center text-[9px] font-mono text-ink-600">closed</div>;
          })}
          {data.classes.filter((c) => c.day === day && rowOf(c.room_id) > 1).map((c) => (
            <div key={c.session_id} style={{ gridColumn: `${colOf(c.start)} / ${colOf(c.end) + 1}`, gridRow: rowOf(c.room_id) }}
              title={`${c.course_id} (${c.kind}) for ${c.groups.join(", ")}${c.week7_override ? " · moved for Week 7" : ""}`}
              className={cn("z-[2] rounded-[5px] px-1.5 flex items-center overflow-hidden text-[10px] font-mono font-medium", c.week7_override ? "bg-saffron-50 text-saffron-600 border border-saffron-500/50" : "bg-stone-50 text-stone-600 border border-stone-500/20")}>
              <span className="truncate">{c.course_id}</span>
            </div>
          ))}
          {data.events.filter((e) => e.day === day && rowOf(e.room_id) > 1).map((e) => {
            const tone = TONES[CATEGORY_TONE[e.category] || "plum"];
            return (
              <motion.div key={e.id} layout style={{ gridColumn: `${colOf(e.start)} / ${colOf(e.end) + 1}`, gridRow: rowOf(e.room_id) }}
                onMouseEnter={() => setHover(e.id)} onMouseLeave={() => setHover(null)}
                initial={{ scaleX: 0.6, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
                title={`${e.title} · ${e.requester} · ${periodRange(e.start, e.end)}${e.status !== "approved" ? ` · ${e.status.replace(/_/g, " ")}` : ""}`}
                className={cn("z-[3] origin-left rounded-[6px] px-2 flex items-center overflow-hidden text-[11px] font-semibold text-raised shadow-card cursor-default", tone.bar, e.status !== "approved" && e.source === "spectra" && "opacity-80", hover === e.id && "ring-2 ring-ink-900/30")}>
                <span className="truncate">{e.title}</span>
              </motion.div>
            );
          })}
        </div>
        {rooms.length === 0 && <p className="text-sm text-ink-600 py-4 text-center">No rooms to show.</p>}
      </Card>
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-600">
        {Object.entries(CATEGORY_LABEL).map(([k, v]) => <span key={k} className="flex items-center gap-1.5"><span className={cn("w-3 h-3 rounded-sm", TONES[CATEGORY_TONE[k]].bar)} />{v}</span>)}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-stone-50 border border-stone-500/30" />Regular class</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-saffron-50 border border-saffron-500/60" />Class moved for Week 7</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[repeating-linear-gradient(135deg,var(--color-line)_0_3px,transparent_3px_6px)] border border-line-strong" />Closed</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- manual events */
function ManualDrawer({ open, onClose, canAutoBook }: { open: boolean; onClose: () => void; canAutoBook: boolean }) {
  const { ref, refresh } = useApp();
  const toast = useToast();
  const rooms = useMemo(() => (ref?.rooms || []).filter((r) => r.allowed_uses.includes("event")), [ref]);
  const [f, setF] = useState({ title: "", category: "club_event", attendance: 60, duration: 2, day: "THU" as DayOfWeek, start: 10, room: "SH-1", groups: "" });
  const [needs, setNeeds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<{ text: string; rules: string[] } | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setProblem(null);
    try {
      const s = await scheduleManualEvent({
        title: f.title || "Campus event", room_id: f.room, day: f.day, start_period: f.start, end_period: f.start + f.duration - 1,
        attendance: f.attendance, needs, mandatory_for_groups: f.groups.split(/[ ,]+/).map((g) => g.trim().toUpperCase()).filter(Boolean), requested_category: f.category,
      });
      toast.success(s.status === "APPROVED" ? `${s.id} is booked in ${f.room}.` : `${s.id} passed every rule and is waiting for an approver.`);
      refresh(); onClose();
    } catch (err) {
      setProblem({ text: describeError(err), rules: err instanceof ApiError ? err.ruleIds : [] });
    } finally { setBusy(false); }
  }, [f, needs, toast, refresh, onClose]);

  const input = "w-full h-10 px-3 rounded-xl bg-paper border border-line text-sm";
  return (
    <Drawer open={open} onClose={onClose} eyebrow="Manual scheduling" title="Schedule an event" width={500}
      footer={<div className="flex items-center justify-between gap-3"><span className="text-xs text-ink-600">{canAutoBook ? "A valid event is booked immediately." : "A valid event goes to an approver."}</span><Button type="submit" form="manual-form" loading={busy}>Check rules and schedule</Button></div>}>
      <form id="manual-form" onSubmit={submit} className="space-y-4">
        <label className="block"><span className="text-xs font-semibold text-ink-600">Title</span><input required value={f.title} onChange={(e) => set("title", e.target.value)} className={input} placeholder="e.g. Robotics workshop" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-semibold text-ink-600">Category (capped by your role)</span>
            <select value={f.category} onChange={(e) => set("category", e.target.value)} className={input}>{Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="block"><span className="text-xs font-semibold text-ink-600">People</span><input type="number" min={1} value={f.attendance} onChange={(e) => set("attendance", Number(e.target.value))} className={input} /></label>
        </div>
        <label className="block"><span className="text-xs font-semibold text-ink-600">Room</span>
          <select value={f.room} onChange={(e) => set("room", e.target.value)} className={input}>{rooms.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.name} ({r.capacity}{r.accessible ? ", accessible" : ""})</option>)}</select></label>
        <div className="grid grid-cols-3 gap-3">
          <label className="block"><span className="text-xs font-semibold text-ink-600">Day</span><select value={f.day} onChange={(e) => set("day", e.target.value as DayOfWeek)} className={input}>{(ref?.calendar.days || []).map((d) => <option key={d}>{d}</option>)}</select></label>
          <label className="block"><span className="text-xs font-semibold text-ink-600">Start</span><select value={f.start} onChange={(e) => set("start", Number(e.target.value))} className={input}>{Array.from({ length: 13 }, (_, i) => i + 1).map((p) => <option key={p} value={p}>P{p} {PERIOD_CLOCK[p]}</option>)}</select></label>
          <label className="block"><span className="text-xs font-semibold text-ink-600">Hours</span><input type="number" min={1} max={13} value={f.duration} onChange={(e) => set("duration", Math.max(1, Number(e.target.value)))} className={input} /></label>
        </div>
        <label className="block"><span className="text-xs font-semibold text-ink-600">Compulsory for groups (optional)</span><input value={f.groups} onChange={(e) => set("groups", e.target.value)} className={input} placeholder="CSE-3, ECE-3" /></label>
        <fieldset><legend className="text-xs font-semibold text-ink-600 mb-1.5">Needs</legend>
          <div className="flex flex-wrap gap-2">{FEATURES.map((n) => (
            <button type="button" key={n} onClick={() => setNeeds((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))} aria-pressed={needs.includes(n)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer", needs.includes(n) ? "bg-lagoon-700 text-raised border-lagoon-700" : "bg-raised text-ink-600 border-line hover:border-line-strong")}>{n.replace(/_/g, " ")}</button>
          ))}</div></fieldset>
        {problem && (
          <div className="rounded-xl bg-sunrise-50 text-sunrise-600 p-3.5 text-sm space-y-1" role="alert">
            <p className="font-semibold flex items-center gap-1.5"><TriangleAlert className="w-4 h-4" />Not scheduled. Nothing was booked.</p>
            <p>{problem.text}</p>
            {problem.rules.length > 0 && <p className="font-mono text-xs">Rules: {problem.rules.join(", ")}</p>}
          </div>
        )}
      </form>
    </Drawer>
  );
}
