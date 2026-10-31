import { NavRoute, RoleConfig } from "./types";

/** Navigation and per-role screen access. This is UI configuration only; the backend enforces permissions. */
export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  admin: {
    id: "admin",
    label: "Admin (Dean's Office)",
    badge: "ADMIN",
    persona: "Dean's Office: generates timetables, approves changes",
    allowedNav: ["timetable", "exams", "spectra_clash", "approvals", "disruptions", "ai_booking", "exports"],
  },
  department_coordinator: {
    id: "department_coordinator",
    label: "Department Coordinator",
    badge: "COORDINATOR",
    persona: "Department coordinator: department sessions, events and lab bookings",
    allowedNav: ["timetable", "exams", "spectra_clash", "approvals", "ai_booking"],
  },
  faculty: {
    id: "faculty",
    label: "Faculty",
    badge: "FACULTY",
    persona: "Faculty: own timetable, change requests, guest-lecture bookings",
    allowedNav: ["timetable", "exams", "spectra_clash", "approvals", "ai_booking"],
  },
  club: {
    id: "club",
    label: "Club Representative",
    badge: "CLUB",
    persona: "Club representative: venue requests and their status",
    allowedNav: ["timetable", "spectra_clash", "approvals", "ai_booking"],
  },
};

export const NAV_ROUTES: NavRoute[] = [
  { id: "timetable", label: "Timetable", href: "/timetable", description: "Timetable by group, faculty or room" },
  { id: "exams", label: "Midsem Exams", href: "/exams", description: "Exam week, MON-SAT AM/PM, multi-room seating" },
  { id: "spectra_clash", label: "Spectra Bookings", href: "/spectra-clash", description: "Week 7 requests, priority decisions and reasons" },
  { id: "approvals", label: "Approvals", href: "/approvals", description: "Pending bookings and changes; nobody approves their own" },
  { id: "disruptions", label: "Disruptions", href: "/disruptions", description: "Upload a change file, review the minimal repair, approve" },
  { id: "ai_booking", label: "AI Assistant", href: "/ai-booking", description: "English/Hinglish booking requests and faculty change requests" },
  { id: "exports", label: "Exports", href: "/admin/exports", description: "Download schedule.json and schedule_after.json" },
];

/** Demo accounts listed in the README. Passwords are public demo credentials, not secrets. */
export const DEMO_ACCOUNTS: Array<{ username: string; password: string; label: string }> = [
  { username: "admin", password: "Admin@123", label: "Admin" },
  { username: "admin2", password: "Admin@123", label: "Second Admin" },
  { username: "coordinator", password: "Coord@123", label: "Coordinator (CSE)" },
  { username: "faculty", password: "Faculty@123", label: "Faculty (F06)" },
  { username: "club", password: "Club@123", label: "Club (Dramatics)" },
];

export const PERIOD_CLOCK: Record<number, string> = {
  1: "08:00", 2: "09:00", 3: "10:00", 4: "11:00", 5: "12:00", 6: "14:00", 7: "15:00", 8: "16:00", 9: "17:00",
  10: "18:00", 11: "19:00", 12: "20:00", 13: "21:00",
};
