/**
 * Client for the LocusCIT backend. Every screen reads and writes through these functions; there is no
 * mock or fallback data. Failures surface as ApiError so the UI can show the real reason.
 */
import {
  BookingRequest,
  Dashboard,
  DayOfWeek,
  DisruptionProposal,
  ExamSession,
  Explanation,
  ReferenceData,
  RoleType,
  ScheduledSession,
  ServerDraft,
  ServerProposal,
  SessionUser,
  SolverJob,
  Submission,
  Window,
} from "./types";
import { clearSession, loadSession, saveSession, StoredSession } from "./session";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;
  ruleIds: string[];
  constructor(status: number, code: string, message: string, details?: unknown, ruleIds: string[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.ruleIds = ruleIds;
  }
}

/** Listeners are told when the server rejects our token, so the app can return to the login screen. */
type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();
export function onUnauthorized(fn: Listener): () => void {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

let lastLatencyMs = 0;
export function lastLatency(): number {
  return lastLatencyMs;
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const { method = "GET", body, auth = true, timeoutMs = 60000 } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const s = loadSession();
    if (!s) {
      unauthorizedListeners.forEach((l) => l());
      throw new ApiError(401, "UNAUTHORIZED", "Please sign in");
    }
    headers["Authorization"] = `Bearer ${s.token}`;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = (e as Error)?.name === "AbortError";
    throw new ApiError(
      0,
      aborted ? "TIMEOUT" : "NETWORK",
      aborted
        ? "The server took too long to answer. If it was asleep it may need about a minute to wake up; try again."
        : "Cannot reach the server. Check your connection or try again in a minute (the free server may be waking up)."
    );
  } finally {
    clearTimeout(timer);
  }
  lastLatencyMs = Math.round(performance.now() - t0);
  let payload: { success?: boolean; data?: unknown; errors?: Array<Record<string, unknown>> } | null = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (res.status === 401) {
    clearSession();
    unauthorizedListeners.forEach((l) => l());
  }
  if (!res.ok || (payload && payload.success === false)) {
    const err = payload?.errors?.[0] || {};
    throw new ApiError(
      res.status,
      String(err.code || (res.status === 401 ? "UNAUTHORIZED" : "ERROR")),
      String(err.message || `Request failed (${res.status})`),
      err.details,
      (err.rule_ids as string[]) || []
    );
  }
  return (payload && "data" in payload ? payload.data : payload) as T;
}

// ------------------------------------------------------------------------------------------ auth
export async function login(username: string, password: string): Promise<StoredSession> {
  const data = await request<{ token: string; user: SessionUser; expires_in: number }>("/api/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
  const s: StoredSession = { token: data.token, user: data.user, expiresAt: Date.now() + data.expires_in * 1000 };
  saveSession(s);
  return s;
}

export function logout(): void {
  clearSession();
}

export async function health(): Promise<{ status: string; version: string; dataset_id: string; revision: number }> {
  return request("/api/health", { auth: false, timeoutMs: 90000 });
}

// ------------------------------------------------------------------------------------------ reference
export async function fetchReference(): Promise<ReferenceData> {
  return request("/api/reference");
}

export async function fetchDashboard(): Promise<Dashboard> {
  return request("/api/dashboard");
}

export async function fetchAudit(): Promise<Array<{ at: number; actor: string; action: string; detail: string }>> {
  return (await request<{ events: Array<{ at: number; actor: string; action: string; detail: string }> }>("/api/audit")).events;
}

export async function resetDemoData(): Promise<{ revision: number; message: string }> {
  return request("/api/admin/reset", { method: "POST" });
}

export async function importDataset(dataset: unknown): Promise<{ dataset_id: string; revision: number; counts: Record<string, number> }> {
  return request("/api/admin/dataset/import", { method: "POST", body: dataset, timeoutMs: 120000 });
}

// ------------------------------------------------------------------------------------------ timetable
interface ScheduleRow {
  session_id: string;
  course_id: string;
  kind: "lecture" | "tutorial" | "lab";
  groups: string[];
  faculty_id: string;
  basket_slot: string | null;
  day: DayOfWeek;
  start_period: number;
  end_period: number;
  room_id: string;
}

export function toScheduledSession(row: ScheduleRow, ref: ReferenceData): ScheduledSession {
  const s = ref.sessions.find((x) => x.id === row.session_id);
  const room = ref.rooms.find((r) => r.id === row.room_id);
  const fac = ref.faculty.find((f) => f.id === row.faculty_id);
  const course = ref.courses.find((c) => c.id === row.course_id);
  const size = s?.size ?? 0;
  const cap = room?.capacity ?? 0;
  const ratio = cap ? size / cap : 0;
  return {
    id: row.session_id,
    course_id: row.course_id,
    course_title: course?.title || row.course_id,
    kind: row.kind,
    groups: row.groups,
    faculty_id: row.faculty_id,
    faculty_name: fac?.name || row.faculty_id,
    faculty_dept: fac?.department || "",
    size,
    duration: s?.duration ?? row.end_period - row.start_period + 1,
    room_types: s?.room_types || [],
    needs_accessible: Boolean(s?.needs_accessible),
    basket_slot: row.basket_slot,
    fixed_slot: s?.fixed_slot || null,
    day: row.day,
    start_period: row.start_period,
    end_period: row.end_period,
    room_id: row.room_id,
    room_name: room?.name || row.room_id,
    room_capacity: cap,
    room_type: room?.type || "",
    room_accessible: Boolean(room?.accessible),
    is_underutilized: ratio > 0 && ratio < 0.4,
    capacity_ratio: ratio,
  };
}

export async function fetchTimetable(
  view: "group" | "faculty" | "room",
  id: string,
  ref: ReferenceData
): Promise<ScheduledSession[]> {
  const data = await request<{ assignments: ScheduleRow[] }>(
    `/api/schedules?view=${view}&id=${encodeURIComponent(id)}`
  );
  return data.assignments.map((r) => toScheduledSession(r, ref));
}

export async function generateTimetable(timeLimit?: number): Promise<string> {
  const q = timeLimit !== undefined ? `?time_limit=${timeLimit}` : "";
  const d = await request<{ job_id: string }>(`/api/schedules/generate${q}`, { method: "POST" });
  return d.job_id;
}

export async function fetchJob(id: string): Promise<SolverJob> {
  return request(`/api/jobs/${id}`);
}

// ------------------------------------------------------------------------------------------ exams
interface ExamRow {
  exam_id: string;
  day: DayOfWeek;
  session: "AM" | "PM";
  rooms: string[];
  course_ids: string[];
  groups: string[];
  size: number;
  seats: number;
}

export async function generateExams(): Promise<{ status: string; count: number; exam_soft_penalty: number }> {
  return request("/api/exams/generate", { method: "POST", timeoutMs: 180000 });
}

export async function fetchExams(ref: ReferenceData): Promise<ExamSession[]> {
  const data = await request<{ exams: ExamRow[] }>("/api/exams");
  const slots = ref.calendar.exam_week.sessions;
  return data.exams.map((e) => {
    const course = ref.courses.find((c) => c.id === e.course_ids[0]);
    const slot = slots.find((s) => s.id === e.session);
    const group = ref.student_groups.find((g) => g.id === e.groups[0]);
    return {
      exam_id: e.exam_id,
      course_id: e.course_ids.join(" + "),
      course_title: e.course_ids.map((cid) => ref.courses.find((c) => c.id === cid)?.title || cid).join(" / "),
      day: e.day,
      slot: e.session,
      time_range: slot ? `${slot.start} - ${slot.end}` : e.session,
      rooms: e.rooms,
      room_details: e.rooms.map((rid) => {
        const r = ref.rooms.find((x) => x.id === rid);
        return {
          id: rid,
          name: r?.name || rid,
          capacity: r?.capacity || 0,
          effective_seats: Math.floor((r?.capacity || 0) / 2),
          accessible: Boolean(r?.accessible),
        };
      }),
      total_effective_seats: e.seats,
      candidate_count: e.size,
      groups: e.groups,
      department: course?.department || group?.department || "",
    };
  });
}

// ------------------------------------------------------------------------------------------ bookings
interface DatasetRequest {
  id: string;
  submitted_at: string;
  requester: string;
  role: RoleType;
  requested_category: BookingRequest["requested_category"];
  title: string;
  attendance: number;
  duration_periods: number;
  windows: Window[];
  room_types: string[];
  needs: string[];
  requested_room: string | null;
  raw_text?: string;
}

interface Decision {
  request_id: string;
  status: "approved" | "rejected" | "alternative_offered";
  reason: string;
  effective_category?: BookingRequest["effective_category"];
  day?: DayOfWeek;
  start_period?: number;
  end_period?: number;
  room_id?: string;
}

export interface BookingsState {
  requests: BookingRequest[];
  submitted: Submission[];
  decided: boolean;
}

export async function fetchBookings(): Promise<BookingsState> {
  const data = await request<{
    requests: Array<{ request: DatasetRequest; decision: Decision | null }>;
    submitted: Submission[];
    decided: boolean;
    session_overrides?: Array<{ session_id: string; displaced_by: string }>;
  }>("/api/bookings");
  const overrides = data.session_overrides || [];
  const requests: BookingRequest[] = data.requests.map(({ request: r, decision: d }) => {
    const w = r.windows[0];
    const cancelled = Boolean(d && d.status === "rejected" && d.reason.startsWith("Request was cancelled"));
    return {
      id: r.id,
      title: r.title,
      requester: r.requester,
      role: r.role,
      requested_category: r.requested_category,
      effective_category: d?.effective_category || r.requested_category,
      attendance: r.attendance,
      duration_periods: r.duration_periods,
      day: (d?.day || w?.day || "MON") as DayOfWeek,
      start_period: d?.start_period ?? w?.from_period ?? 0,
      end_period: d?.end_period ?? (w ? w.from_period + r.duration_periods - 1 : 0),
      room_types: r.room_types,
      needs: r.needs,
      requested_room: r.requested_room,
      assigned_room: d?.room_id || null,
      status: d ? (cancelled ? "cancelled" : d.status) : "pending",
      reason: d ? d.reason : "Not evaluated yet. An Admin runs the Spectra evaluation.",
      submitted_at: r.submitted_at,
      raw_text: r.raw_text,
      displaced_class: overrides.filter((o) => o.displaced_by === r.id).map((o) => o.session_id).join(", ") || null,
      windows: r.windows,
    };
  });
  return { requests, submitted: data.submitted || [], decided: data.decided };
}

export async function evaluateBookings(): Promise<{ booking_score: number; booking_score_max_if_all_approved: number; priority_inversions: string[] }> {
  return request("/api/bookings/evaluate-batch", { method: "POST", timeoutMs: 180000 });
}

export async function parseBooking(text: string): Promise<ServerDraft> {
  return request("/api/bookings/parse", { method: "POST", body: { text } });
}

export interface DraftSubmission {
  title: string;
  attendance: number;
  duration_periods: number;
  windows: Window[];
  day_mode: "all" | "any";
  needs: string[];
  room_types: string[];
  requested_room: string | null;
  mandatory_for_groups: string[];
  requested_category: string;
  raw_text?: string | null;
}

export async function submitBooking(draft: DraftSubmission): Promise<Submission[]> {
  return (await request<{ submissions: Submission[] }>("/api/bookings/submit", { method: "POST", body: draft })).submissions;
}

export async function decideSubmission(
  id: string,
  action: "approve" | "reject" | "offer_alternative",
  reason?: string
): Promise<Submission> {
  return request(`/api/bookings/${encodeURIComponent(id)}/decision`, { method: "POST", body: { action, reason } });
}

export async function respondToAlternative(id: string, accept: boolean): Promise<Submission> {
  return request(`/api/bookings/${encodeURIComponent(id)}/respond`, { method: "POST", body: { accept } });
}

export async function cancelSubmission(id: string): Promise<Submission> {
  return request(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: "POST" });
}

export async function scheduleManualEvent(ev: {
  title: string;
  room_id: string;
  day: DayOfWeek;
  start_period: number;
  end_period: number;
  attendance: number;
  needs: string[];
  mandatory_for_groups: string[];
  requested_category: string;
}): Promise<Submission> {
  return request("/api/events/manual", { method: "POST", body: ev });
}

// ------------------------------------------------------------------------------------------ proposals
export function toDisruptionProposal(p: ServerProposal, ref: ReferenceData): DisruptionProposal {
  const titleFor = (sid: string) => {
    const s = ref.sessions.find((x) => x.id === sid);
    return ref.courses.find((c) => c.id === s?.course_id)?.title || s?.course_id || sid;
  };
  const roomName = (rid: string) => ref.rooms.find((r) => r.id === rid)?.name || rid;
  const dur = (sid: string) => ref.sessions.find((x) => x.id === sid)?.duration || 1;
  const kind =
    p.type === "faculty_change" ? "Faculty change request" : p.type === "faculty_unavailable" ? "Faculty unavailability" : "Disruption";
  const items: string[] = [];
  (p.diagnostics || []).forEach((d) => {
    if (d.session_id && d.reasons) items.push(`${d.session_id}: ${d.reasons.join("; ")}`);
    else if (d.detail) items.push(`${d.rule || ""} ${d.detail}`.trim());
  });
  (p.unavailable_because || []).forEach((u) => items.push(`${u.slot}: ${u.blocked_by.join("; ")}`));
  return {
    proposal_id: p.proposal_id,
    title: `${kind} requested by ${p.requested_by || "?"}`,
    status: p.status,
    type: p.type,
    moved_count: p.moved_count ?? 0,
    lower_bound: p.lower_bound ?? 0,
    proven_minimum: Boolean(p.proven_minimum),
    changes: (p.moved || []).map((m) => ({
      session_id: m.session_id,
      course_id: ref.sessions.find((x) => x.id === m.session_id)?.course_id || "",
      course_title: titleFor(m.session_id),
      old: { ...m.old, end_period: m.old.start_period + dur(m.session_id) - 1, room_name: roomName(m.old.room_id) },
      new: { ...m.new, end_period: m.new.start_period + dur(m.session_id) - 1, room_name: roomName(m.new.room_id) },
      reason: m.reason,
      is_moved: true,
    })),
    diagnostics: p.message || "",
    diagnostic_items: items,
    submitted_at: new Date((p.created_at || 0) * 1000).toISOString(),
    requested_by: p.requested_by,
    approved_by: p.approved_by,
    new_sessions: p.new_sessions || [],
    removed_sessions: p.removed_sessions || [],
  };
}

export async function fetchSampleDisruption(): Promise<unknown> {
  return request("/api/examples/sample-disruption");
}

export async function proposeDisruption(changes: unknown): Promise<string> {
  return (await request<{ proposal_id: string }>("/api/disruptions/propose", { method: "POST", body: changes })).proposal_id;
}

export async function fetchProposals(): Promise<ServerProposal[]> {
  return (await request<{ proposals: ServerProposal[] }>("/api/proposals")).proposals;
}

export async function fetchProposal(id: string): Promise<ServerProposal> {
  return request(`/api/proposals/${id}`);
}

export async function approveProposal(id: string): Promise<ServerProposal> {
  return request(`/api/proposals/${id}/approve`, { method: "POST", timeoutMs: 180000 });
}

export async function rejectProposal(id: string): Promise<ServerProposal> {
  return request(`/api/proposals/${id}/reject`, { method: "POST" });
}

// ------------------------------------------------------------------------------------------ faculty
export async function fetchMySessions(ref: ReferenceData): Promise<Array<{ session_id: string; course_id: string; course_title: string; kind: string; current: { day: DayOfWeek; start_period: number; room_id: string } | null }>> {
  const d = await request<{ sessions: Array<{ session_id: string; course_id: string; kind: string; current: { day: DayOfWeek; start_period: number; room_id: string } | null }> }>("/api/faculty/my-sessions");
  return d.sessions.map((s) => ({ ...s, course_title: ref.courses.find((c) => c.id === s.course_id)?.title || s.course_id }));
}

export type ChangeRequestResult =
  | { status: "NEEDS_INFO"; question: string; options: Array<{ session_id: string }>; security_flags: string[] }
  | { status: "COMPUTING"; proposal_id: string; security_flags: string[]; understood: Record<string, unknown> };

export async function facultyChangeRequest(body: Record<string, unknown>): Promise<ChangeRequestResult> {
  return request("/api/faculty/change-request", { method: "POST", body });
}

export async function fetchFacultyRequest(id: string): Promise<ServerProposal> {
  return request(`/api/faculty/change-requests/${id}`);
}

export async function fetchFacultyRequests(): Promise<ServerProposal[]> {
  return (await request<{ requests: ServerProposal[] }>("/api/faculty/change-requests")).requests;
}

// ------------------------------------------------------------------------------------------ explain
export async function explainSession(id: string): Promise<Explanation> {
  return request(`/api/explain/session/${encodeURIComponent(id)}`);
}

export async function explainBooking(id: string): Promise<Explanation> {
  return request(`/api/explain/booking/${encodeURIComponent(id)}`);
}

// ------------------------------------------------------------------------------------------ exports
export async function fetchExport(kind: "schedule" | "schedule-after"): Promise<string> {
  const data = await request<unknown>(`/api/exports/${kind}`, { timeoutMs: 120000 });
  return JSON.stringify(data, null, 2);
}

/** Poll a long-running job or proposal until it leaves the busy state. */
export async function pollUntil<T extends { status: string }>(
  fetcher: () => Promise<T>,
  onUpdate: (v: T) => void,
  busy: string[] = ["RUNNING", "COMPUTING"],
  intervalMs = 3000,
  maxMs = 15 * 60 * 1000
): Promise<T> {
  const start = Date.now();
  for (;;) {
    const v = await fetcher();
    onUpdate(v);
    if (!busy.includes(v.status) || Date.now() - start > maxMs) return v;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export function describeError(e: unknown): string {
  if (e instanceof ApiError) {
    const rules = e.ruleIds.length ? ` [${e.ruleIds.join(", ")}]` : "";
    return `${e.message}${rules}`;
  }
  return (e as Error)?.message || "Something went wrong";
}
