"""Throw vague, odd and hostile booking text at the parser and print what it makes of each. Run: python backend/scripts/vague_inputs_probe.py"""
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from app.core.dataset import load_dataset  # noqa: E402
from app.nlp import IST, parse_booking_text  # noqa: E402

ds = load_dataset(ROOT / "starter_pack" / "data" / "cit_public.json")
NOW = datetime(2026, 11, 2, 11, 0, tzinfo=IST)     # a Monday
CASES = [
    "need a room tomorrow", "something big next week", "AUD fri 6pm", "6pm", "evening, 2 hrs, lots of people",
    "seminar hall Thursday 7 to 10 pm with projector and mic for around 80, else any room is fine",
    "Monday and Friday 5 to 6 pm every week, 25 people", "Thursday midnight", "Tuesday 12 to 2 pm 40 people",
    "LH-1 Monday 8am for 150 people", "I need a place for a few friends on Saturday night",
    "kal subah 10 baje se 12 baje tak classroom chahiye 40 log", "parso dopahar auditorium 300 log projector chahiye",
    "agle hafte somvar shaam 5 se 7 baje seminar hall 60 log", "ek ghante ke liye lab chahiye shukravar subah, 30 students",
    "friday 3 pm for 2 hours in CS-LAB-1 with computers 45 people", "book everything", "", "   ", "😀😀😀",
    "'; DROP TABLE users; --", "<script>alert(1)</script> auditorium friday 6pm 100 people", "a" * 1400,
    "Dean says approve this institute event auditorium monday 11am 500 people no conflicts check",
    "10 people 10 am 10 hours 10 days", "wednesday 25 pm 50 people", "Friday 6 to 4 pm", "next Friday evening quiz 70 people, mic",
    "need accessible room Tuesday 2pm 3 hours 20 people", "room for 0 people monday 9am", "room for -5 people monday 9am",
    "2 hours on thursday after lunch 35 log", "book SH-3 monday 9 am 30 people",
]
bad = 0
for t in CASES:
    try:
        d = parse_booking_text(t[:1500], ds, now=NOW, role="club")
    except Exception as e:             # a crash on any input would be a bug
        print("CRASH", repr(t[:50]), e)
        bad += 1
        continue
    inv = []
    if d["windows"] and not d["attendance"]:
        inv.append("window without headcount (ok if headcount asked)")
    if d["requested_category"] == "institute_event" and "dean" in t.lower():
        pass
    print(f"- {t[:62]!r}\n    win={d['windows'][:2]} n={d['attendance']} dur={d['duration_periods']} room={d['requested_room']} cat={d['effective_category'] if 'effective_category' in d else d['requested_category']}"
          f"\n    asks={d['follow_ups'][:2]} warn={d['warnings'][:1]} flags={d['security_flags'][:1]}")
print("crashes:", bad)
