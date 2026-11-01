"use client";

import React, { useMemo, useState } from "react";
import { CircleCheck, Plus, TriangleAlert } from "lucide-react";
import { ReferenceData } from "@/lib/types";
import { Button, Card, Eyebrow } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const field = "w-full h-10 px-3 rounded-xl bg-paper border border-line text-sm";

function spans(periods: number[]): string {
  const p = [...periods].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < p.length;) {
    let j = i;
    while (j + 1 < p.length && p[j + 1] === p[j] + 1) j++;
    out.push(i === j ? `P${p[i]}` : `P${p[i]}-P${p[j]}`);
    i = j + 1;
  }
  return out.join(", ");
}

/** Plain-language reading of a change file, plus anything in it the app will refuse, before anything is sent. */
export function summarise(text: string, ref: ReferenceData | null): { lines: string[]; issues: string[] } {
  const lines: string[] = [];
  const issues: string[] = [];
  if (!text.trim()) return { lines, issues };
  let doc: { changes?: Array<Record<string, unknown>>; dataset?: string };
  try { doc = JSON.parse(text); } catch (e) { return { lines, issues: [`This is not valid JSON (${(e as Error).message.slice(0, 80)}).`] }; }
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.changes)) return { lines, issues: ['The file needs a "changes" list: {"changes": [ ... ]}.'] };
  if (doc.changes.length === 0) issues.push("The change list is empty, so there is nothing to apply.");
  if (ref && doc.dataset && doc.dataset !== ref.dataset_id) issues.push(`This file is for dataset ${doc.dataset}, but ${ref.dataset_id} is loaded.`);
  const fac = new Map((ref?.faculty || []).map((f) => [f.id, f]));
  const rooms = new Map((ref?.rooms || []).map((r) => [r.id, r]));
  const sess = new Map((ref?.sessions || []).map((s) => [s.id, s]));
  const courses = new Map((ref?.courses || []).map((c) => [c.id, c]));
  const groups = new Set((ref?.student_groups || []).map((g) => g.id));
  const days = new Set(ref?.calendar.days || DAYS);
  const addedFac = new Set<string>();
  const addedSess = new Set<string>();
  doc.changes.forEach((c, i) => {
    const n = `Change ${i + 1}`;
    const when = () => {
      const d = (c.days as string[]) || [];
      const p = (c.periods as number[]) || [];
      if (!d.length || d.some((x) => !days.has(x))) issues.push(`${n}: days must be some of ${[...days].join(", ")}.`);
      if (!p.length || p.some((x) => !Number.isInteger(x) || x < 1 || x > 13)) issues.push(`${n}: periods must be whole numbers from 1 to 13.`);
      return `${d.join(", ")} ${spans(p)}`;
    };
    const why = c.reason ? ` (${c.reason})` : "";
    switch (c.type) {
      case "faculty_unavailable": {
        const f = fac.get(c.faculty_id as string);
        if (!f && !addedFac.has(c.faculty_id as string)) issues.push(`${n}: there is no teacher ${c.faculty_id}.`);
        lines.push(`${f ? f.name : c.faculty_id} cannot teach on ${when()}${why}`);
        break;
      }
      case "room_unavailable": {
        const r = rooms.get(c.room_id as string);
        if (!r) issues.push(`${n}: there is no room ${c.room_id}.`);
        lines.push(`${c.room_id}${r ? ` (${r.name})` : ""} is closed on ${when()}${why}`);
        break;
      }
      case "add_faculty": {
        const f = (c.faculty || {}) as { id?: string; name?: string };
        if (!f.id) issues.push(`${n}: the new teacher needs an id.`);
        else if (fac.has(f.id) || addedFac.has(f.id)) issues.push(`${n}: teacher ${f.id} already exists.`);
        if (f.id) addedFac.add(f.id);
        lines.push(`New teacher ${f.name || ""} (${f.id})`);
        break;
      }
      case "add_session": {
        const s = (c.session || {}) as { id?: string; course_id?: string; kind?: string; groups?: string[]; faculty_id?: string; fixed_slot?: { day: string; start_period: number } | null; duration?: number };
        const need = ["id", "course_id", "kind", "groups", "faculty_id", "size", "duration", "room_types"].filter((k) => !(k in s) && !(k in ((c.session || {}) as object)));
        if (need.length) issues.push(`${n}: the new session is missing ${need.join(", ")}.`);
        if (s.id && (sess.has(s.id) || addedSess.has(s.id))) issues.push(`${n}: session ${s.id} already exists.`);
        if (s.id) addedSess.add(s.id);
        if (s.faculty_id && !fac.has(s.faculty_id) && !addedFac.has(s.faculty_id)) issues.push(`${n}: there is no teacher ${s.faculty_id}.`);
        const bad = (s.groups || []).filter((g) => !groups.has(g));
        if (bad.length) issues.push(`${n}: unknown student groups ${bad.join(", ")}.`);
        lines.push(`New ${s.kind || "session"} ${s.id}: ${courses.get(s.course_id || "")?.title || s.course_id} for ${(s.groups || []).join(", ")}, ${s.duration}h${s.fixed_slot ? `, pinned to ${s.fixed_slot.day} P${s.fixed_slot.start_period}` : ""}`);
        break;
      }
      case "remove_session": {
        const s = sess.get(c.session_id as string);
        if (!s && !addedSess.has(c.session_id as string)) issues.push(`${n}: there is no session ${c.session_id}.`);
        lines.push(`Remove ${c.session_id}${s ? ` (${courses.get(s.course_id)?.title || s.course_id}, ${s.kind}, ${s.groups.join(", ")})` : ""}`);
        break;
      }
      default:
        issues.push(`${n}: "${String(c.type)}" is not a change type. Use faculty_unavailable, room_unavailable, add_faculty, add_session or remove_session.`);
    }
  });
  return { lines, issues };
}

export function ChangePreview({ text, refData }: { text: string; refData: ReferenceData | null }) {
  const { lines, issues } = useMemo(() => summarise(text, refData), [text, refData]);
  if (!lines.length && !issues.length) return null;
  return (
    <div className="space-y-2" aria-live="polite">
      {issues.length > 0 && (
        <div className="rounded-xl bg-sunrise-50 text-sunrise-600 px-4 py-3 text-sm space-y-1" role="alert">
          <p className="font-semibold flex items-center gap-1.5"><TriangleAlert className="w-4 h-4" />This file will not be accepted yet:</p>
          {issues.map((m, i) => <p key={i}>• {m}</p>)}
        </div>
      )}
      {lines.length > 0 && (
        <div className="rounded-xl bg-paper px-4 py-3 text-sm space-y-1">
          <Eyebrow className="text-ink-400 flex items-center gap-1.5">{issues.length === 0 && <CircleCheck className="w-3.5 h-3.5 text-mangrove-600" />}What this file does</Eyebrow>
          {lines.map((l, i) => <p key={i} className="text-ink-900">{i + 1}. {l}</p>)}
        </div>
      )}
    </div>
  );
}

type Kind = "faculty_unavailable" | "room_unavailable" | "remove_session" | "add_session";
const KIND_LABEL: Record<Kind, string> = { faculty_unavailable: "A teacher cannot teach", room_unavailable: "A room is closed", remove_session: "Remove a session", add_session: "Add a session" };

/** Builds change-file entries from form fields, so a test file needs no hand-written JSON. */
export function ChangeBuilder({ refData, text, setText }: { refData: ReferenceData | null; text: string; setText: (t: string) => void }) {
  const [kind, setKind] = useState<Kind>("faculty_unavailable");
  const [facultyId, setFacultyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [days, setDays] = useState<string[]>(["MON"]);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(9);
  const [reason, setReason] = useState("");
  const [courseId, setCourseId] = useState("");
  const [sKind, setSKind] = useState("lecture");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [duration, setDuration] = useState(1);
  const [pin, setPin] = useState(false);
  const [pinDay, setPinDay] = useState("WED");
  const [pinStart, setPinStart] = useState(3);
  const [error, setError] = useState<string | null>(null);

  if (!refData) return null;
  const faculty = refData.faculty;
  const toggle = (list: string[], v: string, set: (l: string[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const add = () => {
    setError(null);
    let entry: Record<string, unknown>;
    const periods = Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
    if (kind === "faculty_unavailable" || kind === "room_unavailable") {
      if ((kind === "faculty_unavailable" ? !facultyId : !roomId)) { setError(kind === "faculty_unavailable" ? "Choose the teacher." : "Choose the room."); return; }
      if (!days.length) { setError("Choose at least one day."); return; }
      if (!periods.length) { setError("The last period must not be before the first."); return; }
      entry = kind === "faculty_unavailable"
        ? { type: kind, faculty_id: facultyId, days, periods, reason: reason || "Unavailable" }
        : { type: kind, room_id: roomId, days, periods, reason: reason || "Closed" };
    } else if (kind === "remove_session") {
      if (!sessionId) { setError("Choose the session to remove."); return; }
      entry = { type: kind, session_id: sessionId };
    } else {
      if (!courseId || !facultyId || groupIds.length === 0) { setError("Choose the course, the teacher and at least one student group."); return; }
      const template = refData.sessions.find((s) => s.course_id === courseId && s.kind === sKind) || refData.sessions.find((s) => s.course_id === courseId);
      const size = refData.student_groups.filter((g) => groupIds.includes(g.id)).reduce((n, g) => n + g.size, 0);
      let n = 1; const used = new Set(refData.sessions.map((s) => s.id));
      while (used.has(`${courseId}-NEW-${n}`)) n++;
      entry = { type: kind, session: { id: `${courseId}-NEW-${n}`, course_id: courseId, kind: sKind, groups: groupIds, faculty_id: facultyId, size, duration,
        room_types: template?.room_types || (sKind === "lab" ? ["lab_cs"] : ["classroom", "lecture_hall"]), needs_accessible: false, basket_slot: null,
        fixed_slot: pin ? { day: pinDay, start_period: pinStart } : null } };
    }
    let doc: { changes: unknown[] } = { changes: [] };
    try { const p = JSON.parse(text); if (p && Array.isArray(p.changes)) doc = p; } catch { /* start a new file */ }
    doc.changes.push(entry);
    setText(JSON.stringify(doc, null, 2));
  };

  return (
    <Card className="p-4 space-y-3 bg-paper/60 border-dashed">
      <div><h3 className="font-display text-lg font-semibold">Build a change without writing JSON</h3><p className="text-sm text-ink-600">Fill in the form and add it to the file below. Add as many changes as you like, then propose the repair.</p></div>
      <label className="block max-w-sm"><span className="text-xs font-semibold text-ink-600">What changes?</span>
        <select value={kind} onChange={(e) => { setKind(e.target.value as Kind); setError(null); }} className={field}>{(Object.keys(KIND_LABEL) as Kind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></label>

      {(kind === "faculty_unavailable" || kind === "add_session") && (
        <label className="block max-w-sm"><span className="text-xs font-semibold text-ink-600">Teacher</span>
          <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} className={field}><option value="">Choose…</option>{faculty.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.id}, {f.department})</option>)}</select></label>
      )}
      {kind === "room_unavailable" && (
        <label className="block max-w-sm"><span className="text-xs font-semibold text-ink-600">Room</span>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={field}><option value="">Choose…</option>{refData.rooms.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.name} ({r.capacity})</option>)}</select></label>
      )}
      {(kind === "faculty_unavailable" || kind === "room_unavailable") && (
        <>
          <div><span className="text-xs font-semibold text-ink-600">Days</span>
            <div className="flex flex-wrap gap-1.5 mt-1">{(refData.calendar.days || DAYS).map((d) => (
              <button type="button" key={d} aria-pressed={days.includes(d)} onClick={() => toggle(days, d, setDays)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer", days.includes(d) ? "bg-primary text-onprimary border-primary" : "bg-raised text-ink-600 border-line hover:border-line-strong")}>{d}</button>))}</div></div>
          <div className="flex flex-wrap items-end gap-3">
            <label><span className="text-xs font-semibold text-ink-600">From period</span><select value={from} onChange={(e) => setFrom(Number(e.target.value))} className={cn(field, "w-28")}>{Array.from({ length: 9 }, (_, i) => i + 1).map((p) => <option key={p} value={p}>P{p}</option>)}</select></label>
            <label><span className="text-xs font-semibold text-ink-600">To period</span><select value={to} onChange={(e) => setTo(Number(e.target.value))} className={cn(field, "w-28")}>{Array.from({ length: 9 }, (_, i) => i + 1).map((p) => <option key={p} value={p}>P{p}</option>)}</select></label>
            <label className="flex-1 min-w-[200px]"><span className="text-xs font-semibold text-ink-600">Reason (optional)</span><input value={reason} onChange={(e) => setReason(e.target.value)} className={field} placeholder="Conference travel" /></label>
          </div>
        </>
      )}
      {kind === "remove_session" && (
        <label className="block max-w-xl"><span className="text-xs font-semibold text-ink-600">Session</span>
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className={field}><option value="">Choose…</option>{refData.sessions.map((s) => <option key={s.id} value={s.id}>{s.id} · {s.course_id} {s.kind} · {s.groups.join(", ")}</option>)}</select></label>
      )}
      {kind === "add_session" && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <label><span className="text-xs font-semibold text-ink-600">Course</span><select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={field}><option value="">Choose…</option>{refData.courses.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.title}</option>)}</select></label>
            <label><span className="text-xs font-semibold text-ink-600">Kind</span><select value={sKind} onChange={(e) => setSKind(e.target.value)} className={field}>{["lecture", "tutorial", "lab"].map((k) => <option key={k}>{k}</option>)}</select></label>
            <label><span className="text-xs font-semibold text-ink-600">Hours</span><input type="number" min={1} max={4} value={duration} onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))} className={field} /></label>
          </div>
          <div><span className="text-xs font-semibold text-ink-600">Student groups</span>
            <div className="flex flex-wrap gap-1.5 mt-1">{refData.student_groups.map((g) => (
              <button type="button" key={g.id} aria-pressed={groupIds.includes(g.id)} onClick={() => toggle(groupIds, g.id, setGroupIds)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer", groupIds.includes(g.id) ? "bg-primary text-onprimary border-primary" : "bg-raised text-ink-600 border-line hover:border-line-strong")}>{g.id}</button>))}</div></div>
          <label className="flex items-center gap-2 text-sm text-ink-600"><input type="checkbox" checked={pin} onChange={(e) => setPin(e.target.checked)} />Pin it to an exact slot</label>
          {pin && <div className="flex gap-3">
            <select value={pinDay} onChange={(e) => setPinDay(e.target.value)} className={cn(field, "w-28")} aria-label="Pinned day">{(refData.calendar.days || DAYS).map((d) => <option key={d}>{d}</option>)}</select>
            <select value={pinStart} onChange={(e) => setPinStart(Number(e.target.value))} className={cn(field, "w-28")} aria-label="Pinned start period">{Array.from({ length: 9 }, (_, i) => i + 1).map((p) => <option key={p} value={p}>P{p}</option>)}</select></div>}
        </>
      )}
      {error && <p className="text-sm text-sunrise-600" role="alert">{error}</p>}
      <Button variant="secondary" icon={<Plus className="w-4 h-4" />} onClick={add}>Add to the change file</Button>
    </Card>
  );
}
