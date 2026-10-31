import { StudentGroup, Faculty, Room, Course, ScheduledSession, RoleConfig, NavRoute } from "./types";

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  admin: {
    id: "admin",
    label: "Admin (Dean's Office)",
    badge: "DEAN-OPS",
    persona: "Prof. R. Krishnan, Dean of Academic Planning",
    allowedNav: ["timetable", "exams", "spectra_clash", "approvals", "disruptions", "ai_booking"]
  },
  department_coordinator: {
    id: "department_coordinator",
    label: "Department Coordinator (CSE)",
    badge: "COORD-CSE",
    department: "CSE",
    persona: "Dr. S. Raman, CSE Academic Coordinator",
    allowedNav: ["timetable", "exams", "approvals", "ai_booking"]
  },
  faculty: {
    id: "faculty",
    label: "Faculty (Dr. F01)",
    badge: "FAC-F01",
    facultyId: "F01",
    persona: "Dr. A. Sharma (CSE, Systems Architecture)",
    allowedNav: ["timetable", "exams", "approvals", "ai_booking"]
  },
  club: {
    id: "club",
    label: "Club Representative (Dance Club)",
    badge: "CLUB-DANCE",
    clubName: "ChoreoDance Society",
    persona: "Priya M., Head of Campus Culturals",
    allowedNav: ["timetable", "spectra_clash", "ai_booking"]
  }
};

export const NAV_ROUTES: NavRoute[] = [
  { id: "timetable", label: "Timetable Matrix", href: "/timetable", description: "High-density multi-pivot schedule grid" },
  { id: "exams", label: "Midsem Exams", href: "/exams", description: "Mid-semester examination hall allocator" },
  { id: "spectra_clash", label: "Spectra Clash Matrix", href: "/spectra-clash", description: "Fest week request conflict & priority evaluator" },
  { id: "approvals", label: "Approvals & Queue", href: "/approvals", description: "Role-scoped pending booking decisions" },
  { id: "disruptions", label: "Disruption Engine", href: "/disruptions", description: "Atomic schedule repair & diff proposals" },
  { id: "ai_booking", label: "AI Assistant", href: "/ai-booking", description: "Natural language booking parser" }
];

export const STUDENT_GROUPS: StudentGroup[] = [
  {
    "id": "Y1-A",
    "name": "B.Tech Year 1, Section A",
    "year": 1,
    "department": "COMMON",
    "size": 90,
    "needs_accessible": false
  },
  {
    "id": "Y1-B",
    "name": "B.Tech Year 1, Section B",
    "year": 1,
    "department": "COMMON",
    "size": 90,
    "needs_accessible": false
  },
  {
    "id": "Y1-C",
    "name": "B.Tech Year 1, Section C",
    "year": 1,
    "department": "COMMON",
    "size": 90,
    "needs_accessible": false
  },
  {
    "id": "Y1-D",
    "name": "B.Tech Year 1, Section D",
    "year": 1,
    "department": "COMMON",
    "size": 90,
    "needs_accessible": false
  },
  {
    "id": "CSE-2",
    "name": "CSE Year 2",
    "year": 2,
    "department": "CSE",
    "size": 80,
    "needs_accessible": false
  },
  {
    "id": "ECE-2",
    "name": "ECE Year 2",
    "year": 2,
    "department": "ECE",
    "size": 70,
    "needs_accessible": false
  },
  {
    "id": "EE-2",
    "name": "EE Year 2",
    "year": 2,
    "department": "EE",
    "size": 60,
    "needs_accessible": false
  },
  {
    "id": "ME-2",
    "name": "ME Year 2",
    "year": 2,
    "department": "ME",
    "size": 60,
    "needs_accessible": true
  },
  {
    "id": "CE-2",
    "name": "CE Year 2",
    "year": 2,
    "department": "CE",
    "size": 50,
    "needs_accessible": false
  },
  {
    "id": "CSE-3",
    "name": "CSE Year 3",
    "year": 3,
    "department": "CSE",
    "size": 75,
    "needs_accessible": false
  },
  {
    "id": "ECE-3",
    "name": "ECE Year 3",
    "year": 3,
    "department": "ECE",
    "size": 65,
    "needs_accessible": false
  },
  {
    "id": "EE-3",
    "name": "EE Year 3",
    "year": 3,
    "department": "EE",
    "size": 55,
    "needs_accessible": false
  },
  {
    "id": "ME-3",
    "name": "ME Year 3",
    "year": 3,
    "department": "ME",
    "size": 55,
    "needs_accessible": false
  },
  {
    "id": "CE-3",
    "name": "CE Year 3",
    "year": 3,
    "department": "CE",
    "size": 45,
    "needs_accessible": false
  }
];

export const FACULTY_MEMBERS: Faculty[] = [
  {
    "id": "F01",
    "name": "Dr. Ananya Mishra",
    "department": "CSE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [
      {
        "day": "WED",
        "periods": [
          6,
          7,
          8,
          9
        ],
        "reason": "HOD meeting"
      }
    ],
    "preferences": []
  },
  {
    "id": "F02",
    "name": "Dr. Rohit Sahoo",
    "department": "CSE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": [
      {
        "type": "avoid",
        "days": [
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI"
        ],
        "periods": [
          1
        ],
        "note": "Prefers not to teach at 8 AM"
      }
    ]
  },
  {
    "id": "F03",
    "name": "Dr. Kavya Iyer",
    "department": "CSE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F04",
    "name": "Dr. Sandeep Patnaik",
    "department": "CSE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F05",
    "name": "Dr. Meera Nair",
    "department": "CSE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": [
      {
        "type": "avoid",
        "days": [
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI"
        ],
        "periods": [
          1
        ],
        "note": "Prefers not to teach at 8 AM"
      }
    ]
  },
  {
    "id": "F06",
    "name": "Dr. Arjun Mehta",
    "department": "CSE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": [
      {
        "type": "avoid",
        "days": [
          "FRI"
        ],
        "periods": [
          6,
          7,
          8,
          9
        ],
        "note": "Keeps Friday afternoons for research"
      }
    ]
  },
  {
    "id": "F07",
    "name": "Dr. Pooja Das",
    "department": "CSE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F08",
    "name": "Prof. Vikram Rao (Visiting)",
    "department": "CSE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [
      {
        "day": "MON",
        "periods": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9
        ],
        "reason": "Visiting faculty: on campus Tue and Thu only"
      },
      {
        "day": "WED",
        "periods": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9
        ],
        "reason": "Visiting faculty: on campus Tue and Thu only"
      },
      {
        "day": "FRI",
        "periods": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9
        ],
        "reason": "Visiting faculty: on campus Tue and Thu only"
      }
    ],
    "preferences": []
  },
  {
    "id": "F09",
    "name": "Dr. Ishita Banerjee",
    "department": "ECE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [
      {
        "day": "WED",
        "periods": [
          6,
          7,
          8,
          9
        ],
        "reason": "HOD meeting"
      }
    ],
    "preferences": []
  },
  {
    "id": "F10",
    "name": "Dr. Suresh Pradhan",
    "department": "ECE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": [
      {
        "type": "avoid",
        "days": [
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI"
        ],
        "periods": [
          6,
          7,
          8,
          9
        ],
        "note": "Prefers mornings"
      }
    ]
  },
  {
    "id": "F11",
    "name": "Dr. Neha Kulkarni",
    "department": "ECE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F12",
    "name": "Dr. Amit Behera",
    "department": "ECE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F13",
    "name": "Dr. Ritu Sharma",
    "department": "ECE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F14",
    "name": "Dr. Kunal Joshi",
    "department": "EE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [
      {
        "day": "WED",
        "periods": [
          6,
          7,
          8,
          9
        ],
        "reason": "HOD meeting"
      }
    ],
    "preferences": []
  },
  {
    "id": "F15",
    "name": "Dr. Sneha Mohanty",
    "department": "EE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F16",
    "name": "Dr. Rakesh Panda",
    "department": "EE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F17",
    "name": "Dr. Divya Menon",
    "department": "EE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": [
      {
        "type": "avoid",
        "days": [
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI"
        ],
        "periods": [
          9
        ],
        "note": "Avoid the 5 PM slot"
      }
    ]
  },
  {
    "id": "F18",
    "name": "Dr. Manoj Tripathy",
    "department": "EE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F19",
    "name": "Dr. Shalini Gupta",
    "department": "MA",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": [
      {
        "type": "avoid",
        "days": [
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI"
        ],
        "periods": [
          9
        ],
        "note": "Avoid the 5 PM slot"
      }
    ]
  },
  {
    "id": "F20",
    "name": "Dr. Prakash Nayak",
    "department": "MA",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F21",
    "name": "Dr. Lakshmi Reddy",
    "department": "PH",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [
      {
        "day": "FRI",
        "periods": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9
        ],
        "reason": "Research travel every Friday"
      }
    ],
    "preferences": []
  },
  {
    "id": "F22",
    "name": "Dr. Harish Dash",
    "department": "PH",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F23",
    "name": "Dr. Farah Khan",
    "department": "PH",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F24",
    "name": "Dr. Gaurav Jena",
    "department": "PH",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F25",
    "name": "Dr. Tanvi Desai",
    "department": "ME",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [
      {
        "day": "WED",
        "periods": [
          6,
          7,
          8,
          9
        ],
        "reason": "HOD meeting"
      }
    ],
    "preferences": []
  },
  {
    "id": "F26",
    "name": "Dr. Abhishek Rout",
    "department": "ME",
    "max_hours_per_day": 4,
    "needs_accessible": true,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F27",
    "name": "Dr. Sunita Bose",
    "department": "ME",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F28",
    "name": "Dr. Nikhil Swain",
    "department": "ME",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F29",
    "name": "Dr. Priya Raman",
    "department": "ME",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F30",
    "name": "Dr. Debashish Sethi",
    "department": "ME",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F31",
    "name": "Dr. Anjali Verma",
    "department": "CE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [
      {
        "day": "WED",
        "periods": [
          6,
          7,
          8,
          9
        ],
        "reason": "HOD meeting"
      }
    ],
    "preferences": []
  },
  {
    "id": "F32",
    "name": "Dr. Sameer Khuntia",
    "department": "CE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": [
      {
        "type": "avoid",
        "days": [
          "MON"
        ],
        "periods": [
          1
        ],
        "note": "No Monday 8 AM"
      }
    ]
  },
  {
    "id": "F33",
    "name": "Dr. Rekha Pillai",
    "department": "CE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F34",
    "name": "Dr. Varun Acharya",
    "department": "CE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F35",
    "name": "Dr. Bhavna Saxena",
    "department": "CE",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F36",
    "name": "Dr. Ashok Mahapatra",
    "department": "HSS",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [
      {
        "day": "MON",
        "periods": [
          1,
          2,
          3
        ],
        "reason": "Teaches at partner school Monday mornings"
      }
    ],
    "preferences": []
  },
  {
    "id": "F37",
    "name": "Prof. Shreya Kapoor (Dean)",
    "department": "ADMIN",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [
      {
        "day": "TUE",
        "periods": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9
        ],
        "reason": "Board meetings Tue/Thu"
      },
      {
        "day": "THU",
        "periods": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9
        ],
        "reason": "Board meetings Tue/Thu"
      },
      {
        "day": "MON",
        "periods": [
          1,
          2,
          6,
          7,
          8,
          9
        ],
        "reason": "Dean's office hours"
      },
      {
        "day": "WED",
        "periods": [
          1,
          2,
          6,
          7,
          8,
          9
        ],
        "reason": "Dean's office hours"
      },
      {
        "day": "FRI",
        "periods": [
          1,
          2,
          6,
          7,
          8,
          9
        ],
        "reason": "Dean's office hours"
      }
    ],
    "preferences": []
  },
  {
    "id": "F38",
    "name": "Dr. Imran Qureshi",
    "department": "HSS",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F39",
    "name": "Dr. Radhika Hegde",
    "department": "HSS",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  },
  {
    "id": "F40",
    "name": "Dr. Om Prakash Sahu",
    "department": "HSS",
    "max_hours_per_day": 4,
    "needs_accessible": false,
    "unavailable": [],
    "preferences": []
  }
];

export const ROOMS: Room[] = [
  {
    "id": "AUD",
    "name": "Main Auditorium",
    "building": "Admin Block",
    "type": "auditorium",
    "capacity": 500,
    "features": [
      "projector",
      "pa_system",
      "stage",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "LH-1",
    "name": "Lecture Hall 1",
    "building": "Lecture Hall Complex",
    "type": "lecture_hall",
    "capacity": 200,
    "features": [
      "projector",
      "pa_system",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "LH-2",
    "name": "Lecture Hall 2",
    "building": "Lecture Hall Complex",
    "type": "lecture_hall",
    "capacity": 200,
    "features": [
      "projector",
      "pa_system",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "LH-3",
    "name": "Lecture Hall 3",
    "building": "Lecture Hall Complex",
    "type": "lecture_hall",
    "capacity": 120,
    "features": [
      "projector",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "LH-4",
    "name": "Lecture Hall 4",
    "building": "Lecture Hall Complex",
    "type": "lecture_hall",
    "capacity": 120,
    "features": [
      "projector",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "LH-5",
    "name": "Lecture Hall 5",
    "building": "Lecture Hall Complex",
    "type": "lecture_hall",
    "capacity": 120,
    "features": [
      "projector",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "LH-6",
    "name": "Lecture Hall 6",
    "building": "Lecture Hall Complex",
    "type": "lecture_hall",
    "capacity": 120,
    "features": [
      "projector",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-101",
    "name": "Classroom A-101",
    "building": "Academic Block A (ground floor)",
    "type": "classroom",
    "capacity": 90,
    "features": [
      "projector"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-102",
    "name": "Classroom A-102",
    "building": "Academic Block A (ground floor)",
    "type": "classroom",
    "capacity": 90,
    "features": [
      "projector"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-103",
    "name": "Classroom A-103",
    "building": "Academic Block A (ground floor)",
    "type": "classroom",
    "capacity": 80,
    "features": [
      "projector"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-104",
    "name": "Classroom A-104",
    "building": "Academic Block A (ground floor)",
    "type": "classroom",
    "capacity": 80,
    "features": [
      "projector"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-105",
    "name": "Classroom A-105",
    "building": "Academic Block A (ground floor)",
    "type": "classroom",
    "capacity": 70,
    "features": [
      "projector"
    ],
    "accessible": true,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-201",
    "name": "Classroom B-201",
    "building": "Academic Block B (2nd floor, no lift)",
    "type": "classroom",
    "capacity": 90,
    "features": [
      "projector"
    ],
    "accessible": false,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-202",
    "name": "Classroom B-202",
    "building": "Academic Block B (2nd floor, no lift)",
    "type": "classroom",
    "capacity": 80,
    "features": [
      "projector"
    ],
    "accessible": false,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-203",
    "name": "Classroom B-203",
    "building": "Academic Block B (2nd floor, no lift)",
    "type": "classroom",
    "capacity": 80,
    "features": [
      "projector"
    ],
    "accessible": false,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-204",
    "name": "Classroom B-204",
    "building": "Academic Block B (2nd floor, no lift)",
    "type": "classroom",
    "capacity": 70,
    "features": [
      "projector"
    ],
    "accessible": false,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "CR-205",
    "name": "Classroom B-205",
    "building": "Academic Block B (2nd floor, no lift)",
    "type": "classroom",
    "capacity": 60,
    "features": [
      "projector"
    ],
    "accessible": false,
    "allowed_uses": [
      "lecture",
      "tutorial",
      "exam",
      "event"
    ]
  },
  {
    "id": "SH-1",
    "name": "Seminar Hall 1",
    "building": "Library Building",
    "type": "seminar_hall",
    "capacity": 150,
    "features": [
      "projector",
      "pa_system",
      "stage",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "exam",
      "event"
    ]
  },
  {
    "id": "SH-2",
    "name": "Seminar Hall 2",
    "building": "Library Building (1st floor, no lift)",
    "type": "seminar_hall",
    "capacity": 100,
    "features": [
      "projector",
      "pa_system",
      "ac"
    ],
    "accessible": false,
    "allowed_uses": [
      "exam",
      "event"
    ]
  },
  {
    "id": "OAT",
    "name": "Open Air Theatre",
    "building": "Campus Green",
    "type": "outdoor",
    "capacity": 800,
    "features": [
      "stage",
      "pa_system"
    ],
    "accessible": true,
    "allowed_uses": [
      "event"
    ]
  },
  {
    "id": "CS-LAB-1",
    "name": "Computing Lab 1",
    "building": "CSE Building",
    "type": "lab_cs",
    "capacity": 90,
    "features": [
      "computers",
      "projector",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "lab",
      "event"
    ]
  },
  {
    "id": "CS-LAB-2",
    "name": "Computing Lab 2",
    "building": "CSE Building",
    "type": "lab_cs",
    "capacity": 90,
    "features": [
      "computers",
      "projector",
      "ac"
    ],
    "accessible": true,
    "allowed_uses": [
      "lab",
      "event"
    ]
  },
  {
    "id": "ELEC-LAB-1",
    "name": "Electronics Lab 1",
    "building": "EE-ECE Building",
    "type": "lab_elec",
    "capacity": 80,
    "features": [
      "projector",
      "power_benches"
    ],
    "accessible": true,
    "allowed_uses": [
      "lab",
      "event"
    ]
  },
  {
    "id": "ELEC-LAB-2",
    "name": "Electronics Lab 2",
    "building": "EE-ECE Building",
    "type": "lab_elec",
    "capacity": 80,
    "features": [
      "projector",
      "power_benches"
    ],
    "accessible": true,
    "allowed_uses": [
      "lab",
      "event"
    ]
  },
  {
    "id": "PHY-LAB",
    "name": "Physics Lab",
    "building": "Science Block",
    "type": "lab_phy",
    "capacity": 90,
    "features": [
      "projector"
    ],
    "accessible": true,
    "allowed_uses": [
      "lab",
      "event"
    ]
  },
  {
    "id": "MECH-WS",
    "name": "Central Workshop",
    "building": "Workshop Shed",
    "type": "workshop",
    "capacity": 90,
    "features": [
      "power_benches"
    ],
    "accessible": true,
    "allowed_uses": [
      "lab",
      "event"
    ]
  },
  {
    "id": "CIVIL-LAB",
    "name": "Civil Engineering Lab",
    "building": "Civil Building",
    "type": "lab_civil",
    "capacity": 60,
    "features": [
      "projector"
    ],
    "accessible": true,
    "allowed_uses": [
      "lab",
      "event"
    ]
  }
];

export const COURSES: Course[] = [
  {
    "id": "MA101",
    "title": "Calculus and Linear Algebra",
    "department": "MA",
    "year": 1,
    "lecture_hours": 3,
    "tutorial_hours": 1,
    "lab_blocks": 0
  },
  {
    "id": "PH101",
    "title": "Engineering Physics",
    "department": "PH",
    "year": 1,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "PH191",
    "title": "Physics Laboratory",
    "department": "PH",
    "year": 1,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "CS101",
    "title": "Programming in C",
    "department": "CSE",
    "year": 1,
    "lecture_hours": 2,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CS191",
    "title": "Programming Laboratory",
    "department": "CSE",
    "year": 1,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "WS101",
    "title": "Engineering Workshop",
    "department": "ME",
    "year": 1,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "HS101",
    "title": "Communicative English",
    "department": "HSS",
    "year": 1,
    "lecture_hours": 2,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "ID101",
    "title": "Introduction to Engineering",
    "department": "ADMIN",
    "year": 1,
    "lecture_hours": 1,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CS201",
    "title": "Data Structures",
    "department": "CSE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CS202",
    "title": "Discrete Mathematics",
    "department": "CSE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 1,
    "lab_blocks": 0
  },
  {
    "id": "CS203",
    "title": "Digital Logic Design",
    "department": "CSE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CS204",
    "title": "Object-Oriented Programming",
    "department": "CSE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CS291",
    "title": "Data Structures Lab",
    "department": "CSE",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "CS292",
    "title": "Digital Logic Lab",
    "department": "CSE",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "EC201",
    "title": "Signals and Systems",
    "department": "ECE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 1,
    "lab_blocks": 0
  },
  {
    "id": "EC202",
    "title": "Network Theory",
    "department": "ECE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EC203",
    "title": "Electronic Devices",
    "department": "ECE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EC204",
    "title": "Probability and Random Processes",
    "department": "ECE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EC291",
    "title": "Electronic Devices Lab",
    "department": "ECE",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "EC292",
    "title": "Programming Lab",
    "department": "ECE",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "EE201",
    "title": "Circuit Analysis",
    "department": "EE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 1,
    "lab_blocks": 0
  },
  {
    "id": "EE202",
    "title": "Electrical Machines I",
    "department": "EE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EE203",
    "title": "Electrical Measurements",
    "department": "EE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EE204",
    "title": "Electromagnetic Fields",
    "department": "EE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EE291",
    "title": "Measurements Lab",
    "department": "EE",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "EE292",
    "title": "Machines Lab",
    "department": "EE",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "ME201",
    "title": "Engineering Thermodynamics",
    "department": "ME",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "ME202",
    "title": "Mechanics of Solids",
    "department": "ME",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 1,
    "lab_blocks": 0
  },
  {
    "id": "ME203",
    "title": "Kinematics of Machines",
    "department": "ME",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "ME204",
    "title": "Manufacturing Processes",
    "department": "ME",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "ME291",
    "title": "Workshop Practice II",
    "department": "ME",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "ME292",
    "title": "Materials Testing Lab",
    "department": "ME",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "CE201",
    "title": "Surveying",
    "department": "CE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CE202",
    "title": "Fluid Mechanics",
    "department": "CE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 1,
    "lab_blocks": 0
  },
  {
    "id": "CE203",
    "title": "Strength of Materials",
    "department": "CE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CE204",
    "title": "Engineering Geology",
    "department": "CE",
    "year": 2,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CE291",
    "title": "Surveying Lab",
    "department": "CE",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "CE292",
    "title": "Fluid Mechanics Lab",
    "department": "CE",
    "year": 2,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "HS201",
    "title": "Principles of Economics",
    "department": "HSS",
    "year": 2,
    "lecture_hours": 2,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CS301",
    "title": "Operating Systems",
    "department": "CSE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CS302",
    "title": "Database Systems",
    "department": "CSE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CS303",
    "title": "Computer Networks",
    "department": "CSE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CS391",
    "title": "Systems Lab",
    "department": "CSE",
    "year": 3,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "EC301",
    "title": "Communication Systems",
    "department": "ECE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EC302",
    "title": "Digital Signal Processing",
    "department": "ECE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EC303",
    "title": "VLSI Design",
    "department": "ECE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EC391",
    "title": "Communication Lab",
    "department": "ECE",
    "year": 3,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "EE301",
    "title": "Power Systems",
    "department": "EE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EE302",
    "title": "Control Systems",
    "department": "EE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EE303",
    "title": "Power Electronics",
    "department": "EE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "EE391",
    "title": "Power Lab",
    "department": "EE",
    "year": 3,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "ME301",
    "title": "Heat Transfer",
    "department": "ME",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "ME302",
    "title": "Machine Design",
    "department": "ME",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "ME303",
    "title": "Fluid Machines",
    "department": "ME",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "ME391",
    "title": "Thermal Lab",
    "department": "ME",
    "year": 3,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "CE301",
    "title": "Structural Analysis",
    "department": "CE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CE302",
    "title": "Geotechnical Engineering",
    "department": "CE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CE303",
    "title": "Transportation Engineering",
    "department": "CE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "CE391",
    "title": "Structures Lab",
    "department": "CE",
    "year": 3,
    "lecture_hours": 0,
    "tutorial_hours": 0,
    "lab_blocks": 1
  },
  {
    "id": "OE301",
    "title": "Introduction to Finance",
    "department": "HSS",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "OE302",
    "title": "Data Visualisation",
    "department": "CSE",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  },
  {
    "id": "OE303",
    "title": "Technical Writing",
    "department": "HSS",
    "year": 3,
    "lecture_hours": 3,
    "tutorial_hours": 0,
    "lab_blocks": 0
  }
];

export const BASELINE_SESSIONS: ScheduledSession[] = [
  {
    "id": "OE301-L1",
    "course_id": "OE301",
    "course_title": "Introduction to Finance",
    "kind": "lecture",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "faculty_id": "F39",
    "faculty_name": "Dr. Radhika Hegde",
    "faculty_dept": "HSS",
    "size": 109,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": "OEB-1",
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.22
  },
  {
    "id": "OE302-L1",
    "course_id": "OE302",
    "course_title": "Data Visualisation",
    "kind": "lecture",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "faculty_dept": "CSE",
    "size": 97,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": "OEB-1",
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.49
  },
  {
    "id": "OE303-L1",
    "course_id": "OE303",
    "course_title": "Technical Writing",
    "kind": "lecture",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "faculty_id": "F40",
    "faculty_name": "Dr. Om Prakash Sahu",
    "faculty_dept": "HSS",
    "size": 89,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": "OEB-1",
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "OE301-L2",
    "course_id": "OE301",
    "course_title": "Introduction to Finance",
    "kind": "lecture",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "faculty_id": "F39",
    "faculty_name": "Dr. Radhika Hegde",
    "faculty_dept": "HSS",
    "size": 109,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": "OEB-2",
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 2,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.22
  },
  {
    "id": "OE302-L2",
    "course_id": "OE302",
    "course_title": "Data Visualisation",
    "kind": "lecture",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "faculty_dept": "CSE",
    "size": 97,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": "OEB-2",
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.49
  },
  {
    "id": "OE303-L2",
    "course_id": "OE303",
    "course_title": "Technical Writing",
    "kind": "lecture",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "faculty_id": "F40",
    "faculty_name": "Dr. Om Prakash Sahu",
    "faculty_dept": "HSS",
    "size": 89,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": "OEB-2",
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "OE301-L3",
    "course_id": "OE301",
    "course_title": "Introduction to Finance",
    "kind": "lecture",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "faculty_id": "F39",
    "faculty_name": "Dr. Radhika Hegde",
    "faculty_dept": "HSS",
    "size": 109,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": "OEB-3",
    "fixed_slot": null,
    "day": "MON",
    "start_period": 3,
    "end_period": 3,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.22
  },
  {
    "id": "OE302-L3",
    "course_id": "OE302",
    "course_title": "Data Visualisation",
    "kind": "lecture",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "faculty_dept": "CSE",
    "size": 97,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": "OEB-3",
    "fixed_slot": null,
    "day": "MON",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.49
  },
  {
    "id": "OE303-L3",
    "course_id": "OE303",
    "course_title": "Technical Writing",
    "kind": "lecture",
    "groups": [
      "CSE-3",
      "ECE-3",
      "EE-3",
      "ME-3",
      "CE-3"
    ],
    "faculty_id": "F40",
    "faculty_name": "Dr. Om Prakash Sahu",
    "faculty_dept": "HSS",
    "size": 89,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": "OEB-3",
    "fixed_slot": null,
    "day": "MON",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "PH191-A-P1",
    "course_id": "PH191",
    "course_title": "Physics Laboratory",
    "kind": "lab",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F23",
    "faculty_name": "Dr. Farah Khan",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 3,
    "room_types": [
      "lab_phy"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 4,
    "room_id": "PHY-LAB",
    "room_name": "Physics Lab",
    "room_capacity": 90,
    "room_type": "lab_phy",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "CS191-A-P1",
    "course_id": "CS191",
    "course_title": "Programming Laboratory",
    "kind": "lab",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F03",
    "faculty_name": "Dr. Kavya Iyer",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 3,
    "room_types": [
      "lab_cs"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 8,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1",
    "room_capacity": 90,
    "room_type": "lab_cs",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "WS101-A-P1",
    "course_id": "WS101",
    "course_title": "Engineering Workshop",
    "kind": "lab",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F29",
    "faculty_name": "Dr. Priya Raman",
    "faculty_dept": "ME",
    "size": 90,
    "duration": 3,
    "room_types": [
      "workshop"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 4,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop",
    "room_capacity": 90,
    "room_type": "workshop",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "PH191-B-P1",
    "course_id": "PH191",
    "course_title": "Physics Laboratory",
    "kind": "lab",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F23",
    "faculty_name": "Dr. Farah Khan",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 3,
    "room_types": [
      "lab_phy"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 4,
    "room_id": "PHY-LAB",
    "room_name": "Physics Lab",
    "room_capacity": 90,
    "room_type": "lab_phy",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "CS191-B-P1",
    "course_id": "CS191",
    "course_title": "Programming Laboratory",
    "kind": "lab",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F03",
    "faculty_name": "Dr. Kavya Iyer",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 3,
    "room_types": [
      "lab_cs"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 8,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1",
    "room_capacity": 90,
    "room_type": "lab_cs",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "WS101-B-P1",
    "course_id": "WS101",
    "course_title": "Engineering Workshop",
    "kind": "lab",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F29",
    "faculty_name": "Dr. Priya Raman",
    "faculty_dept": "ME",
    "size": 90,
    "duration": 3,
    "room_types": [
      "workshop"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 4,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop",
    "room_capacity": 90,
    "room_type": "workshop",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "PH191-C-P1",
    "course_id": "PH191",
    "course_title": "Physics Laboratory",
    "kind": "lab",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F24",
    "faculty_name": "Dr. Gaurav Jena",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 3,
    "room_types": [
      "lab_phy"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 8,
    "room_id": "PHY-LAB",
    "room_name": "Physics Lab",
    "room_capacity": 90,
    "room_type": "lab_phy",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "CS191-C-P1",
    "course_id": "CS191",
    "course_title": "Programming Laboratory",
    "kind": "lab",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F04",
    "faculty_name": "Dr. Sandeep Patnaik",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 3,
    "room_types": [
      "lab_cs"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 4,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1",
    "room_capacity": 90,
    "room_type": "lab_cs",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "WS101-C-P1",
    "course_id": "WS101",
    "course_title": "Engineering Workshop",
    "kind": "lab",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F30",
    "faculty_name": "Dr. Debashish Sethi",
    "faculty_dept": "ME",
    "size": 90,
    "duration": 3,
    "room_types": [
      "workshop"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 8,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop",
    "room_capacity": 90,
    "room_type": "workshop",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "PH191-D-P1",
    "course_id": "PH191",
    "course_title": "Physics Laboratory",
    "kind": "lab",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F24",
    "faculty_name": "Dr. Gaurav Jena",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 3,
    "room_types": [
      "lab_phy"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 8,
    "room_id": "PHY-LAB",
    "room_name": "Physics Lab",
    "room_capacity": 90,
    "room_type": "lab_phy",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "CS191-D-P1",
    "course_id": "CS191",
    "course_title": "Programming Laboratory",
    "kind": "lab",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F04",
    "faculty_name": "Dr. Sandeep Patnaik",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 3,
    "room_types": [
      "lab_cs"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 4,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1",
    "room_capacity": 90,
    "room_type": "lab_cs",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "WS101-D-P1",
    "course_id": "WS101",
    "course_title": "Engineering Workshop",
    "kind": "lab",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F30",
    "faculty_name": "Dr. Debashish Sethi",
    "faculty_dept": "ME",
    "size": 90,
    "duration": 3,
    "room_types": [
      "workshop"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 8,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop",
    "room_capacity": 90,
    "room_type": "workshop",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "CS291-P1",
    "course_id": "CS291",
    "course_title": "Data Structures Lab",
    "kind": "lab",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F03",
    "faculty_name": "Dr. Kavya Iyer",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 3,
    "room_types": [
      "lab_cs"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 2,
    "end_period": 4,
    "room_id": "CS-LAB-1",
    "room_name": "Computing Lab 1",
    "room_capacity": 90,
    "room_type": "lab_cs",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.89
  },
  {
    "id": "CS292-P1",
    "course_id": "CS292",
    "course_title": "Digital Logic Lab",
    "kind": "lab",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F07",
    "faculty_name": "Dr. Pooja Das",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 3,
    "room_types": [
      "lab_elec"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 4,
    "room_id": "ELEC-LAB-1",
    "room_name": "Electronics Lab 1",
    "room_capacity": 80,
    "room_type": "lab_elec",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 1
  },
  {
    "id": "EC291-P1",
    "course_id": "EC291",
    "course_title": "Electronic Devices Lab",
    "kind": "lab",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F11",
    "faculty_name": "Dr. Neha Kulkarni",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 3,
    "room_types": [
      "lab_elec"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 4,
    "room_id": "ELEC-LAB-2",
    "room_name": "Electronics Lab 2",
    "room_capacity": 80,
    "room_type": "lab_elec",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.88
  },
  {
    "id": "EC292-P1",
    "course_id": "EC292",
    "course_title": "Programming Lab",
    "kind": "lab",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "faculty_dept": "CSE",
    "size": 70,
    "duration": 3,
    "room_types": [
      "lab_cs"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 4,
    "room_id": "CS-LAB-2",
    "room_name": "Computing Lab 2",
    "room_capacity": 90,
    "room_type": "lab_cs",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.78
  },
  {
    "id": "EE291-P1",
    "course_id": "EE291",
    "course_title": "Measurements Lab",
    "kind": "lab",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F16",
    "faculty_name": "Dr. Rakesh Panda",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 3,
    "room_types": [
      "lab_elec"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 8,
    "room_id": "ELEC-LAB-1",
    "room_name": "Electronics Lab 1",
    "room_capacity": 80,
    "room_type": "lab_elec",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "EE292-P1",
    "course_id": "EE292",
    "course_title": "Machines Lab",
    "kind": "lab",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F18",
    "faculty_name": "Dr. Manoj Tripathy",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 3,
    "room_types": [
      "lab_elec"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 4,
    "room_id": "ELEC-LAB-1",
    "room_name": "Electronics Lab 1",
    "room_capacity": 80,
    "room_type": "lab_elec",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "ME291-P1",
    "course_id": "ME291",
    "course_title": "Workshop Practice II",
    "kind": "lab",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F28",
    "faculty_name": "Dr. Nikhil Swain",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 3,
    "room_types": [
      "workshop"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 2,
    "end_period": 4,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop",
    "room_capacity": 90,
    "room_type": "workshop",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.67
  },
  {
    "id": "ME292-P1",
    "course_id": "ME292",
    "course_title": "Materials Testing Lab",
    "kind": "lab",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F29",
    "faculty_name": "Dr. Priya Raman",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 3,
    "room_types": [
      "workshop"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 6,
    "end_period": 8,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop",
    "room_capacity": 90,
    "room_type": "workshop",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.67
  },
  {
    "id": "CE291-P1",
    "course_id": "CE291",
    "course_title": "Surveying Lab",
    "kind": "lab",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F34",
    "faculty_name": "Dr. Varun Acharya",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 3,
    "room_types": [
      "lab_civil"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 4,
    "room_id": "CIVIL-LAB",
    "room_name": "Civil Engineering Lab",
    "room_capacity": 60,
    "room_type": "lab_civil",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.83
  },
  {
    "id": "CE292-P1",
    "course_id": "CE292",
    "course_title": "Fluid Mechanics Lab",
    "kind": "lab",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F35",
    "faculty_name": "Dr. Bhavna Saxena",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 3,
    "room_types": [
      "lab_civil"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 8,
    "room_id": "CIVIL-LAB",
    "room_name": "Civil Engineering Lab",
    "room_capacity": 60,
    "room_type": "lab_civil",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.83
  },
  {
    "id": "CS391-P1",
    "course_id": "CS391",
    "course_title": "Systems Lab",
    "kind": "lab",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F04",
    "faculty_name": "Dr. Sandeep Patnaik",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 3,
    "room_types": [
      "lab_cs"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 2,
    "end_period": 4,
    "room_id": "CS-LAB-2",
    "room_name": "Computing Lab 2",
    "room_capacity": 90,
    "room_type": "lab_cs",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.83
  },
  {
    "id": "EC391-P1",
    "course_id": "EC391",
    "course_title": "Communication Lab",
    "kind": "lab",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F13",
    "faculty_name": "Dr. Ritu Sharma",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 3,
    "room_types": [
      "lab_elec"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 8,
    "room_id": "ELEC-LAB-2",
    "room_name": "Electronics Lab 2",
    "room_capacity": 80,
    "room_type": "lab_elec",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.81
  },
  {
    "id": "EE391-P1",
    "course_id": "EE391",
    "course_title": "Power Lab",
    "kind": "lab",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F18",
    "faculty_name": "Dr. Manoj Tripathy",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 3,
    "room_types": [
      "lab_elec"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 2,
    "end_period": 4,
    "room_id": "ELEC-LAB-1",
    "room_name": "Electronics Lab 1",
    "room_capacity": 80,
    "room_type": "lab_elec",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.69
  },
  {
    "id": "ME391-P1",
    "course_id": "ME391",
    "course_title": "Thermal Lab",
    "kind": "lab",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F30",
    "faculty_name": "Dr. Debashish Sethi",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 3,
    "room_types": [
      "workshop"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "THU",
    "start_period": 2,
    "end_period": 4,
    "room_id": "MECH-WS",
    "room_name": "Central Workshop",
    "room_capacity": 90,
    "room_type": "workshop",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.61
  },
  {
    "id": "CE391-P1",
    "course_id": "CE391",
    "course_title": "Structures Lab",
    "kind": "lab",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F35",
    "faculty_name": "Dr. Bhavna Saxena",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 3,
    "room_types": [
      "lab_civil"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 4,
    "room_id": "CIVIL-LAB",
    "room_name": "Civil Engineering Lab",
    "room_capacity": 60,
    "room_type": "lab_civil",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "MA101-AB-L1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "groups": [
      "Y1-A",
      "Y1-B"
    ],
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "faculty_dept": "MA",
    "size": 180,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.36
  },
  {
    "id": "MA101-AB-L2",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "groups": [
      "Y1-A",
      "Y1-B"
    ],
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "faculty_dept": "MA",
    "size": 180,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 9,
    "end_period": 9,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.36
  },
  {
    "id": "MA101-AB-L3",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "groups": [
      "Y1-A",
      "Y1-B"
    ],
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "faculty_dept": "MA",
    "size": 180,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.36
  },
  {
    "id": "MA101-CD-L1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "groups": [
      "Y1-C",
      "Y1-D"
    ],
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "faculty_dept": "MA",
    "size": 180,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.9
  },
  {
    "id": "MA101-CD-L2",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "groups": [
      "Y1-C",
      "Y1-D"
    ],
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "faculty_dept": "MA",
    "size": 180,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.9
  },
  {
    "id": "MA101-CD-L3",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "lecture",
    "groups": [
      "Y1-C",
      "Y1-D"
    ],
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "faculty_dept": "MA",
    "size": 180,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.9
  },
  {
    "id": "MA101-A-T1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "tutorial",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "faculty_dept": "MA",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "PH101-A-L1",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "PH101-A-L2",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 6,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "PH101-A-L3",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 7,
    "end_period": 7,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "CS101-A-L1",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 8,
    "end_period": 8,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "CS101-A-L2",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 9,
    "end_period": 9,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "HS101-A-L1",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "faculty_dept": "HSS",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 1,
    "end_period": 1,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "HS101-A-L2",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "groups": [
      "Y1-A"
    ],
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "faculty_dept": "HSS",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 2,
    "end_period": 2,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "MA101-B-T1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "tutorial",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F19",
    "faculty_name": "Dr. Shalini Gupta",
    "faculty_dept": "MA",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 6,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "PH101-B-L1",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "PH101-B-L2",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 7,
    "end_period": 7,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "PH101-B-L3",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F21",
    "faculty_name": "Dr. Lakshmi Reddy",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 8,
    "end_period": 8,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "CS101-B-L1",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "CS101-B-L2",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "HS101-B-L1",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "faculty_dept": "HSS",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "HS101-B-L2",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "groups": [
      "Y1-B"
    ],
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "faculty_dept": "HSS",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 3,
    "end_period": 3,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "MA101-C-T1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "tutorial",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "faculty_dept": "MA",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "PH101-C-L1",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 2,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "PH101-C-L2",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 3,
    "end_period": 3,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "PH101-C-L3",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 4,
    "end_period": 4,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "CS101-C-L1",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "CS101-C-L2",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "HS101-C-L1",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "faculty_dept": "HSS",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 4,
    "end_period": 4,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "HS101-C-L2",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "groups": [
      "Y1-C"
    ],
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "faculty_dept": "HSS",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "THU",
    "start_period": 1,
    "end_period": 1,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "MA101-D-T1",
    "course_id": "MA101",
    "course_title": "Calculus and Linear Algebra",
    "kind": "tutorial",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F20",
    "faculty_name": "Dr. Prakash Nayak",
    "faculty_dept": "MA",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "PH101-D-L1",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "PH101-D-L2",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "PH101-D-L3",
    "course_id": "PH101",
    "course_title": "Engineering Physics",
    "kind": "lecture",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F22",
    "faculty_name": "Dr. Harish Dash",
    "faculty_dept": "PH",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 4,
    "end_period": 4,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "CS101-D-L1",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "CS101-D-L2",
    "course_id": "CS101",
    "course_title": "Programming in C",
    "kind": "lecture",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "faculty_dept": "CSE",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.45
  },
  {
    "id": "HS101-D-L1",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "faculty_dept": "HSS",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "HS101-D-L2",
    "course_id": "HS101",
    "course_title": "Communicative English",
    "kind": "lecture",
    "groups": [
      "Y1-D"
    ],
    "faculty_id": "F36",
    "faculty_name": "Dr. Ashok Mahapatra",
    "faculty_dept": "HSS",
    "size": 90,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "THU",
    "start_period": 2,
    "end_period": 2,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.18
  },
  {
    "id": "ID101-ALL-L1",
    "course_id": "ID101",
    "course_title": "Introduction to Engineering",
    "kind": "lecture",
    "groups": [
      "Y1-A",
      "Y1-B",
      "Y1-C",
      "Y1-D"
    ],
    "faculty_id": "F37",
    "faculty_name": "Prof. Shreya Kapoor (Dean)",
    "faculty_dept": "ADMIN",
    "size": 360,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 5,
    "end_period": 5,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.72
  },
  {
    "id": "CS201-L1",
    "course_id": "CS201",
    "course_title": "Data Structures",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.89
  },
  {
    "id": "CS201-L2",
    "course_id": "CS201",
    "course_title": "Data Structures",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS201-L3",
    "course_id": "CS201",
    "course_title": "Data Structures",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F02",
    "faculty_name": "Dr. Rohit Sahoo",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS202-L1",
    "course_id": "CS202",
    "course_title": "Discrete Mathematics",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS202-L2",
    "course_id": "CS202",
    "course_title": "Discrete Mathematics",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 8,
    "end_period": 8,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS202-L3",
    "course_id": "CS202",
    "course_title": "Discrete Mathematics",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS202-T1",
    "course_id": "CS202",
    "course_title": "Discrete Mathematics",
    "kind": "tutorial",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS203-L1",
    "course_id": "CS203",
    "course_title": "Digital Logic Design",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F07",
    "faculty_name": "Dr. Pooja Das",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS203-L2",
    "course_id": "CS203",
    "course_title": "Digital Logic Design",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F07",
    "faculty_name": "Dr. Pooja Das",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS203-L3",
    "course_id": "CS203",
    "course_title": "Digital Logic Design",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F07",
    "faculty_name": "Dr. Pooja Das",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS204-L1",
    "course_id": "CS204",
    "course_title": "Object-Oriented Programming",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F08",
    "faculty_name": "Prof. Vikram Rao (Visiting)",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.67
  },
  {
    "id": "CS204-L2",
    "course_id": "CS204",
    "course_title": "Object-Oriented Programming",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F08",
    "faculty_name": "Prof. Vikram Rao (Visiting)",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "CS204-L3",
    "course_id": "CS204",
    "course_title": "Object-Oriented Programming",
    "kind": "lecture",
    "groups": [
      "CSE-2"
    ],
    "faculty_id": "F08",
    "faculty_name": "Prof. Vikram Rao (Visiting)",
    "faculty_dept": "CSE",
    "size": 80,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.4
  },
  {
    "id": "EC201-L1",
    "course_id": "EC201",
    "course_title": "Signals and Systems",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-102",
    "room_name": "Classroom A-102",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.78
  },
  {
    "id": "EC201-L2",
    "course_id": "EC201",
    "course_title": "Signals and Systems",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.58
  },
  {
    "id": "EC201-L3",
    "course_id": "EC201",
    "course_title": "Signals and Systems",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.35
  },
  {
    "id": "EC201-T1",
    "course_id": "EC201",
    "course_title": "Signals and Systems",
    "kind": "tutorial",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.35
  },
  {
    "id": "EC202-L1",
    "course_id": "EC202",
    "course_title": "Network Theory",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 8,
    "end_period": 8,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.35
  },
  {
    "id": "EC202-L2",
    "course_id": "EC202",
    "course_title": "Network Theory",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.58
  },
  {
    "id": "EC202-L3",
    "course_id": "EC202",
    "course_title": "Network Theory",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.58
  },
  {
    "id": "EC203-L1",
    "course_id": "EC203",
    "course_title": "Electronic Devices",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F11",
    "faculty_name": "Dr. Neha Kulkarni",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.58
  },
  {
    "id": "EC203-L2",
    "course_id": "EC203",
    "course_title": "Electronic Devices",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F11",
    "faculty_name": "Dr. Neha Kulkarni",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.35
  },
  {
    "id": "EC203-L3",
    "course_id": "EC203",
    "course_title": "Electronic Devices",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F11",
    "faculty_name": "Dr. Neha Kulkarni",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.35
  },
  {
    "id": "EC204-L1",
    "course_id": "EC204",
    "course_title": "Probability and Random Processes",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 8,
    "end_period": 8,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.35
  },
  {
    "id": "EC204-L2",
    "course_id": "EC204",
    "course_title": "Probability and Random Processes",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.58
  },
  {
    "id": "EC204-L3",
    "course_id": "EC204",
    "course_title": "Probability and Random Processes",
    "kind": "lecture",
    "groups": [
      "ECE-2"
    ],
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "faculty_dept": "ECE",
    "size": 70,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.58
  },
  {
    "id": "EE201-L1",
    "course_id": "EE201",
    "course_title": "Circuit Analysis",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-103",
    "room_name": "Classroom A-103",
    "room_capacity": 80,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "EE201-L2",
    "course_id": "EE201",
    "course_title": "Circuit Analysis",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "EE201-L3",
    "course_id": "EE201",
    "course_title": "Circuit Analysis",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "EE201-T1",
    "course_id": "EE201",
    "course_title": "Circuit Analysis",
    "kind": "tutorial",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.3
  },
  {
    "id": "EE202-L1",
    "course_id": "EE202",
    "course_title": "Electrical Machines I",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "EE202-L2",
    "course_id": "EE202",
    "course_title": "Electrical Machines I",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "EE202-L3",
    "course_id": "EE202",
    "course_title": "Electrical Machines I",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "EE203-L1",
    "course_id": "EE203",
    "course_title": "Electrical Measurements",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F16",
    "faculty_name": "Dr. Rakesh Panda",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "EE203-L2",
    "course_id": "EE203",
    "course_title": "Electrical Measurements",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F16",
    "faculty_name": "Dr. Rakesh Panda",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "EE203-L3",
    "course_id": "EE203",
    "course_title": "Electrical Measurements",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F16",
    "faculty_name": "Dr. Rakesh Panda",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "EE204-L1",
    "course_id": "EE204",
    "course_title": "Electromagnetic Fields",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 8,
    "end_period": 8,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.3
  },
  {
    "id": "EE204-L2",
    "course_id": "EE204",
    "course_title": "Electromagnetic Fields",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "EE204-L3",
    "course_id": "EE204",
    "course_title": "Electromagnetic Fields",
    "kind": "lecture",
    "groups": [
      "EE-2"
    ],
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "faculty_dept": "EE",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "ME201-L1",
    "course_id": "ME201",
    "course_title": "Engineering Thermodynamics",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-104",
    "room_name": "Classroom A-104",
    "room_capacity": 80,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "ME201-L2",
    "course_id": "ME201",
    "course_title": "Engineering Thermodynamics",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "ME201-L3",
    "course_id": "ME201",
    "course_title": "Engineering Thermodynamics",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "ME202-L1",
    "course_id": "ME202",
    "course_title": "Mechanics of Solids",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.3
  },
  {
    "id": "ME202-L2",
    "course_id": "ME202",
    "course_title": "Mechanics of Solids",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "ME202-L3",
    "course_id": "ME202",
    "course_title": "Mechanics of Solids",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "ME202-T1",
    "course_id": "ME202",
    "course_title": "Mechanics of Solids",
    "kind": "tutorial",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "ME203-L1",
    "course_id": "ME203",
    "course_title": "Kinematics of Machines",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 8,
    "end_period": 8,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "ME203-L2",
    "course_id": "ME203",
    "course_title": "Kinematics of Machines",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "ME203-L3",
    "course_id": "ME203",
    "course_title": "Kinematics of Machines",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "ME204-L1",
    "course_id": "ME204",
    "course_title": "Manufacturing Processes",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F28",
    "faculty_name": "Dr. Nikhil Swain",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.3
  },
  {
    "id": "ME204-L2",
    "course_id": "ME204",
    "course_title": "Manufacturing Processes",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F28",
    "faculty_name": "Dr. Nikhil Swain",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.3
  },
  {
    "id": "ME204-L3",
    "course_id": "ME204",
    "course_title": "Manufacturing Processes",
    "kind": "lecture",
    "groups": [
      "ME-2"
    ],
    "faculty_id": "F28",
    "faculty_name": "Dr. Nikhil Swain",
    "faculty_dept": "ME",
    "size": 60,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-2",
    "room_name": "Lecture Hall 2",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.3
  },
  {
    "id": "CE201-L1",
    "course_id": "CE201",
    "course_title": "Surveying",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-105",
    "room_name": "Classroom A-105",
    "room_capacity": 70,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.71
  },
  {
    "id": "CE201-L2",
    "course_id": "CE201",
    "course_title": "Surveying",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE201-L3",
    "course_id": "CE201",
    "course_title": "Surveying",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE202-L1",
    "course_id": "CE202",
    "course_title": "Fluid Mechanics",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE202-L2",
    "course_id": "CE202",
    "course_title": "Fluid Mechanics",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE202-L3",
    "course_id": "CE202",
    "course_title": "Fluid Mechanics",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE202-T1",
    "course_id": "CE202",
    "course_title": "Fluid Mechanics",
    "kind": "tutorial",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE203-L1",
    "course_id": "CE203",
    "course_title": "Strength of Materials",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.56
  },
  {
    "id": "CE203-L2",
    "course_id": "CE203",
    "course_title": "Strength of Materials",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE203-L3",
    "course_id": "CE203",
    "course_title": "Strength of Materials",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE204-L1",
    "course_id": "CE204",
    "course_title": "Engineering Geology",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F34",
    "faculty_name": "Dr. Varun Acharya",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 8,
    "end_period": 8,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE204-L2",
    "course_id": "CE204",
    "course_title": "Engineering Geology",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F34",
    "faculty_name": "Dr. Varun Acharya",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 9,
    "end_period": 9,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "CE204-L3",
    "course_id": "CE204",
    "course_title": "Engineering Geology",
    "kind": "lecture",
    "groups": [
      "CE-2"
    ],
    "faculty_id": "F34",
    "faculty_name": "Dr. Varun Acharya",
    "faculty_dept": "CE",
    "size": 50,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.42
  },
  {
    "id": "HS201-H1-L1",
    "course_id": "HS201",
    "course_title": "Principles of Economics",
    "kind": "lecture",
    "groups": [
      "CSE-2",
      "ECE-2"
    ],
    "faculty_id": "F38",
    "faculty_name": "Dr. Imran Qureshi",
    "faculty_dept": "HSS",
    "size": 150,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 5,
    "end_period": 5,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.75
  },
  {
    "id": "HS201-H2-L1",
    "course_id": "HS201",
    "course_title": "Principles of Economics",
    "kind": "lecture",
    "groups": [
      "EE-2",
      "ME-2",
      "CE-2"
    ],
    "faculty_id": "F38",
    "faculty_name": "Dr. Imran Qureshi",
    "faculty_dept": "HSS",
    "size": 170,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 9,
    "end_period": 9,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.34
  },
  {
    "id": "HS201-H1-L2",
    "course_id": "HS201",
    "course_title": "Principles of Economics",
    "kind": "lecture",
    "groups": [
      "CSE-2",
      "ECE-2"
    ],
    "faculty_id": "F38",
    "faculty_name": "Dr. Imran Qureshi",
    "faculty_dept": "HSS",
    "size": 150,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 6,
    "end_period": 6,
    "room_id": "AUD",
    "room_name": "Main Auditorium",
    "room_capacity": 500,
    "room_type": "auditorium",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.3
  },
  {
    "id": "HS201-H2-L2",
    "course_id": "HS201",
    "course_title": "Principles of Economics",
    "kind": "lecture",
    "groups": [
      "EE-2",
      "ME-2",
      "CE-2"
    ],
    "faculty_id": "F38",
    "faculty_name": "Dr. Imran Qureshi",
    "faculty_dept": "HSS",
    "size": 170,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "THU",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-1",
    "room_name": "Lecture Hall 1",
    "room_capacity": 200,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.85
  },
  {
    "id": "CS301-L1",
    "course_id": "CS301",
    "course_title": "Operating Systems",
    "kind": "lecture",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-3",
    "room_name": "Lecture Hall 3",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.63
  },
  {
    "id": "CS301-L2",
    "course_id": "CS301",
    "course_title": "Operating Systems",
    "kind": "lecture",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.83
  },
  {
    "id": "CS301-L3",
    "course_id": "CS301",
    "course_title": "Operating Systems",
    "kind": "lecture",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F01",
    "faculty_name": "Dr. Ananya Mishra",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.63
  },
  {
    "id": "CS302-L1",
    "course_id": "CS302",
    "course_title": "Database Systems",
    "kind": "lecture",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.63
  },
  {
    "id": "CS302-L2",
    "course_id": "CS302",
    "course_title": "Database Systems",
    "kind": "lecture",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.83
  },
  {
    "id": "CS302-L3",
    "course_id": "CS302",
    "course_title": "Database Systems",
    "kind": "lecture",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F05",
    "faculty_name": "Dr. Meera Nair",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "WED",
    "start_period": 1,
    "end_period": 1,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.63
  },
  {
    "id": "CS303-L1",
    "course_id": "CS303",
    "course_title": "Computer Networks",
    "kind": "lecture",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.63
  },
  {
    "id": "CS303-L2",
    "course_id": "CS303",
    "course_title": "Computer Networks",
    "kind": "lecture",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.63
  },
  {
    "id": "CS303-L3",
    "course_id": "CS303",
    "course_title": "Computer Networks",
    "kind": "lecture",
    "groups": [
      "CSE-3"
    ],
    "faculty_id": "F06",
    "faculty_name": "Dr. Arjun Mehta",
    "faculty_dept": "CSE",
    "size": 75,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.63
  },
  {
    "id": "EC301-L1",
    "course_id": "EC301",
    "course_title": "Communication Systems",
    "kind": "lecture",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-102",
    "room_name": "Classroom A-102",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.72
  },
  {
    "id": "EC301-L2",
    "course_id": "EC301",
    "course_title": "Communication Systems",
    "kind": "lecture",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.54
  },
  {
    "id": "EC301-L3",
    "course_id": "EC301",
    "course_title": "Communication Systems",
    "kind": "lecture",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F09",
    "faculty_name": "Dr. Ishita Banerjee",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.54
  },
  {
    "id": "EC302-L1",
    "course_id": "EC302",
    "course_title": "Digital Signal Processing",
    "kind": "lecture",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.54
  },
  {
    "id": "EC302-L2",
    "course_id": "EC302",
    "course_title": "Digital Signal Processing",
    "kind": "lecture",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "CR-102",
    "room_name": "Classroom A-102",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.72
  },
  {
    "id": "EC302-L3",
    "course_id": "EC302",
    "course_title": "Digital Signal Processing",
    "kind": "lecture",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F10",
    "faculty_name": "Dr. Suresh Pradhan",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.54
  },
  {
    "id": "EC303-L1",
    "course_id": "EC303",
    "course_title": "VLSI Design",
    "kind": "lecture",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 9,
    "end_period": 9,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.72
  },
  {
    "id": "EC303-L2",
    "course_id": "EC303",
    "course_title": "VLSI Design",
    "kind": "lecture",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "CR-102",
    "room_name": "Classroom A-102",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.72
  },
  {
    "id": "EC303-L3",
    "course_id": "EC303",
    "course_title": "VLSI Design",
    "kind": "lecture",
    "groups": [
      "ECE-3"
    ],
    "faculty_id": "F12",
    "faculty_name": "Dr. Amit Behera",
    "faculty_dept": "ECE",
    "size": 65,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.54
  },
  {
    "id": "EE301-L1",
    "course_id": "EE301",
    "course_title": "Power Systems",
    "kind": "lecture",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-103",
    "room_name": "Classroom A-103",
    "room_capacity": 80,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.69
  },
  {
    "id": "EE301-L2",
    "course_id": "EE301",
    "course_title": "Power Systems",
    "kind": "lecture",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 2,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "EE301-L3",
    "course_id": "EE301",
    "course_title": "Power Systems",
    "kind": "lecture",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F14",
    "faculty_name": "Dr. Kunal Joshi",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 3,
    "end_period": 3,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "EE302-L1",
    "course_id": "EE302",
    "course_title": "Control Systems",
    "kind": "lecture",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "EE302-L2",
    "course_id": "EE302",
    "course_title": "Control Systems",
    "kind": "lecture",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "EE302-L3",
    "course_id": "EE302",
    "course_title": "Control Systems",
    "kind": "lecture",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F15",
    "faculty_name": "Dr. Sneha Mohanty",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "EE303-L1",
    "course_id": "EE303",
    "course_title": "Power Electronics",
    "kind": "lecture",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "CR-103",
    "room_name": "Classroom A-103",
    "room_capacity": 80,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.69
  },
  {
    "id": "EE303-L2",
    "course_id": "EE303",
    "course_title": "Power Electronics",
    "kind": "lecture",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "EE303-L3",
    "course_id": "EE303",
    "course_title": "Power Electronics",
    "kind": "lecture",
    "groups": [
      "EE-3"
    ],
    "faculty_id": "F17",
    "faculty_name": "Dr. Divya Menon",
    "faculty_dept": "EE",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 8,
    "end_period": 8,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "ME301-L1",
    "course_id": "ME301",
    "course_title": "Heat Transfer",
    "kind": "lecture",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 4,
    "end_period": 4,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "ME301-L2",
    "course_id": "ME301",
    "course_title": "Heat Transfer",
    "kind": "lecture",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-104",
    "room_name": "Classroom A-104",
    "room_capacity": 80,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.69
  },
  {
    "id": "ME301-L3",
    "course_id": "ME301",
    "course_title": "Heat Transfer",
    "kind": "lecture",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F25",
    "faculty_name": "Dr. Tanvi Desai",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 2,
    "end_period": 2,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.61
  },
  {
    "id": "ME302-L1",
    "course_id": "ME302",
    "course_title": "Machine Design",
    "kind": "lecture",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 3,
    "end_period": 3,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.61
  },
  {
    "id": "ME302-L2",
    "course_id": "ME302",
    "course_title": "Machine Design",
    "kind": "lecture",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 4,
    "end_period": 4,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.61
  },
  {
    "id": "ME302-L3",
    "course_id": "ME302",
    "course_title": "Machine Design",
    "kind": "lecture",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F26",
    "faculty_name": "Dr. Abhishek Rout",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": true,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "CR-103",
    "room_name": "Classroom A-103",
    "room_capacity": 80,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.69
  },
  {
    "id": "ME303-L1",
    "course_id": "ME303",
    "course_title": "Fluid Machines",
    "kind": "lecture",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "CR-104",
    "room_name": "Classroom A-104",
    "room_capacity": 80,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.69
  },
  {
    "id": "ME303-L2",
    "course_id": "ME303",
    "course_title": "Fluid Machines",
    "kind": "lecture",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "ME303-L3",
    "course_id": "ME303",
    "course_title": "Fluid Machines",
    "kind": "lecture",
    "groups": [
      "ME-3"
    ],
    "faculty_id": "F27",
    "faculty_name": "Dr. Sunita Bose",
    "faculty_dept": "ME",
    "size": 55,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 6,
    "end_period": 6,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.46
  },
  {
    "id": "CE301-L1",
    "course_id": "CE301",
    "course_title": "Structural Analysis",
    "kind": "lecture",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 4,
    "end_period": 4,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "CE301-L2",
    "course_id": "CE301",
    "course_title": "Structural Analysis",
    "kind": "lecture",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 1,
    "end_period": 1,
    "room_id": "CR-105",
    "room_name": "Classroom A-105",
    "room_capacity": 70,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.64
  },
  {
    "id": "CE301-L3",
    "course_id": "CE301",
    "course_title": "Structural Analysis",
    "kind": "lecture",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F31",
    "faculty_name": "Dr. Anjali Verma",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 5,
    "end_period": 5,
    "room_id": "CR-104",
    "room_name": "Classroom A-104",
    "room_capacity": 80,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.56
  },
  {
    "id": "CE302-L1",
    "course_id": "CE302",
    "course_title": "Geotechnical Engineering",
    "kind": "lecture",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 5,
    "end_period": 5,
    "room_id": "CR-105",
    "room_name": "Classroom A-105",
    "room_capacity": 70,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.64
  },
  {
    "id": "CE302-L2",
    "course_id": "CE302",
    "course_title": "Geotechnical Engineering",
    "kind": "lecture",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 6,
    "end_period": 6,
    "room_id": "CR-101",
    "room_name": "Classroom A-101",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "CE302-L3",
    "course_id": "CE302",
    "course_title": "Geotechnical Engineering",
    "kind": "lecture",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F32",
    "faculty_name": "Dr. Sameer Khuntia",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 7,
    "end_period": 7,
    "room_id": "LH-6",
    "room_name": "Lecture Hall 6",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.38
  },
  {
    "id": "CE303-L1",
    "course_id": "CE303",
    "course_title": "Transportation Engineering",
    "kind": "lecture",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 8,
    "end_period": 8,
    "room_id": "LH-5",
    "room_name": "Lecture Hall 5",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.38
  },
  {
    "id": "CE303-L2",
    "course_id": "CE303",
    "course_title": "Transportation Engineering",
    "kind": "lecture",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "MON",
    "start_period": 9,
    "end_period": 9,
    "room_id": "CR-102",
    "room_name": "Classroom A-102",
    "room_capacity": 90,
    "room_type": "classroom",
    "room_accessible": true,
    "is_underutilized": false,
    "capacity_ratio": 0.5
  },
  {
    "id": "CE303-L3",
    "course_id": "CE303",
    "course_title": "Transportation Engineering",
    "kind": "lecture",
    "groups": [
      "CE-3"
    ],
    "faculty_id": "F33",
    "faculty_name": "Dr. Rekha Pillai",
    "faculty_dept": "CE",
    "size": 45,
    "duration": 1,
    "room_types": [
      "classroom",
      "lecture_hall",
      "auditorium"
    ],
    "needs_accessible": false,
    "basket_slot": null,
    "fixed_slot": null,
    "day": "TUE",
    "start_period": 8,
    "end_period": 8,
    "room_id": "LH-4",
    "room_name": "Lecture Hall 4",
    "room_capacity": 120,
    "room_type": "lecture_hall",
    "room_accessible": true,
    "is_underutilized": true,
    "capacity_ratio": 0.38
  }
];
