"""Dataset loading and strict structural validation."""
import json
from pathlib import Path

REQUIRED_KEYS = [
    "dataset_id", "calendar", "priority_order", "role_category_cap", "rooms",
    "room_unavailability", "faculty", "student_groups", "sessions",
    "booking_requests", "cancellations", "exams",
]


class DatasetError(ValueError):
    pass


def load_dataset(path):
    with open(Path(path), encoding="utf-8") as f:
        return validate_dataset(json.load(f))


def _dupes(items, label):
    seen, bad = set(), []
    for i in items:
        if i in seen:
            bad.append(i)
        seen.add(i)
    if bad:
        raise DatasetError(f"Duplicate {label} ids: {sorted(set(bad))}")


def validate_dataset(d):
    missing = [k for k in REQUIRED_KEYS if k not in d]
    if missing:
        raise DatasetError(f"Dataset is missing keys: {missing}")
    _dupes([r["id"] for r in d["rooms"]], "room")
    _dupes([f["id"] for f in d["faculty"]], "faculty")
    _dupes([g["id"] for g in d["student_groups"]], "group")
    _dupes([s["id"] for s in d["sessions"]], "session")
    _dupes([b["id"] for b in d["booking_requests"]], "booking")
    _dupes([e["id"] for e in d["exams"]], "exam")
    rooms = {r["id"] for r in d["rooms"]}
    fac = {f["id"] for f in d["faculty"]}
    groups = {g["id"] for g in d["student_groups"]}
    for s in d["sessions"]:
        if s["faculty_id"] not in fac:
            raise DatasetError(f"{s['id']}: unknown faculty {s['faculty_id']}")
        bad = [g for g in s["groups"] if g not in groups]
        if bad:
            raise DatasetError(f"{s['id']}: unknown groups {bad}")
    for u in d["room_unavailability"]:
        if u["room_id"] not in rooms:
            raise DatasetError(f"room_unavailability: unknown room {u['room_id']}")
    return d
