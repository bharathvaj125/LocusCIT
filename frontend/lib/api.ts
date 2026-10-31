import { 
  ScheduledSession, 
  Room, 
  Faculty, 
  StudentGroup, 
  ExamSession,
  BookingRequest,
  DisruptionProposal,
  ParsedBookingDraft,
  ApiResponse,
  DayOfWeek,
  RoleType
} from "./types";
import { 
  BASELINE_SESSIONS, 
  ROOMS, 
  FACULTY_MEMBERS, 
  STUDENT_GROUPS, 
  EXAMS_DATA,
  SPECTRA_BOOKINGS,
  SAMPLE_DISRUPTION_PROPOSAL,
  ROLE_CONFIGS
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

// In-memory mutable stores for mock operations
let inMemoryBookings: BookingRequest[] = [...SPECTRA_BOOKINGS];
let inMemoryProposal: DisruptionProposal = { ...SAMPLE_DISRUPTION_PROPOSAL };

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
        return await res.json();
      }
    } catch {
      // Fall through to mock fallback
    }
  }

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
 * Fetch midsem exams, optionally filtered by student group.
 */
export async function fetchExams(groupId?: string): Promise<ApiResponse<ExamSession[]>> {
  if (API_BASE) {
    try {
      const url = groupId ? `${API_BASE}/api/exams?group=${encodeURIComponent(groupId)}` : `${API_BASE}/api/exams`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fall through to mock fallback
    }
  }

  let data = EXAMS_DATA;
  if (groupId && groupId !== "all") {
    data = EXAMS_DATA.filter(e => e.groups.includes(groupId));
  }

  return {
    success: true,
    data,
    errors: [],
  };
}

/**
 * Fetch all Spectra week booking requests and decisions.
 */
export async function fetchBookings(): Promise<ApiResponse<BookingRequest[]>> {
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/bookings`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fall through to mock fallback
    }
  }

  return {
    success: true,
    data: inMemoryBookings,
    errors: [],
  };
}

/**
 * Submit a structured booking request.
 */
export async function submitBooking(
  request: Omit<BookingRequest, "id" | "status" | "reason" | "submitted_at" | "assigned_room">
): Promise<ApiResponse<BookingRequest>> {
  const newBooking: BookingRequest = {
    ...request,
    id: `BR-${String(inMemoryBookings.length + 1).padStart(2, "0")}`,
    status: "pending",
    assigned_room: request.requested_room || null,
    reason: "Submitted by user. Awaiting administrative review.",
    submitted_at: new Date().toISOString(),
  };

  inMemoryBookings = [newBooking, ...inMemoryBookings];

  return {
    success: true,
    data: newBooking,
    errors: [],
  };
}

/**
 * Make an approval/rejection decision on a booking request.
 */
export async function decideBooking(
  requestId: string,
  action: "approve" | "reject" | "offer_alternative",
  actorRole: RoleType,
  reason?: string,
  alternativeRoom?: string
): Promise<ApiResponse<BookingRequest>> {
  const target = inMemoryBookings.find(b => b.id === requestId);
  if (!target) {
    return {
      success: false,
      data: null as any,
      errors: [{ code: "INVALID_INPUT", message: "Booking request not found" }],
    };
  }

  // Enforce Anti-Self-Approval
  if (target.role === actorRole && actorRole !== "admin") {
    return {
      success: false,
      data: null as any,
      errors: [
        { 
          code: "FORBIDDEN", 
          message: "Anti-Self-Approval Violation: Requesters cannot approve their own requests." 
        }
      ],
    };
  }

  const updatedStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "alternative_offered";
  const updatedReason = reason || (action === "approve" ? "Approved by administrative authority." : "Rejected due to capacity/venue conflict.");

  target.status = updatedStatus;
  target.reason = updatedReason;
  if (alternativeRoom) {
    target.assigned_room = alternativeRoom;
  }

  return {
    success: true,
    data: target,
    errors: [],
  };
}

/**
 * Parse natural language / Hinglish venue requests into an editable structured draft.
 */
export function parseNaturalLanguageBooking(
  text: string,
  currentRole: RoleType
): ParsedBookingDraft {
  const lower = text.toLowerCase();
  
  // Extract Day
  let day: DayOfWeek = "MON";
  if (lower.includes("mon") || lower.includes("somwar")) day = "MON";
  else if (lower.includes("tue") || lower.includes("mangalwar")) day = "TUE";
  else if (lower.includes("wed") || lower.includes("budhwar")) day = "WED";
  else if (lower.includes("thu") || lower.includes("guruwar")) day = "THU";
  else if (lower.includes("fri") || lower.includes("shukrawar")) day = "FRI";
  else if (lower.includes("sat") || lower.includes("shaniwar")) day = "SAT";
  else if (lower.includes("kal")) {
    // Relative date mapping
    day = "THU";
  }

  // Extract Attendance
  let attendance = 50;
  const numMatch = lower.match(/(\d+)\s*(people|students|audience|heads|attendees|pax)/) || lower.match(/for\s*(\d+)/);
  if (numMatch) {
    attendance = parseInt(numMatch[1], 10);
  }

  // Extract Time and Period
  let startPeriod = 10;
  let duration = 2;

  if (lower.includes("6 to 9") || lower.includes("6-9") || lower.includes("shaam 6")) {
    startPeriod = 10;
    duration = 3;
  } else if (lower.includes("morning") || lower.includes("subah")) {
    startPeriod = 2;
    duration = 2;
  } else if (lower.includes("afternoon") || lower.includes("dopahar")) {
    startPeriod = 6;
    duration = 3;
  } else if (lower.includes("evening") || lower.includes("shaam") || lower.includes("night")) {
    startPeriod = 10;
    duration = 2;
  }

  // Extract Features
  const features: string[] = [];
  if (lower.includes("mic") || lower.includes("pa system") || lower.includes("speaker") || lower.includes("sound")) {
    features.push("pa_system");
  }
  if (lower.includes("projector") || lower.includes("screen") || lower.includes("slides")) {
    features.push("projector");
  }
  if (lower.includes("stage") || lower.includes("play") || lower.includes("drama") || lower.includes("dance")) {
    features.push("stage");
  }
  if (lower.includes("wheelchair") || lower.includes("accessible") || lower.includes("elevator")) {
    features.push("accessible");
  }

  // Room Wish
  let requestedRoom: string | undefined;
  if (lower.includes("auditorium") || lower.includes("aud")) requestedRoom = "AUD";
  else if (lower.includes("sh-1") || lower.includes("seminar hall 1")) requestedRoom = "SH-1";
  else if (lower.includes("sh-2") || lower.includes("seminar hall 2")) requestedRoom = "SH-2";
  else if (lower.includes("oat") || lower.includes("theatre")) requestedRoom = "OAT";
  else if (lower.includes("cs lab") || lower.includes("cs-lab")) requestedRoom = "CS-LAB-1";

  // Category and Role Capping
  let requestedCategory: "institute_event" | "guest_lecture" | "department_event" | "club_event" = "club_event";
  if (lower.includes("institute") || lower.includes("convocation") || lower.includes("dean")) {
    requestedCategory = "institute_event";
  } else if (lower.includes("guest") || lower.includes("distinguished lecture")) {
    requestedCategory = "guest_lecture";
  } else if (lower.includes("dept") || lower.includes("department") || lower.includes("workshop")) {
    requestedCategory = "department_event";
  }

  // Role Category Cap Rule (Playbook Sec. 5)
  // Admin -> institute_event, Faculty -> guest_lecture, Coordinator -> department_event, Club -> club_event
  const roleCap: Record<RoleType, "institute_event" | "guest_lecture" | "department_event" | "club_event"> = {
    admin: "institute_event",
    faculty: "guest_lecture",
    department_coordinator: "department_event",
    club: "club_event",
  };

  const priorityOrder = ["institute_event", "guest_lecture", "department_event", "club_event"];
  const cap = roleCap[currentRole];
  const capIndex = priorityOrder.indexOf(cap);
  const reqIndex = priorityOrder.indexOf(requestedCategory);
  
  const effectiveCategory = priorityOrder[Math.max(reqIndex, capIndex)] as any;
  const isCapped = reqIndex < capIndex;

  const ambiguities: string[] = [];
  const assumptions: string[] = [];

  if (lower.includes("kal")) {
    assumptions.push("Mapped relative term 'kal' to next available event day (Thursday).");
  }
  if (lower.includes("mic")) {
    assumptions.push("Normalized Hinglish 'mic' to official required feature 'pa_system'.");
  }
  if (!numMatch) {
    ambiguities.push("No explicit headcount specified. Defaulted estimate to 50 attendees.");
  }
  if (isCapped) {
    ambiguities.push(`Role '${currentRole}' is capped at '${cap}'. Requested '${requestedCategory}' downgraded to '${effectiveCategory}'.`);
  }

  return {
    title: text.length > 40 ? text.slice(0, 37) + "..." : text,
    day,
    start_period: startPeriod,
    duration_periods: duration,
    end_period: startPeriod + duration - 1,
    attendance,
    requested_category: requestedCategory,
    effective_category: effectiveCategory,
    room_types: requestedRoom?.includes("LAB") ? ["lab_cs"] : ["auditorium", "seminar_hall"],
    features,
    requested_room: requestedRoom,
    ambiguities,
    assumptions,
    priority_capped: isCapped,
    original_text: text,
  };
}

/**
 * Fetch disruption proposal.
 */
export async function fetchDisruptionProposal(id?: string): Promise<ApiResponse<DisruptionProposal>> {
  return {
    success: true,
    data: inMemoryProposal,
    errors: [],
  };
}

/**
 * Approve disruption proposal atomically.
 */
export async function approveDisruptionProposal(id: string): Promise<ApiResponse<DisruptionProposal>> {
  inMemoryProposal = {
    ...inMemoryProposal,
    status: "APPROVED",
    approved_by: "Prof. R. Krishnan (Dean of Academic Planning)",
  };

  const nextRev = getLocalWorkspaceRevision() + 1;
  setLocalWorkspaceRevision(nextRev);

  return {
    success: true,
    data: inMemoryProposal,
    errors: [],
  };
}

/**
 * Reject disruption proposal.
 */
export async function rejectDisruptionProposal(id: string): Promise<ApiResponse<DisruptionProposal>> {
  inMemoryProposal = {
    ...inMemoryProposal,
    status: "REJECTED",
  };

  return {
    success: true,
    data: inMemoryProposal,
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

  inMemoryBookings = [...SPECTRA_BOOKINGS];
  inMemoryProposal = { ...SAMPLE_DISRUPTION_PROPOSAL };

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
