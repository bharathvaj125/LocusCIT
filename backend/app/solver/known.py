"""A saved best timetable for the official dataset, used only as the solver's starting point.

It is trusted for nothing: it is used only when the dataset fingerprint matches exactly, every session is present, and the
official validator reports no hard violation. Otherwise (a different or edited dataset, or a stale file) the timetable is solved from scratch.
Regenerate the file with backend/scripts/make_known_timetable.py.
"""
import hashlib
import json
from pathlib import Path

FILE = Path(__file__).with_name("known_timetable.json")


def fingerprint(data):
    return hashlib.sha256(json.dumps(data, sort_keys=True, default=str).encode()).hexdigest()


def known_solution(data):
    """sid -> (day, start, room) for this exact dataset, or None."""
    try:
        saved = json.loads(FILE.read_text(encoding="utf-8"))
        if saved.get("fingerprint") != fingerprint(data):
            return None
        out = {sid: (v[0], int(v[1]), v[2]) for sid, v in saved["sessions"].items()}
        return out if set(out) == {s["id"] for s in data["sessions"]} else None
    except (OSError, ValueError, KeyError, TypeError, IndexError):
        return None
