import { NavRoute, RoleConfig } from "./types";

/** Navigation and per-role screen access. This is UI configuration only; the backend enforces permissions. */
export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  admin: {
    id: "admin", label: "Admin", badge: "Admin", persona: "Dean's Office",
    // an Admin decides requests and schedules events directly, so there is no request assistant
    allowedNav: ["overview", "timetable", "exams", "spectra_clash", "approvals", "disruptions", "users", "organisations", "exports"],
  },
  department_coordinator: {
    id: "department_coordinator", label: "Department coordinator", badge: "Coordinator", persona: "Department coordinator",
    allowedNav: ["overview", "timetable", "exams", "spectra_clash", "approvals", "ai_booking"],
  },
  faculty: {
    id: "faculty", label: "Faculty", badge: "Faculty", persona: "Faculty member",
    allowedNav: ["overview", "timetable", "exams", "spectra_clash", "approvals", "ai_booking"],
  },
  club: {
    id: "club", label: "Club representative", badge: "Club Representative", persona: "Club representative",
    allowedNav: ["overview", "timetable", "spectra_clash", "approvals", "ai_booking"],
  },
};

export const NAV_ROUTES: NavRoute[] = [
  { id: "overview", label: "Overview", href: "/overview", description: "Status, next steps and what needs you" },
  { id: "timetable", label: "Timetable", href: "/timetable", description: "By student group, faculty or room" },
  { id: "exams", label: "Midsem exams", href: "/exams", description: "Exam week, Monday to Saturday" },
  { id: "spectra_clash", label: "Venues & Spectra", href: "/spectra-clash", description: "Week 7 bookings and the venue board" },
  { id: "approvals", label: "Approvals", href: "/approvals", description: "Decide bookings; nobody approves their own" },
  { id: "disruptions", label: "Changes", href: "/disruptions", description: "Upload a change file and review the repair" },
  { id: "ai_booking", label: "Assistant", href: "/ai-booking", description: "English and Hinglish requests" },
  { id: "users", label: "Users", href: "/admin/users", description: "Create and manage accounts" },
  { id: "organisations", label: "Organisations", href: "/admin/organisations", description: "Clubs, departments and institute bodies" },
  { id: "exports", label: "Exports", href: "/admin/exports", description: "schedule.json and schedule_after.json" },
];

/** Demo accounts listed in the README. Passwords are public demo credentials, not secrets. */
export const DEMO_ACCOUNTS: Array<{ username: string; password: string; label: string; role: string; blurb: string }> = [
  { username: "admin", password: "Admin@123", label: "Admin", role: "Dean's Office", blurb: "Generates, approves, exports" },
  { username: "coordinator", password: "Coord@123", label: "Coordinator", role: "CSE department", blurb: "Department events and labs" },
  { username: "faculty", password: "Faculty@123", label: "Faculty", role: "Dr. Arjun Mehta", blurb: "Own timetable and changes" },
  { username: "club", password: "Club@123", label: "Club Representative", role: "Dramatics Society", blurb: "Venue requests" },
];

export const PERIOD_CLOCK: Record<number, string> = {
  1: "08:00", 2: "09:00", 3: "10:00", 4: "11:00", 5: "12:00", 6: "14:00", 7: "15:00", 8: "16:00", 9: "17:00",
  10: "18:00", 11: "19:00", 12: "20:00", 13: "21:00",
};

/** Clock time a period starts at; periods past P13 (outside event hours) continue the same hourly pattern. */
const clockAt = (p: number) => PERIOD_CLOCK[p] || `${String(21 + (p - 13)).padStart(2, "0")}:00`.replace(/^24:/, "00:");

export function periodRange(start: number, end: number): string {
  const e = end + 1;
  const endClock = e === 6 ? "13:00" : clockAt(e);
  return `${clockAt(start)}-${endClock}`;
}
