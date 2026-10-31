"""Booking requests: parse (English/Hinglish) -> editable draft -> deterministic check -> approval."""
import copy
import time
import uuid
from datetime import datetime

from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel, Field

from . import ai, db
from .api import fail, ok, official_validator
from .auth import current_user
from .nlp import IST, parse_booking_text
from .solver.bookings import Decider
from .solver.export import timetable_export
from .state import TEAM, WS

router = APIRouter(prefix="/api")
NEEDS = {"projector", "pa_system", "stage", "computers", "power_benches", "accessible", "ac"}
LAB_TYPES = {"lab_cs", "lab_elec", "lab_phy", "lab_civil", "workshop"}


class Window(BaseModel):
    day: str
    from_period: int = Field(ge=1, le=13)
    to_period: int = Field(ge=1, le=13)


class Draft(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    attendance: int = Field(ge=1, le=5000)
    duration_periods: int = Field(ge=1, le=13)
    windows: list[Window] = Field(min_length=1, max_length=10)
    day_mode: str = "all"
    needs: list[str] = []
    room_types: list[str] = []
    requested_room: str | None = None
    mandatory_for_groups: list[str] = []
    requested_category: str = "club_event"
    raw_text: str | None = Field(default=None, max_length=1000)
    # anything else the client sends (role, requester, status, approved_by, ...) is ignored by design


class ManualEvent(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    room_id: str
    day: str
    start_period: int
    end_period: int
    attendance: int = Field(ge=1, le=5000)
    needs: list[str] = []
    mandatory_for_groups: list[str] = []
    requested_category: str = "club_event"


class ParseBody(BaseModel):
    text: str = Field(max_length=1500)


class DecisionBody(BaseModel):
    action: str
    reason: str | None = Field(default=None, max_length=500)


def _now_iso():
    return datetime.now(IST).isoformat(timespec="seconds")


def _week_base():
    base = dict(WS.schedule or {})
    for o in (WS.bookings or {}).get("overrides", []):
        base[o["session_id"]] = (o["day"], o["start_period"], o["room_id"])
    return base


def _decider(exclude=()):
    """Decider over the live Week-7 state: classes (with overrides), dataset decisions, reserved submissions.
    `exclude` leaves out the placements of those submission ids (used to test a move before it happens)."""
    D = Decider(WS.dataset, _week_base())
    reqs = {r["id"]: r for r in WS.dataset["booking_requests"]}
    for d in (WS.bookings or {}).get("decisions", []):
        if d["request_id"] in reqs:
            D.place_existing(d, reqs[d["request_id"]])
    for s in WS.submissions.values():
        if s["id"] in exclude:
            continue
        if s["status"] in ("APPROVED", "ALTERNATIVE_OFFERED") and s.get("placement"):
            D.place_existing({"status": "approved", **s["placement"]}, s["request"])
    return D


def reconcile_after_timetable_change():
    """Call with WS.lock held whenever the active timetable changed.

    Spectra decisions depend on where classes are, so they are decided again (only if they had been decided).
    Bookings made through the app that were approved are re-checked one by one against the new classes and
    marked NEEDS_REVIEW if they no longer fit, instead of silently staying approved on a clash.
    """
    from .solver.bookings import evaluate_bookings
    if WS.schedule is None:
        return
    if WS.bookings is not None:
        decisions, overrides, _ = evaluate_bookings(WS.dataset, WS.schedule)
        WS.bookings = {"decisions": decisions, "overrides": overrides}
    D = Decider(WS.dataset, _week_base())
    reqs = {r["id"]: r for r in WS.dataset["booking_requests"]}
    for d in (WS.bookings or {}).get("decisions", []):
        if d["request_id"] in reqs:
            D.place_existing(d, reqs[d["request_id"]])
    for s in sorted(WS.submissions.values(), key=lambda x: x["created_at"]):
        if s["status"] not in ("APPROVED", "ALTERNATIVE_OFFERED") or not s.get("placement"):
            continue
        p = s["placement"]
        problems = D.check_slot(s["request"], p["room_id"], p["day"], p["start_period"], p["end_period"])
        if problems:
            s["status"] = "NEEDS_REVIEW"
            s["decision_reason"] = ("The timetable changed and this slot no longer works: "
                                    + "; ".join(m for _, m in problems))
        else:
            D.place_existing({"status": "approved", **p}, s["request"])
    from .api_negotiation import void_stale
    void_stale()


def _request_dict(user, d, sid, window_list):
    req = {"id": sid, "submitted_at": _now_iso(), "requester": user["org"] or user["display_name"],
           "role": user["role"], "requested_category": d.requested_category, "title": d.title,
           "attendance": d.attendance, "duration_periods": d.duration_periods,
           "windows": [w.model_dump() for w in window_list], "room_types": d.room_types,
           "needs": [n for n in d.needs if n in NEEDS], "requested_room": d.requested_room,
           "mandatory_for_groups": d.mandatory_for_groups, "series_id": None, "raw_text": d.raw_text or ""}
    return req


def _validate_draft(d: Draft):
    ds = WS.dataset
    days = set(ds["calendar"]["days"])
    rooms = {r["id"] for r in ds["rooms"]}
    types = {r["type"] for r in ds["rooms"]}
    groups = {g["id"] for g in ds["student_groups"]}
    errs = []
    for w in d.windows:
        if w.day not in days:
            errs.append(f"{w.day} is not a bookable day ({', '.join(sorted(days))})")
        if w.to_period < w.from_period:
            errs.append(f"Window P{w.from_period}-P{w.to_period} ends before it starts")
        elif w.to_period - w.from_period + 1 < d.duration_periods:
            errs.append(f"Window P{w.from_period}-P{w.to_period} is shorter than {d.duration_periods} period(s)")
    bad = [t for t in d.room_types if t not in types]
    if bad:
        errs.append(f"Unknown room types: {bad}")
    if d.requested_room and d.requested_room not in rooms:
        errs.append(f"Unknown room {d.requested_room}")
    badg = [g for g in d.mandatory_for_groups if g not in groups]
    if badg:
        errs.append(f"Unknown student groups: {badg}")
    badn = [n for n in d.needs if n not in NEEDS]
    if badn:
        errs.append(f"Unknown needs: {badn}")
    if d.requested_category not in ds["priority_order"]:
        d.requested_category = "club_event"
    if not d.room_types:
        d.room_types = ["classroom", "lecture_hall", "seminar_hall"]
    return errs


@router.post("/bookings/parse")
def parse(body: ParseBody, user=Depends(current_user)):
    draft = parse_booking_text(body.text, WS.dataset, role=user["role"])
    extra = ai.llm_extract(body.text)
    ai.merge_into_draft(draft, extra)
    draft["ai_used"] = bool(extra)
    draft["ai_available"] = ai.enabled()
    probe = {"id": "DRAFT", "role": user["role"], "requested_category": draft["requested_category"]}
    V = official_validator()
    draft["effective_category"] = V.effective_category(WS.dataset, probe)
    draft["role_cap"] = WS.dataset["role_category_cap"].get(user["role"])
    return ok(draft)


@router.post("/bookings/suggest")
def suggest(draft: Draft, user=Depends(current_user)):
    """Dry run: which rooms and times fit this draft right now, and what the engine would say. Changes nothing."""
    if WS.schedule is None:
        return fail(409, "INVALID_INPUT", "The timetable has not been generated yet, so rooms cannot be checked")
    errs = _validate_draft(draft)
    if errs:
        return fail(422, "INVALID_INPUT", "; ".join(errs), details=errs)
    req = _request_dict(user, draft, "DRAFT", draft.windows)
    with WS.lock:
        D = _decider()
        options = D.suggestions(req, limit=10)
        dec = D.decide(req, allow_displace=False)
    inside = [o for o in options if o["kind"] == "inside_window"]
    return ok({"outcome": dec["status"], "reason": dec["reason"], "effective_category": dec["effective_category"],
               "options": options,
               "message": ("These rooms and times fit inside what you asked for." if inside else
                           "Nothing is free inside the requested windows; the closest alternatives are listed."
                           if options else dec["reason"])})


def _official_hard(sub):
    return _official_hard_many([sub])


def _official_hard_many(subs):
    """Independent re-check by the official validator for requests placed on top of the live decisions."""
    data = copy.deepcopy(WS.dataset)
    for sub in subs:
        data["booking_requests"].append(sub["request"])
    keys = ("request_id", "status", "day", "start_period", "end_period", "room_id", "reason")
    decisions = [{k: v for k, v in d.items() if k in keys} for d in (WS.bookings or {}).get("decisions", [])]
    for sub in subs:
        decisions.append({"request_id": sub["request"]["id"], "status": "approved", **sub["placement"], "reason": "check"})
    fest = {"bookings": decisions, "session_overrides": (WS.bookings or {}).get("overrides", [])}
    rep = official_validator().run(data, timetable_export(TEAM, data["dataset_id"], WS.schedule, fest_week=fest))
    ids = [sub["request"]["id"] for sub in subs]
    return [v for v in rep["hard_violations"] if any(i in v["detail"] for i in ids)]


def _public_sub(s):
    return {k: v for k, v in s.items() if not k.startswith("_")}


@router.post("/bookings/submit")
def submit(draft: Draft, user=Depends(current_user)):
    if WS.schedule is None:
        return fail(409, "INVALID_INPUT", "The timetable has not been generated yet, so rooms cannot be checked")
    errs = _validate_draft(draft)
    if errs:
        return fail(422, "INVALID_INPUT", "; ".join(errs), details=errs)
    wins = draft.windows if draft.day_mode != "all" else draft.windows
    groups = [[w] for w in draft.windows] if draft.day_mode == "all" and len(draft.windows) > 1 else [list(wins)]
    series = uuid.uuid4().hex[:6] if len(groups) > 1 else None
    out = []
    with WS.lock:
        D = _decider()
        for wl in groups:
            sid = "SUB-" + uuid.uuid4().hex[:6].upper()
            req = _request_dict(user, draft, sid, wl)
            req["series_id"] = series
            dec = D.decide(req, allow_displace=False)     # reserves the slot inside D for the rest of the series
            # the engine only proposes here; a person approves, so word the reason as a proposal
            for old, new in (("Approved. ", "Fits the rules and can be approved. "),
                             ("Alternative offered. ", "Only an alternative fits. ")):
                if dec["reason"].startswith(old):
                    dec["reason"] = new + dec["reason"][len(old):]
            sub = {"id": sid, "requester_username": user["username"], "requester": req["requester"],
                   "role": user["role"], "department": user["department"], "title": draft.title,
                   "request": req, "proposed": dec, "created_at": time.time(), "manual": False,
                   "status": "PENDING_APPROVAL", "placement": None, "decided_by": None, "decision_reason": dec["reason"]}
            if dec["status"] == "rejected":
                sub["status"] = "REJECTED"
            else:
                sub["placement"] = {k: dec[k] for k in ("day", "start_period", "end_period", "room_id")}
            WS.submissions[sid] = sub
            out.append(_public_sub(sub))
        WS.revision += 1
    db.log(user["username"], "booking_submit", ",".join(s["id"] for s in out))
    return ok({"submissions": out})


def _can_approve(user, sub):
    if user["username"] == sub["requester_username"]:
        return "You cannot approve or reject your own request; ask another approver"
    if user["role"] == "admin":
        return None
    if user["role"] == "department_coordinator":
        room = next((r for r in WS.dataset["rooms"] if r["id"] == (sub.get("placement") or {}).get("room_id")), None)
        if room and room["type"] in LAB_TYPES and sub.get("department") == user["department"]:
            return None
        return "Coordinators can only decide lab bookings requested by their own department"
    return "Only an Admin or the owning department coordinator can decide bookings"


@router.post("/bookings/{sid}/decision")
def decide(sid: str, body: DecisionBody, user=Depends(current_user)):
    with WS.lock:
        sub = WS.submissions.get(sid)
        if not sub:
            return fail(404, "INVALID_INPUT", "Unknown booking")
        denied = _can_approve(user, sub)
        if denied:
            return fail(403, "FORBIDDEN", denied)
        if sub["status"] != "PENDING_APPROVAL":
            return fail(409, "INVALID_INPUT", f"Booking is {sub['status']}; only pending bookings can be decided")
        act = body.action
        if sub.get("negotiation_id") and act in ("approve", "offer_alternative"):
            from .api_negotiation import apply_negotiation
            return apply_negotiation(sub, user, body.reason)
        if act == "reject":
            sub.update(status="REJECTED", decided_by=user["username"],
                       decision_reason=body.reason or "Rejected by approver")
            from .api_negotiation import on_reject
            on_reject(sub)
        elif act in ("approve", "offer_alternative"):
            p = sub["placement"]
            D = _decider()          # the live state excludes this pending booking, so its slot must be free
            problems = D.check_slot(sub["request"], p["room_id"], p["day"], p["start_period"], p["end_period"])
            if problems:
                return fail(409, "CONSTRAINT_VIOLATION", "That slot is no longer valid: " + "; ".join(m for _, m in problems),
                            details=[{"rule": r, "detail": m} for r, m in problems],
                            rule_ids=sorted({r for r, _ in problems}))
            hard = _official_hard(sub)
            if hard:
                return fail(500, "CONSTRAINT_VIOLATION", "Official validator rejected the placement", details=hard)
            inside = any(w["day"] == p["day"] and w["from_period"] <= p["start_period"] and p["end_period"] <= w["to_period"]
                         for w in sub["request"]["windows"])
            if act == "approve" and not inside:
                act = "offer_alternative"        # outside the requested window can only be an alternative
            sub.update(status="APPROVED" if act == "approve" else "ALTERNATIVE_OFFERED", decided_by=user["username"],
                       decision_reason=body.reason or sub["proposed"]["reason"])
        else:
            return fail(422, "INVALID_INPUT", "action must be approve, reject or offer_alternative")
        sub["decided_at"] = time.time()
        WS.revision += 1
    db.log(user["username"], f"booking_{act}", sid)
    return ok(_public_sub(sub))


@router.post("/bookings/{sid}/respond")
def respond(sid: str, accept: bool = Body(..., embed=True), user=Depends(current_user)):
    with WS.lock:
        sub = WS.submissions.get(sid)
        if not sub or sub["requester_username"] != user["username"]:
            return fail(404, "INVALID_INPUT", "Unknown booking")
        if sub["status"] != "ALTERNATIVE_OFFERED":
            return fail(409, "INVALID_INPUT", "There is no alternative to respond to")
        sub["status"] = "APPROVED" if accept else "WITHDRAWN"
        WS.revision += 1
    return ok(_public_sub(sub))


@router.post("/bookings/{sid}/cancel")
def cancel(sid: str, user=Depends(current_user)):
    with WS.lock:
        sub = WS.submissions.get(sid)
        if not sub or (sub["requester_username"] != user["username"] and user["role"] != "admin"):
            return fail(404, "INVALID_INPUT", "Unknown booking")
        if sub["status"] in ("CANCELLED", "REJECTED", "WITHDRAWN"):
            return fail(409, "INVALID_INPUT", f"Booking is already {sub['status']}")
        sub["status"] = "CANCELLED"
        from .api_negotiation import on_cancel
        on_cancel(sub)
        WS.revision += 1
    return ok(_public_sub(sub))


@router.post("/events/manual")
def manual_event(ev: ManualEvent, user=Depends(current_user)):
    """Schedule an event in a chosen room/time. The same hard rules apply; invalid slots change nothing."""
    if WS.schedule is None:
        return fail(409, "INVALID_INPUT", "The timetable has not been generated yet")
    if ev.requested_category not in WS.dataset["priority_order"]:
        ev.requested_category = "club_event"
    room = next((r for r in WS.dataset["rooms"] if r["id"] == ev.room_id), None)
    if not room:
        return fail(422, "INVALID_INPUT", f"Unknown room {ev.room_id}")
    sid = "MAN-" + uuid.uuid4().hex[:6].upper()
    req = {"id": sid, "submitted_at": _now_iso(), "requester": user["org"] or user["display_name"], "role": user["role"],
           "requested_category": ev.requested_category, "title": ev.title, "attendance": ev.attendance,
           "duration_periods": ev.end_period - ev.start_period + 1,
           "windows": [{"day": ev.day, "from_period": ev.start_period, "to_period": ev.end_period}],
           "room_types": [room["type"]], "needs": [n for n in ev.needs if n in NEEDS],
           "requested_room": ev.room_id, "mandatory_for_groups": ev.mandatory_for_groups, "series_id": None, "raw_text": ""}
    with WS.lock:
        D = _decider()
        groups = {g["id"] for g in WS.dataset["student_groups"]}
        problems = [("H13", f"Unknown student group {g}") for g in ev.mandatory_for_groups if g not in groups]
        problems += D.check_slot(req, ev.room_id, ev.day, ev.start_period, ev.end_period)
        if problems:
            return fail(422, "CONSTRAINT_VIOLATION", "Not scheduled: " + "; ".join(m for _, m in problems),
                        details=[{"rule": r, "detail": m} for r, m in problems],
                        rule_ids=sorted({r for r, _ in problems}))
        placement = {"day": ev.day, "start_period": ev.start_period, "end_period": ev.end_period, "room_id": ev.room_id}
        sub = {"id": sid, "requester_username": user["username"], "requester": req["requester"], "role": user["role"],
               "department": user["department"], "title": ev.title, "request": req, "created_at": time.time(),
               "manual": True, "placement": placement, "proposed": {"status": "approved", "reason": "Manually scheduled",
                                                                    **placement}, "decision_reason": "Manually scheduled"}
        if user["role"] in ("admin", "department_coordinator"):
            sub.update(status="APPROVED", decided_by=user["username"])
            hard = _official_hard(sub)
            if hard:
                return fail(500, "CONSTRAINT_VIOLATION", "Official validator rejected the placement", details=hard)
        else:
            sub["status"] = "PENDING_APPROVAL"
        WS.submissions[sid] = sub
        WS.revision += 1
    db.log(user["username"], "manual_event", sid)
    return ok(_public_sub(sub))


@router.get("/venue-board")
def venue_board(user=Depends(current_user)):
    """Week 7 room-by-time picture: classes (after any Week 7 overrides), events and closures."""
    d = WS.dataset
    sess = {s["id"]: s for s in d["sessions"]}
    base = _week_base() if WS.schedule is not None else {}
    moved = {o["session_id"] for o in (WS.bookings or {}).get("overrides", [])}
    classes = []
    for sid, (day, st, rid) in base.items():
        s = sess.get(sid)
        if s:
            classes.append({"session_id": sid, "course_id": s["course_id"], "kind": s["kind"], "room_id": rid,
                            "day": day, "start": st, "end": st + s["duration"] - 1, "groups": s["groups"],
                            "week7_override": sid in moved})
    events = []
    reqs = {r["id"]: r for r in d["booking_requests"]}
    for x in (WS.bookings or {}).get("decisions", []):
        if x["status"] in ("approved", "alternative_offered") and x.get("room_id"):
            r = reqs[x["request_id"]]
            events.append({"id": x["request_id"], "title": r["title"], "requester": r["requester"], "room_id": x["room_id"],
                           "day": x["day"], "start": x["start_period"], "end": x["end_period"],
                           "status": x["status"], "category": x["effective_category"], "source": "spectra"})
    for s in WS.submissions.values():
        if s.get("placement") and s["status"] in ("APPROVED", "ALTERNATIVE_OFFERED", "PENDING_APPROVAL", "NEEDS_REVIEW"):
            p = s["placement"]
            visible = user["role"] == "admin" or s["requester_username"] == user["username"] or s["status"] == "APPROVED"
            if visible:
                events.append({"id": s["id"], "title": s["title"], "requester": s["requester"], "room_id": p["room_id"],
                               "day": p["day"], "start": p["start_period"], "end": p["end_period"],
                               "status": s["status"].lower(), "category": s["proposed"].get("effective_category", ""),
                               "source": "app"})
    closures = [{"room_id": u["room_id"], "day": u["day"], "periods": u["periods"], "reason": u.get("reason", "")}
                for u in d.get("room_unavailability", [])]
    return ok({"days": d["calendar"]["days"], "rooms": [{"id": r["id"], "name": r["name"], "type": r["type"],
                                                         "capacity": r["capacity"], "events_ok": "event" in r["allowed_uses"]}
                                                        for r in d["rooms"]],
               "classes": classes, "events": events, "closures": closures, "revision": WS.revision})
