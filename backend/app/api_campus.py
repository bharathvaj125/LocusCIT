"""Shared, read-only campus picture for every role, plus the Admin-only priority order.

Everything here is non-sensitive: counts, room availability and approved events. Pending requests, reasons and
requester details never appear.
"""
from fastapi import APIRouter, Body, Depends, Query

from . import db
from .api import fail, ok
from .api_admin import _cache
from .auth import current_user, require
from .state import SEED, WS

router = APIRouter(prefix="/api")


def _approved_events():
    from .api_bookings import _decider  # noqa: F401  (kept lazy: api_bookings imports api)
    d = WS.dataset
    reqs = {r["id"]: r for r in d["booking_requests"]}
    out = []
    for x in (WS.bookings or {}).get("decisions", []):
        r = reqs.get(x["request_id"])
        if x["status"] == "approved" and r and x.get("room_id"):
            out.append({"id": x["request_id"], "title": r["title"], "requester": r["requester"],
                        "category": x["effective_category"], "room_id": x["room_id"], "day": x["day"],
                        "start": x["start_period"], "end": x["end_period"], "source": "spectra"})
    for s in WS.submissions.values():
        if s["status"] == "APPROVED" and s.get("placement"):
            p = s["placement"]
            out.append({"id": s["id"], "title": s["title"], "requester": s["requester"],
                        "category": s["proposed"].get("effective_category", ""), "room_id": p["room_id"], "day": p["day"],
                        "start": p["start_period"], "end": p["end_period"], "source": "app"})
    days = d["calendar"]["days"]
    out.sort(key=lambda e: (days.index(e["day"]) if e["day"] in days else 99, e["start"], e["room_id"]))
    return out


@router.get("/campus/overview")
def campus_overview(user=Depends(current_user)):
    d = WS.dataset
    events = _approved_events()
    per_day = {day: sum(1 for e in events if e["day"] == day) for day in d["calendar"]["days"]}
    event_rooms = [r for r in d["rooms"] if "event" in r["allowed_uses"]]
    return ok({
        "dataset_id": d["dataset_id"], "revision": WS.revision,
        "timetable_ready": WS.schedule is not None,
        "stats": {"sessions_scheduled": len(WS.schedule or {}), "sessions_total": len(d["sessions"]),
                  "rooms": len(d["rooms"]), "event_rooms": len(event_rooms),
                  "exams_scheduled": len(WS.exams or []), "exams_total": len(d["exams"]),
                  "approved_events": len(events), "student_groups": len(d["student_groups"]),
                  "faculty": len(d["faculty"])},
        "events_per_day": per_day, "approved_events": events,
        "priority_order": d["priority_order"], "days": d["calendar"]["days"],
    })


@router.get("/campus/availability")
def campus_availability(day: str = Query(...), start: int = Query(ge=1, le=13), end: int = Query(ge=1, le=13),
                        min_capacity: int = Query(default=0, ge=0, le=5000), events_only: bool = True,
                        user=Depends(current_user)):
    """Which rooms are free on `day` from period `start` to `end`, and what holds the others."""
    from .api_bookings import _decider
    d = WS.dataset
    if day not in d["calendar"]["days"]:
        return fail(422, "INVALID_INPUT", f"{day} is not a day in this calendar ({', '.join(d['calendar']['days'])})")
    if end < start:
        return fail(422, "INVALID_INPUT", f"The end period P{end} is before the start period P{start}")
    if WS.schedule is None:
        return fail(409, "INVALID_INPUT", "The timetable has not been generated yet, so availability is unknown")
    closed = {(u["room_id"], u["day"], p): u.get("reason", "") for u in d.get("room_unavailability", []) for p in u["periods"]}
    with WS.lock:
        D = _decider()
        rooms = []
        for r in d["rooms"]:
            if events_only and "event" not in r["allowed_uses"]:
                continue
            if r["capacity"] < min_capacity:
                continue
            holders = []
            for kind, who in D.week.blockers({"mandatory_for_groups": []}, r["id"], day, start, end):
                if kind == "maintenance":
                    why = next((closed[(r["id"], day, p)] for p in range(start, end + 1) if (r["id"], day, p) in closed), "")
                    holders.append(f"closed{': ' + why if why else ''}")
                else:
                    holders.append(D.label(who))
            rooms.append({"id": r["id"], "name": r["name"], "type": r["type"], "capacity": r["capacity"],
                          "features": r["features"], "accessible": r["accessible"],
                          "free": not holders, "held_by": list(dict.fromkeys(holders))})
    rooms.sort(key=lambda x: (not x["free"], x["capacity"], x["id"]))
    return ok({"day": day, "start": start, "end": end, "free": sum(1 for r in rooms if r["free"]), "rooms": rooms})


# ---------------------------------------------------------------- priority order (Admin only)
def _official_order():
    from .core.dataset import load_dataset
    return load_dataset(SEED)["priority_order"]


@router.get("/admin/priority-order", dependencies=[Depends(require("admin"))])
def get_priority_order():
    order = WS.dataset["priority_order"]
    official = _official_order()
    return ok({"order": order, "official_order": official, "changed": order != official,
               "fixed_top": ["exam", "regular_session"],
               "note": "Exams and regular classes always rank first. The categories below them can be reordered; the "
                       "official validator used for judging reads the order from the dataset, so restore the official "
                       "order before exporting schedule.json."})


@router.put("/admin/priority-order")
def set_priority_order(body: dict = Body(...), user=Depends(require("admin"))):
    current = WS.dataset["priority_order"]
    if body.get("reset"):
        order = _official_order()
    else:
        order = body.get("order")
        if not isinstance(order, list) or sorted(order) != sorted(current):
            return fail(422, "INVALID_INPUT", "The order must list exactly the existing categories, each once: "
                                              + ", ".join(current))
        if order[:2] != ["exam", "regular_session"]:
            return fail(422, "INVALID_INPUT", "Exams and regular classes always rank first and cannot be reordered")
    with WS.lock:
        if order != current:
            WS.dataset["priority_order"] = list(order)
            from .api_bookings import reconcile_after_timetable_change
            reconcile_after_timetable_change()        # Spectra decisions and app bookings are checked against the new order
            WS.revision += 1
            _cache.clear()
        changed = order != _official_order()
    db.log(user["username"], "priority_order", " > ".join(order))
    return ok({"order": order, "official_order": _official_order(), "changed": changed, "revision": WS.revision})
