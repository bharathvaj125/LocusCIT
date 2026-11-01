"""Rooms, dashboard, admin reset and dataset import."""
from collections import defaultdict

from fastapi import APIRouter, Body, Depends

from . import db
from .api import fail, ok, official_validator
from .auth import current_user, require
from .core.dataset import DatasetError, validate_dataset
from .solver.candidates import build_candidates
from .solver.export import timetable_export
from .permissions import lab_owners
from .state import TEAM, WS

router = APIRouter(prefix="/api")
_cache = {}


def _fest():
    if not WS.bookings:
        return None
    keys = ("request_id", "status", "day", "start_period", "end_period", "room_id", "reason")
    return {"bookings": [{k: v for k, v in d.items() if k in keys} for d in WS.bookings["decisions"]],
            "session_overrides": WS.bookings["overrides"]}


def room_utilisation():
    d = WS.dataset
    sess = {s["id"]: s for s in d["sessions"]}
    used = defaultdict(int)
    for sid, (day, st, rid) in (WS.schedule or {}).items():
        if sid in sess:
            used[rid] += sess[sid]["duration"]
    ev = defaultdict(int)
    for x in (WS.bookings or {}).get("decisions", []):
        if x["status"] in ("approved", "alternative_offered"):
            ev[x["room_id"]] += x["end_period"] - x["start_period"] + 1
    un = defaultdict(int)
    for u in d.get("room_unavailability", []):
        un[u["room_id"]] += len([p for p in u["periods"] if p <= 9])
    n_days = len(d["calendar"]["days"])
    out = []
    for r in d["rooms"]:
        avail = max(0, 9 * n_days - un[r["id"]])
        out.append({"id": r["id"], "name": r["name"], "building": r["building"], "type": r["type"],
                    "capacity": r["capacity"], "features": r["features"], "accessible": r["accessible"],
                    "allowed_uses": r["allowed_uses"], "teaching_hours_used": used[r["id"]],
                    "teaching_hours_available": avail,
                    "utilisation_pct": round(100 * used[r["id"]] / avail, 1) if avail else 0.0,
                    "week7_event_hours": ev[r["id"]]})
    return out


@router.get("/rooms")
def rooms(user=Depends(current_user)):
    return ok({"rooms": room_utilisation(), "revision": WS.revision})


def _report():
    key = (WS.revision, WS.schedule_version)
    if key in _cache:
        return _cache[key]
    rep = None
    if WS.schedule is not None:
        sched = timetable_export(TEAM, WS.dataset["dataset_id"], WS.schedule, fest_week=_fest(), exams=WS.exams)
        rep = official_validator().run(WS.dataset, sched)
        if WS.exams is None:   # exams are optional until generated; do not report them as conflicts
            rep["hard_violations"] = [v for v in rep["hard_violations"] if v["where"] != "exams"]
            rep["hard_violation_count"] = len(rep["hard_violations"])
    _cache.clear()
    _cache[key] = rep
    return rep


@router.get("/dashboard")
def dashboard(user=Depends(current_user)):
    d = WS.dataset
    rep = _report()
    role = user["role"]
    # "needs your attention" and the notification count only include what this person can actually act on
    from .permissions import can_see, check_decision
    pending, subs, waiting_on_me = [], [], 0
    if role in ("admin", "department_coordinator"):
        subs = [s for s in WS.submissions.values()
                if s.get("status") == "PENDING_APPROVAL" and can_see(user, s) and check_decision(user, s) is None]
        if role == "admin":
            pending = [p for p in WS.proposals.values()
                       if p.get("status") == "PENDING" and p.get("requested_by") != user["username"]]
    else:   # faculty and clubs act only when an alternative or a move offer is waiting for their answer
        subs = [s for s in WS.submissions.values()
                if s.get("requester_username") == user["username"] and s.get("status") == "ALTERNATIVE_OFFERED"]
    for n in WS.negotiations.values():
        holder = WS.submissions.get(n["holder_sub"])
        if n["status"] == "awaiting_response" and holder and holder["requester_username"] == user["username"]:
            waiting_on_me += 1
    book = (rep or {}).get("bookings", {})
    util = room_utilisation()
    return ok({
        "dataset_id": d["dataset_id"], "revision": WS.revision, "schedule_version": WS.schedule_version,
        "sessions_total": len(d["sessions"]), "sessions_scheduled": len(WS.schedule or {}),
        "hard_violation_count": (rep or {}).get("hard_violation_count"),
        "hard_by_rule": (rep or {}).get("hard_by_rule", {}),
        "conflicts": (((rep or {}).get("hard_violations") or [])[:50] if role == "admin" else []),
        "soft_total": (rep or {}).get("soft_total"), "soft_penalties": (rep or {}).get("soft_penalties"),
        "exams_total": len(d["exams"]), "exams_scheduled": len(WS.exams or []),
        "exam_soft_penalty": (rep or {}).get("exam_soft_penalty"),
        "booking_requests": len(d["booking_requests"]),
        "booking_decisions": len((WS.bookings or {}).get("decisions", [])),
        "booking_score": book.get("booking_score"), "booking_score_max": book.get("booking_score_max_if_all_approved"),
        "priority_inversions": len(book.get("priority_inversions", [])),
        "pending_proposals": [{"proposal_id": p["proposal_id"], "type": p.get("type"),
                               "moved_count": p.get("moved_count")} for p in pending],
        "pending_bookings": [{"id": s["id"], "title": s.get("title"), "requester": s.get("requester")} for s in subs],
        "pending_approvals": len(pending) + len(subs) + waiting_on_me,
        "applied_disruptions": len(WS.applied),
        "utilisation": {"average_pct": round(sum(r["utilisation_pct"] for r in util) / max(1, len(util)), 1),
                        "busiest": sorted(util, key=lambda r: -r["utilisation_pct"])[:5]},
        "ready_for_export": WS.schedule is not None and WS.exams is not None and WS.bookings is not None,
    })


@router.post("/admin/reset")
def reset(user=Depends(require("admin"))):
    rev = WS.reset()
    from . import accounts
    accounts.restore_seed()            # accounts and organisations an Admin added are removed; the demo ones return as they were
    _cache.clear()
    db.log(user["username"], "admin_reset", f"revision {rev}")
    return ok({"status": "reset", "workspace_id": "demo-1", "revision": rev,
               "seed_dataset_id": WS.dataset["dataset_id"],
               "message": f"Demo data reset by {user['username']}. Demo accounts and organisations were restored; any an Admin added were removed."})


@router.post("/admin/dataset/import")
def import_dataset(dataset: dict = Body(...), user=Depends(require("admin"))):
    if any(j.get("status") == "RUNNING" for j in WS.jobs.values()):
        return fail(409, "INVALID_INPUT", "A solver job is running; wait for it to finish")
    try:
        data = validate_dataset(dataset)
        build_candidates(data)          # every session must have at least one legal placement
    except (DatasetError, KeyError, TypeError, ValueError) as e:
        return fail(422, "INVALID_INPUT", f"Dataset rejected: {e}")
    rev = WS.replace_dataset(data)
    _cache.clear()
    db.log(user["username"], "dataset_import", data["dataset_id"])
    return ok({"status": "imported", "dataset_id": data["dataset_id"], "revision": rev,
               "counts": {k: len(data[k]) for k in ("rooms", "faculty", "student_groups", "sessions",
                                                    "booking_requests", "exams")}})


@router.get("/reference")
def reference(user=Depends(current_user)):
    """Names and attributes the UI needs to label things, always taken from the active dataset."""
    d = WS.dataset
    return ok({
        "dataset_id": d["dataset_id"], "revision": WS.revision, "calendar": d["calendar"],
        "priority_order": d["priority_order"], "role_category_cap": d["role_category_cap"],
        "rooms": [{**r, "owner_departments": lab_owners(r["id"])} for r in d["rooms"]],
        "faculty": [{k: f.get(k) for k in ("id", "name", "department", "max_hours_per_day", "needs_accessible")}
                    for f in d["faculty"]],
        "student_groups": d["student_groups"],
        "courses": [{k: c.get(k) for k in ("id", "title", "department", "year")} for c in d.get("courses", [])],
        "sessions": [{k: s.get(k) for k in ("id", "course_id", "kind", "groups", "faculty_id", "size", "duration",
                                           "room_types", "needs_accessible", "basket_slot", "fixed_slot")}
                     for s in d["sessions"]],
    })


@router.get("/examples/sample-disruption", dependencies=[Depends(require("admin"))])
def sample_disruption():
    """The organisers' practice change file from the starter pack, so it can be loaded with one click."""
    import json
    from .state import SEED
    path = SEED.parents[1] / "examples" / "sample_disruption.json"
    return ok(json.loads(path.read_text(encoding="utf-8")))


@router.get("/audit", dependencies=[Depends(require("admin"))])
def audit(limit: int = 30):
    from sqlalchemy import select
    with db.engine.begin() as c:
        rows = c.execute(select(db.audit).order_by(db.audit.c.id.desc()).limit(max(1, min(limit, 100)))).mappings().all()
    return ok({"events": [{"at": r["at"], "actor": r["actor"], "action": r["action"], "detail": r["detail"]}
                          for r in rows]})
