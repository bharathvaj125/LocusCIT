import { DayOfWeek, Window } from "./types";
import { periodRange } from "./uiConfig";

const LEAD = /^(Rejected|Approved|Alternative offered|Fits the rules and can be approved|Only an alternative fits)\.\s+/;

/** The reason without its leading status word, for screens that already show the status as a chip. */
export function cleanReason(text: string | null | undefined): string {
  return (text || "").replace(LEAD, "");
}

/** "WED 22:00-24:00 (P13-P14)"-style text for the windows a person asked for. */
export function askedText(windows: Window[] | undefined): string {
  if (!windows || windows.length === 0) return "no time given";
  return windows.map((w) => `${w.day} ${periodRange(w.from_period, w.to_period)} (P${w.from_period}-P${w.to_period})`).join(" or ");
}

export function placedText(p: { day: DayOfWeek | string; start_period: number; end_period: number; room_id: string } | null | undefined): string {
  return p ? `${p.day} ${periodRange(p.start_period, p.end_period)} (P${p.start_period}-P${p.end_period}) in ${p.room_id}` : "no slot";
}
