/** Department colour language. Full class names so Tailwind can see them. */
export type Tone = "lagoon" | "indigo" | "saffron" | "sunrise" | "mangrove" | "stone" | "plum";

export const TONES: Record<Tone, { soft: string; bar: string; text: string; dot: string; ring: string; hex: string }> = {
  lagoon: { soft: "bg-lagoon-50", bar: "bg-lagoon-500", text: "text-lagoon-700", dot: "bg-lagoon-500", ring: "ring-lagoon-500/40", hex: "#1F8A96" },
  indigo: { soft: "bg-indigo-50", bar: "bg-indigo-500", text: "text-indigo-600", dot: "bg-indigo-500", ring: "ring-indigo-500/40", hex: "#3F5BA9" },
  saffron: { soft: "bg-saffron-50", bar: "bg-saffron-500", text: "text-saffron-600", dot: "bg-saffron-500", ring: "ring-saffron-500/40", hex: "#E9A93A" },
  sunrise: { soft: "bg-sunrise-50", bar: "bg-sunrise-500", text: "text-sunrise-600", dot: "bg-sunrise-500", ring: "ring-sunrise-500/40", hex: "#E4572E" },
  mangrove: { soft: "bg-mangrove-50", bar: "bg-mangrove-500", text: "text-mangrove-600", dot: "bg-mangrove-500", ring: "ring-mangrove-500/40", hex: "#2E7D5B" },
  stone: { soft: "bg-stone-50", bar: "bg-stone-500", text: "text-stone-600", dot: "bg-stone-500", ring: "ring-stone-500/40", hex: "#8A7F68" },
  plum: { soft: "bg-plum-50", bar: "bg-plum-500", text: "text-plum-600", dot: "bg-plum-500", ring: "ring-plum-500/40", hex: "#6B4C9A" },
};

export function deptTone(dept: string | undefined | null): Tone {
  switch ((dept || "").toUpperCase()) {
    case "CSE": return "lagoon";
    case "ECE": return "indigo";
    case "EE": return "saffron";
    case "ME": return "sunrise";
    case "CE": return "mangrove";
    default: return "stone";
  }
}

export const CATEGORY_TONE: Record<string, Tone> = {
  institute_event: "sunrise",
  guest_lecture: "indigo",
  department_event: "lagoon",
  club_event: "plum",
};

export const CATEGORY_LABEL: Record<string, string> = {
  institute_event: "Institute event",
  guest_lecture: "Guest lecture",
  department_event: "Department event",
  club_event: "Club event",
};

export const DAY_LABEL: Record<string, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
};
