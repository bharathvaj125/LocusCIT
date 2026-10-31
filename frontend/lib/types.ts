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
  status: "PENDING" | "APPROVED" | "REJECTED";
  moved_count: number;
  lower_bound: number;
  proven_minimum: boolean;
  changes: DisruptionDiff[];
  diagnostics: string;
  submitted_at: string;
  approved_by?: string;
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
