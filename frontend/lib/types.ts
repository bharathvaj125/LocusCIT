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
  | "ai_booking";

export interface NavRoute {
  id: NavRouteId;
  label: string;
  href: string;
  description: string;
  badge?: string;
}

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI";

export interface PeriodInfo {
  period: number;
  label: string;
  timeRange: string;
  isEvening: boolean;
  isLunch?: boolean;
}

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
  duration: number; // 1, 2, or 3
  room_types: string[];
  needs_accessible: boolean;
  basket_slot: string | null; // e.g. "OEB-1"
  fixed_slot: { day: DayOfWeek; start_period: number } | null;
  // Assignment
  day: DayOfWeek;
  start_period: number;
  end_period: number;
  room_id: string;
  room_name: string;
  room_capacity: number;
  room_type: string;
  room_accessible: boolean;
  is_underutilized: boolean; // <40% capacity
  capacity_ratio: number; // size / room_capacity
}

export interface DailyFacultyLoad {
  faculty_id: string;
  day: DayOfWeek;
  hours: number;
  max_hours: number;
  is_warning: boolean;
  is_violation: boolean;
}

export interface HardConstraintAudit {
  code: string;
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errors: Array<{
    code: string;
    message: string;
    details?: string;
  }>;
}
