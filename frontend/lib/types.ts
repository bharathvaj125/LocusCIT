export type RoleType = "admin" | "department_coordinator" | "faculty" | "club";

export interface RoleConfig {
  id: RoleType;
  label: string;
  badge: string;
  persona: string;
  department?: string;
  facultyId?: string;
  clubName?: string;
  allowedNav: NavRouteId[];
}

export type NavRouteId = 
  | "overview"
  | "timetable" 
  | "exams" 
  | "spectra_clash" 
  | "approvals" 
  | "disruptions" 
  | "ai_booking"
  | "exports";

export interface NavRoute {
  id: NavRouteId;
  label: string;
  href: string;
  description: string;
  badge?: string;
}

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export interface StudentGroup {
  id: string;
  name: string;
  year: number;
  department: string;
  size: number;
  needs_accessible: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  department: string;
  max_hours_per_day: number;
  needs_accessible: boolean;
  unavailable: Array<{
    day: DayOfWeek;
    periods: number[];
    reason?: string;
  }>;
  preferences?: Array<{
    type: string;
    days: DayOfWeek[];
    periods: number[];
    note: string;
  }>;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  type: 
    | "classroom" 
    | "lecture_hall" 
    | "auditorium" 
    | "seminar_hall" 
    | "outdoor" 
    | "lab_cs" 
    | "lab_elec" 
    | "lab_phy" 
    | "workshop" 
    | "lab_civil";
  capacity: number;
  features: string[];
  accessible: boolean;
  allowed_uses: string[];
}

export interface Course {
  id: string;
  title: string;
  department: string;
  year: number;
  lecture_hours: number;
  tutorial_hours: number;
  lab_blocks: number;
}

export interface ScheduledSession {
  id: string;
  course_id: string;
  course_title: string;
  course_dept?: string;
  kind: "lecture" | "tutorial" | "lab";
  groups: string[];
  faculty_id: string;
  faculty_name: string;
  faculty_dept: string;
  size: number;
  duration: number;
  room_types: string[];
  needs_accessible: boolean;
  basket_slot: string | null;
  fixed_slot: { day: DayOfWeek; start_period: number } | null;
  day: DayOfWeek;
  start_period: number;
  end_period: number;
  room_id: string;
  room_name: string;
  room_capacity: number;
  room_type: string;
  room_accessible: boolean;
  is_underutilized: boolean;
  capacity_ratio: number;
}

export interface ExamSession {
  exam_id: string;
  course_id: string;
  course_title: string;
  day: DayOfWeek;
  slot: "AM" | "PM";
  time_range: string;
  rooms: string[];
  room_details: Array<{
    id: string;
    name: string;
    capacity: number;
    effective_seats: number;
    accessible: boolean;
  }>;
  total_effective_seats: number;
  candidate_count: number;
  groups: string[];
  department: string;
}

export interface BookingRequest {
  id: string;
  title: string;
  requester: string;
  role: RoleType;
  requested_category: "institute_event" | "guest_lecture" | "department_event" | "club_event";
  effective_category: "institute_event" | "guest_lecture" | "department_event" | "club_event";
  attendance: number;
  duration_periods: number;
  day: DayOfWeek;
  start_period: number;
  end_period: number;
  room_types: string[];
  needs: string[];
  requested_room: string | null;
  assigned_room: string | null;
  status: "approved" | "alternative_offered" | "rejected" | "cancelled" | "pending";
  reason: string;
  submitted_at: string;
  raw_text?: string;
  displaced_class?: string | null;
  windows?: Window[];
}

export interface DisruptionDiff {
  session_id: string;
  course_id: string;
  course_title: string;
  old: {
    day: DayOfWeek | "NONE";
    start_period: number;
    end_period: number;
    room_id: string;
    room_name: string;
  };
  new: {
    day: DayOfWeek;
    start_period: number;
    end_period: number;
    room_id: string;
    room_name: string;
  };
  reason: string;
  is_moved: boolean;
}

export interface DisruptionProposal {
  proposal_id: string;
  title: string;
  status: ServerProposal["status"];
  type: ServerProposal["type"];
  moved_count: number;
  lower_bound: number;
  proven_minimum: boolean;
  changes: DisruptionDiff[];
  diagnostics: string;
  diagnostic_items: string[];
  submitted_at: string;
  requested_by?: string | null;
  approved_by?: string | null;
  new_sessions: string[];
  removed_sessions: string[];
}

export interface ParsedBookingDraft {
  title: string;
  day: DayOfWeek;
  start_period: number;
  duration_periods: number;
  end_period: number;
  attendance: number;
  requested_category: "institute_event" | "guest_lecture" | "department_event" | "club_event";
  effective_category: "institute_event" | "guest_lecture" | "department_event" | "club_event";
  room_types: string[];
  features: string[];
  requested_room?: string;
  ambiguities: string[];
  assumptions: string[];
  priority_capped: boolean;
  original_text: string;
}

// ---------------------------------------------------------------------------------------------
// Shapes returned by the LocusCIT backend (see docs/API_CONTRACT.md)
// ---------------------------------------------------------------------------------------------
export interface SessionUser {
  username: string;
  role: RoleType;
  display_name: string;
  department: string | null;
  faculty_id: string | null;
  org: string | null;
}

export interface Window {
  day: DayOfWeek;
  from_period: number;
  to_period: number;
}

export interface ReferenceSession {
  id: string;
  course_id: string;
  kind: "lecture" | "tutorial" | "lab";
  groups: string[];
  faculty_id: string;
  size: number;
  duration: number;
  room_types: string[];
  needs_accessible: boolean;
  basket_slot: string | null;
  fixed_slot: { day: DayOfWeek; start_period: number } | null;
}

export interface ReferenceData {
  dataset_id: string;
  revision: number;
  calendar: {
    days: DayOfWeek[];
    exam_week: { days: DayOfWeek[]; sessions: Array<{ id: "AM" | "PM"; start: string; end: string }> };
  };
  priority_order: string[];
  role_category_cap: Record<string, string>;
  rooms: Room[];
  faculty: Array<{ id: string; name: string; department: string; max_hours_per_day: number; needs_accessible: boolean }>;
  student_groups: StudentGroup[];
  courses: Array<{ id: string; title: string; department: string; year: number }>;
  sessions: ReferenceSession[];
}

export interface Dashboard {
  dataset_id: string;
  revision: number;
  schedule_version: number;
  sessions_total: number;
  sessions_scheduled: number;
  hard_violation_count: number | null;
  hard_by_rule: Record<string, number>;
  conflicts: Array<{ rule: string; where: string; detail: string }>;
  soft_total: number | null;
  soft_penalties: Record<string, number> | null;
  exams_total: number;
  exams_scheduled: number;
  exam_soft_penalty: number | null;
  booking_requests: number;
  booking_decisions: number;
  booking_score: number | null;
  booking_score_max: number | null;
  priority_inversions: number;
  pending_proposals: Array<{ proposal_id: string; type: string; moved_count: number | null }>;
  pending_bookings: Array<{ id: string; title: string; requester: string }>;
  pending_approvals: number;
  applied_disruptions: number;
  utilisation: { average_pct: number; busiest: Array<{ id: string; name: string; utilisation_pct: number }> };
  ready_for_export: boolean;
}

export interface SolverJob {
  job_id: string;
  status: "RUNNING" | "DONE" | "INFEASIBLE" | "UNKNOWN" | "FAILED_VALIDATION" | "ERROR" | "STALE";
  phase?: "optimising" | "done";
  solver_status?: string;
  soft_total?: number;
  sessions?: number;
  hard_violation_count?: number;
  seconds?: number;
  error?: string;
}

export interface ServerDraft {
  raw_text: string;
  title: string | null;
  attendance: number | null;
  duration_periods: number | null;
  windows: Window[];
  day_mode: "all" | "any";
  needs: string[];
  room_types: string[];
  requested_room: string | null;
  mandatory_for_groups: string[];
  requested_category: string;
  follow_up: string | null;
  follow_ups: string[];
  assumptions: string[];
  warnings: string[];
  ambiguous_fields: string[];
  security_flags: string[];
  suggestions: string[];
  interpretation: string[];
  effective_category?: string;
  role_cap?: string;
  ai_used?: boolean;
  ai_available?: boolean;
}

export interface Submission {
  id: string;
  requester_username: string;
  requester: string;
  role: RoleType;
  department: string | null;
  title: string;
  status: "PENDING_APPROVAL" | "PENDING_NEGOTIATION" | "APPROVED" | "ALTERNATIVE_OFFERED" | "REJECTED" | "CANCELLED" | "WITHDRAWN" | "NEEDS_REVIEW";
  negotiation_id?: string | null;
  decided_role?: string | null;
  routing?: { approver: "admin" | "coordinator_or_admin"; departments: string[]; why: string };
  can_decide?: boolean;
  decide_blocked_reason?: string | null;
  overrides?: Array<{ session_id: string; day: DayOfWeek; start_period: number; room_id: string }>;
  affected_classes?: Array<{ session_id: string; course_id: string; old: { day: DayOfWeek; start_period: number; room_id: string } | null; new: { day: DayOfWeek; start_period: number; room_id: string } }>;
  manual: boolean;
  placement: { day: DayOfWeek; start_period: number; end_period: number; room_id: string } | null;
  proposed: { status: string; reason: string; effective_category?: string };
  decided_by: string | null;
  decision_reason: string;
  request: { windows: Window[]; attendance: number; duration_periods: number; needs: string[]; requested_category: string };
}

export interface ServerProposal {
  proposal_id: string;
  type: "disruption" | "faculty_change" | "faculty_unavailable";
  status: "COMPUTING" | "PENDING" | "APPROVED" | "REJECTED" | "INFEASIBLE" | "UNKNOWN" | "STALE" | "INVALID" | "ERROR" | "FAILED_VALIDATION";
  requested_by: string | null;
  approved_by: string | null;
  created_at: number;
  message?: string;
  moved?: Array<{ session_id: string; old: { day: DayOfWeek; start_period: number; room_id: string };
                  new: { day: DayOfWeek; start_period: number; room_id: string }; reason: string }>;
  moved_count?: number;
  lower_bound?: number;
  proven_minimum?: boolean;
  new_sessions?: string[];
  added?: Array<{ session_id: string; new: { day: DayOfWeek; start_period: number; room_id: string } }>;
  removed_sessions?: string[];
  diagnostics?: Array<{ session_id?: string; reasons?: string[]; rule?: string; detail?: string }>;
  unavailable_because?: Array<{ slot: string; blocked_by: string[] }>;
  changes_requested?: Array<Record<string, unknown>>;
  understood?: Record<string, unknown>;
  request_text?: string | null;
  seconds?: number;
  hard_violation_count?: number;
  soft_total?: number;
}

export interface Explanation {
  explanation: string[];
  rule_ids: string[];
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errors: Array<{
    code: string;
    message: string;
    details?: string;
    rule_ids?: string[];
  }>;
}
