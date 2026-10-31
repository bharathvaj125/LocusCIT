import { 
  ScheduledSession, 
  Room, 
  Faculty, 
  StudentGroup, 
  ApiResponse 
} from "./types";
import { 
  BASELINE_SESSIONS, 
  ROOMS, 
  FACULTY_MEMBERS, 
  STUDENT_GROUPS 
} from "./mockData";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// In-memory workspace revision counter
let currentRevision = 1;

export function getLocalWorkspaceRevision(): number {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("locus_revision");
    if (saved) {
      currentRevision = parseInt(saved, 10) || 1;
    }
  }
  return currentRevision;
}

export function setLocalWorkspaceRevision(rev: number): void {
  currentRevision = rev;
  if (typeof window !== "undefined") {
    localStorage.setItem("locus_revision", rev.toString());
  }
}

/**
 * Fetch timetable sessions filtered by pivot (group, faculty, or room) and identifier.
 */
export async function fetchTimetable(
  view: "group" | "faculty" | "room",
  id: string
): Promise<ApiResponse<ScheduledSession[]>> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/schedules?view=${view}&id=${encodeURIComponent(id)}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch {
      // Fall through to mock fallback
    }
  }

  // Filter in-memory mock dataset
  let filtered = BASELINE_SESSIONS;
  if (id && id !== "all") {
    if (view === "group") {
      filtered = BASELINE_SESSIONS.filter((s) => s.groups.includes(id));
    } else if (view === "faculty") {
      filtered = BASELINE_SESSIONS.filter((s) => s.faculty_id === id);
    } else if (view === "room") {
      filtered = BASELINE_SESSIONS.filter((s) => s.room_id === id);
    }
  }

  return {
    success: true,
    data: filtered,
    errors: [],
  };
}

/**
 * Reset demo data to pristine baseline state.
 */
export async function resetDemoData(): Promise<
  ApiResponse<{ revision: number; message: string; timestamp: string }>
> {
  const nextRev = getLocalWorkspaceRevision() + 1;
  setLocalWorkspaceRevision(nextRev);

  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: nextRev }),
      });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch {
      // Fall through to mock fallback
    }
  }

  return {
    success: true,
    data: {
      revision: nextRev,
      message: `System reset executed. Baseline seed cit-public-v1 restored to Revision #${nextRev}.`,
      timestamp: new Date().toISOString(),
    },
    errors: [],
  };
}

/**
 * Fetch all venues and spatial rooms with capacity and accessibility telemetry.
 */
export async function fetchRooms(): Promise<ApiResponse<Room[]>> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/rooms`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fall through to mock fallback
    }
  }

  return {
    success: true,
    data: ROOMS,
    errors: [],
  };
}

/**
 * Fetch all faculty members.
 */
export async function fetchFaculty(): Promise<ApiResponse<Faculty[]>> {
  return {
    success: true,
    data: FACULTY_MEMBERS,
    errors: [],
  };
}

/**
 * Fetch all student groups.
 */
export async function fetchStudentGroups(): Promise<ApiResponse<StudentGroup[]>> {
  return {
    success: true,
    data: STUDENT_GROUPS,
    errors: [],
  };
}

/**
 * Fetch dashboard overview metrics and conflict telemetry.
 */
export async function fetchDashboard(): Promise<ApiResponse<{
  totalSessions: number;
  totalRooms: number;
  totalFaculty: number;
  totalGroups: number;
  roomUtilizationAvg: number;
  hardViolations: number;
  pendingApprovals: number;
}>> {
  return {
    success: true,
    data: {
      totalSessions: BASELINE_SESSIONS.length,
      totalRooms: ROOMS.length,
      totalFaculty: FACULTY_MEMBERS.length,
      totalGroups: STUDENT_GROUPS.length,
      roomUtilizationAvg: 68.4,
      hardViolations: 0,
      pendingApprovals: 4,
    },
    errors: [],
  };
}
