"""Voluntary booking-move negotiation (optional; not part of the official scoring or export).

Requester B cannot get a slot because requester A already holds an APPROVED booking there. If A has another free slot
inside A's own requested windows, B may ask A to move. Nothing changes while the offer is open:

    awaiting_response -> accepted | declined | expired | withdrawn | failed_revalidation

* A's approved booking stays exactly as it is until an authorised approver approves B's request, and then both
  changes are applied together, after a fresh check of both bookings against the live state.
* A declining, not answering in time, or the offer going stale only restores B to where it was. A is never cancelled.
* Only A answers. B cannot answer for A and cannot approve their own request.
* Internal statuses (PENDING_NEGOTIATION and the negotiation records) are never part of schedule.json.
"""
import time
import uuid

from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel, Field

from . import db
from .api import fail, ok
from .api_bookings import _decider, _official_hard_many, _public_sub
from .auth import current_user
from .solver.config import negotiation_seconds
from .state import WS

router = APIRouter(prefix="/api")
STARTABLE = ("PENDING_APPROVAL", "REJECTED", "ALTERNATIVE_OFFERED")


class NegotiateBody(BaseModel):
    deadline_seconds: float | None = Field(default=None, ge=1, le=86400)


def _overlap(p, q):
    return (p["room_id"] == q["room_id"] and p["day"] == q["day"]
            and not (p["end_period"] < q["start_period"] or q["end_period"] < p["start_period"]))


def _active(n):
    return n["status"] == "awaiting_response" or (n["status"] == "accepted" and not n.get("applied"))


def _active_negotiations():
    return [n for n in WS.negotiations.values() if _active(n)]


def _inside(req, p):
    return any(w["day"] == p["day"] and w["from_period"] <= p["start_period"] and p["end_period"] <= w["to_period"]
               for w in req["windows"])


def _release(neg, why):
    """Put the requester back exactly where they were before the offer; the holder's booking is untouched."""
    b = WS.submissions.get(neg["requester_sub"])
    if b and b["status"] in ("PENDING_NEGOTIATION", "PENDING_APPROVAL") and b.get("negotiation_id") == neg["id"]:
        b["status"] = neg["b_prev"]["status"]
        b["placement"] = neg["b_prev"]["placement"]
        b["proposed"] = neg["b_prev"]["proposed"]
        b["decision_reason"] = f"{neg['b_prev']['reason']} (Move offer {why}; the existing booking was kept.)"
        b["negotiation_id"] = None


def expire_due():
    """Lazy deadline handling: any call that touches negotiations settles the ones whose time is up."""
    changed = False
    with WS.lock:
        now = time.time()
        for n in WS.negotiations.values():
            if n["status"] == "awaiting_response" and now >= n["expires_at"]:
                n["status"] = "expired"
                n["closed_at"] = now
                _release(n, "expired without an answer")
                changed = True
        if changed:
            WS.revision += 1
    return changed


def void_stale():
    """The timetable changed: open offers were built on the old one, so they are closed (never silently applied)."""
    with WS.lock:
        for n in _active_negotiations():
            if n["schedule_version"] != WS.schedule_version:
                n["status"] = "failed_revalidation"
                n["closed_at"] = time.time()
                _release(n, "closed because the timetable changed")


def on_cancel(sub):
    """A booking that is part of an open offer was cancelled: close the offer."""
    with WS.lock:
        for n in _active_negotiations():
            if sub["id"] == n["requester_sub"]:
                n["status"] = "withdrawn"
                n["closed_at"] = time.time()
            elif sub["id"] == n["holder_sub"]:
                n["status"] = "withdrawn"
                n["closed_at"] = time.time()
                _release(n, "closed because the other booking was cancelled")


def on_reject(sub):
    with WS.lock:
        for n in _active_negotiations():
            if sub["id"] == n["requester_sub"]:
                n["status"] = "withdrawn"
                n["closed_at"] = time.time()


def _view(n, user):
    a, b = WS.submissions.get(n["holder_sub"]), WS.submissions.get(n["requester_sub"])
    out = {k: v for k, v in n.items() if not k.startswith("_") and k != "b_prev"}
    out["seconds_left"] = max(0, round(n["expires_at"] - time.time())) if n["status"] == "awaiting_response" else 0
    out["holder"] = {"id": n["holder_sub"], "title": a and a["title"], "requester": a and a["requester"]}
    out["requester"] = {"id": n["requester_sub"], "title": b and b["title"], "requester": b and b["requester"]}
    out["can_respond"] = bool(a and a["requester_username"] == user["username"] and n["status"] == "awaiting_response")
    out["can_withdraw"] = bool(b and (b["requester_username"] == user["username"] or user["role"] == "admin")
                               and _active(n))
    return out


def _find_option(b):
    """First slot inside B's windows whose only blocker is one APPROVED app booking that can move inside its own windows."""
    D = _decider()
    req = b["request"]
    busy = _active_negotiations()
    for (r, d, a, e) in D.slots(req, sorted(D.eligible(req), key=lambda x: D.room_pref(req, x))):
        bl = D.week.blockers(req, r, d, a, e)
        if not bl or any(k != "event" for k, _ in bl):
            continue
        holders = {x for _, x in bl}
        if len(holders) != 1:
            continue
        hid = next(iter(holders))
        h = WS.submissions.get(hid)
        if (not h or h["status"] != "APPROVED" or h.get("manual") or h["id"] == b["id"]
                or h["requester_username"] == b["requester_username"]):
            continue
        target = {"room_id": r, "day": d, "start_period": a, "end_period": e}
        if any(n["holder_sub"] == hid or _overlap(target, n["b_slot"]) or _overlap(target, n["a_to"]) for n in busy):
            continue
        D2 = _decider(exclude={hid})
        D2.week.add_event(req, r, d, a, e)
        old = h["placement"]
        moves = D2.free_slots(h["request"])
        moves = [m for m in moves if not any(_overlap({"room_id": m[0], "day": m[1], "start_period": m[2],
                                                       "end_period": m[3]}, n["b_slot"]) or
                                             _overlap({"room_id": m[0], "day": m[1], "start_period": m[2],
                                                       "end_period": m[3]}, n["a_to"]) for n in busy)]
        if not moves:
            continue
        m = min(moves, key=lambda x: (x[1] != old["day"], x[0] != old["room_id"], abs(x[2] - old["start_period"])))
        return {"holder_sub": hid, "b_slot": target, "a_from": dict(old),
                "a_to": {"room_id": m[0], "day": m[1], "start_period": m[2], "end_period": m[3]}}
    return None


def _revalidate(n):
    """Fresh, deterministic check of both bookings against the live state. Returns a list of problems."""
    a, b = WS.submissions.get(n["holder_sub"]), WS.submissions.get(n["requester_sub"])
    if not a or not b:
        return ["One of the bookings no longer exists"]
    if n["schedule_version"] != WS.schedule_version or WS.schedule is None:
        return ["The timetable changed after this offer was made"]
    if a["status"] != "APPROVED" or a["placement"] != n["a_from"]:
        return ["The holder's booking changed after this offer was made"]
    if b["status"] not in ("PENDING_NEGOTIATION", "PENDING_APPROVAL") or b.get("negotiation_id") != n["id"]:
        return ["The requesting booking is no longer waiting on this offer"]
    probs = []
    if not _inside(a["request"], n["a_to"]):
        probs.append("The new slot is outside the holder's requested windows")
    if not _inside(b["request"], n["b_slot"]):
        probs.append("The freed slot is outside the requester's windows")
    D = _decider(exclude={a["id"]})
    for _, m in D.check_slot(a["request"], n["a_to"]["room_id"], n["a_to"]["day"], n["a_to"]["start_period"],
                             n["a_to"]["end_period"]):
        probs.append("Holder's new slot: " + m)
    D.place_existing({"status": "approved", **n["a_to"]}, a["request"])
    for _, m in D.check_slot(b["request"], n["b_slot"]["room_id"], n["b_slot"]["day"], n["b_slot"]["start_period"],
                             n["b_slot"]["end_period"]):
        probs.append("Requested slot: " + m)
    if not probs:
        hard = _official_hard_many([{"request": a["request"], "placement": n["a_to"]},
                                    {"request": b["request"], "placement": n["b_slot"]}])
        probs += [v["detail"] for v in hard]
    return probs


@router.get("/bookings/{sid}/negotiation-options")
def options(sid: str, user=Depends(current_user)):
    expire_due()
    with WS.lock:
        b = WS.submissions.get(sid)
        if not b or (b["requester_username"] != user["username"] and user["role"] != "admin"):
            return fail(404, "INVALID_INPUT", "Unknown booking")
        opt = _find_option(b) if b["status"] in STARTABLE and not b.get("negotiation_id") else None
        if not opt:
            return ok({"available": False, "message": "No existing booking can voluntarily make room for this request."})
        a = WS.submissions[opt["holder_sub"]]
        return ok({"available": True, "holder": {"id": a["id"], "title": a["title"], "requester": a["requester"]},
                   "b_slot": opt["b_slot"], "a_from": opt["a_from"], "a_to": opt["a_to"],
                   "default_deadline_seconds": negotiation_seconds()})


@router.post("/bookings/{sid}/negotiate")
def negotiate(sid: str, body: NegotiateBody | None = None, user=Depends(current_user)):
    body = body or NegotiateBody()
    expire_due()
    with WS.lock:
        b = WS.submissions.get(sid)
        if not b or (b["requester_username"] != user["username"] and user["role"] != "admin"):
            return fail(404, "INVALID_INPUT", "Unknown booking")
        if b["requester_username"] != user["username"]:
            return fail(403, "FORBIDDEN", "Only the requester can ask another booking holder to move")
        if b["status"] not in STARTABLE or b.get("negotiation_id"):
            return fail(409, "INVALID_INPUT", f"A move offer cannot be started while the booking is {b['status']}")
        if b["proposed"].get("status") == "approved":
            return fail(409, "INVALID_INPUT", "This request already fits inside what you asked for; no move is needed")
        opt = _find_option(b)
        if not opt:
            return fail(409, "INVALID_INPUT", "No existing booking can voluntarily make room for this request")
        nid = "NEG-" + uuid.uuid4().hex[:6].upper()
        now = time.time()
        n = {"id": nid, "status": "awaiting_response", "requester_sub": b["id"], "holder_sub": opt["holder_sub"],
             "b_slot": opt["b_slot"], "a_from": opt["a_from"], "a_to": opt["a_to"], "created_at": now,
             "expires_at": now + (body.deadline_seconds or negotiation_seconds()), "schedule_version": WS.schedule_version,
             "applied": False,
             "b_prev": {"status": b["status"], "placement": b["placement"], "proposed": b["proposed"],
                        "reason": b["decision_reason"]}}
        WS.negotiations[nid] = n
        b["status"] = "PENDING_NEGOTIATION"
        b["negotiation_id"] = nid
        b["decision_reason"] = (f"Waiting for {WS.submissions[opt['holder_sub']]['requester']} to answer a voluntary move "
                                f"offer. Their booking stays as it is until then.")
        WS.revision += 1
        view = _view(n, user)
    db.log(user["username"], "negotiation_start", f"{nid} {sid}")
    return ok(view)


@router.get("/negotiations")
def list_negotiations(user=Depends(current_user)):
    expire_due()
    with WS.lock:
        out = []
        for n in WS.negotiations.values():
            a, b = WS.submissions.get(n["holder_sub"]), WS.submissions.get(n["requester_sub"])
            mine = ((a and a["requester_username"] == user["username"]) or (b and b["requester_username"] == user["username"])
                    or user["role"] == "admin")
            if mine:
                out.append(_view(n, user))
    out.sort(key=lambda x: x["created_at"], reverse=True)
    return ok({"negotiations": out, "default_deadline_seconds": negotiation_seconds()})


@router.post("/negotiations/{nid}/respond")
def respond(nid: str, accept: bool = Body(..., embed=True), user=Depends(current_user)):
    expire_due()
    with WS.lock:
        n = WS.negotiations.get(nid)
        a = n and WS.submissions.get(n["holder_sub"])
        if not n or not a or a["requester_username"] != user["username"]:
            return fail(403 if n else 404, "FORBIDDEN" if n else "INVALID_INPUT",
                        "Only the holder of the booking that would move can answer this offer" if n else "Unknown offer")
        if n["status"] != "awaiting_response":
            return fail(409, "INVALID_INPUT", f"This offer is already {n['status'].replace('_', ' ')}")
        n["responded_by"], n["responded_at"] = user["username"], time.time()
        if not accept:
            n["status"] = "declined"
            n["closed_at"] = n["responded_at"]
            _release(n, "declined")
            WS.revision += 1
            db.log(user["username"], "negotiation_decline", nid)
            return ok(_view(n, user))
        problems = _revalidate(n)
        if problems:
            n["status"] = "failed_revalidation"
            n["closed_at"] = n["responded_at"]
            n["problems"] = problems
            _release(n, "no longer valid")
            WS.revision += 1
            return fail(409, "CONSTRAINT_VIOLATION", "The offer no longer works: " + "; ".join(problems), details=problems)
        n["status"] = "accepted"
        b = WS.submissions[n["requester_sub"]]
        b["status"] = "PENDING_APPROVAL"
        b["placement"] = dict(n["b_slot"])
        b["proposed"] = {**b["proposed"], "status": "approved", **n["b_slot"],
                         "reason": f"Fits inside the requested window because {a['requester']} agreed to move"}
        b["decision_reason"] = b["proposed"]["reason"] + ". Waiting for an approver."
        WS.revision += 1
    db.log(user["username"], "negotiation_accept", nid)
    return ok(_view(n, user))


@router.post("/negotiations/{nid}/withdraw")
def withdraw(nid: str, user=Depends(current_user)):
    expire_due()
    with WS.lock:
        n = WS.negotiations.get(nid)
        b = n and WS.submissions.get(n["requester_sub"])
        if not n or not b or (b["requester_username"] != user["username"] and user["role"] != "admin"):
            return fail(404, "INVALID_INPUT", "Unknown offer")
        if not _active(n):
            return fail(409, "INVALID_INPUT", f"This offer is already {n['status'].replace('_', ' ')}")
        n["status"] = "withdrawn"
        n["closed_at"] = time.time()
        _release(n, "withdrawn")
        WS.revision += 1
    return ok(_view(n, user))


def apply_negotiation(b, user, reason=None):
    """Called from the normal approval endpoint (lock held, approver already checked) for a request with an offer.
    Re-checks everything, then changes the holder's booking and approves the requester's in one step."""
    n = WS.negotiations.get(b.get("negotiation_id"))
    if not n or n["status"] != "accepted" or n.get("applied"):
        return fail(409, "INVALID_INPUT", "The holder has not accepted the move yet, so this request cannot be approved")
    problems = _revalidate(n)
    if problems:
        n["status"] = "failed_revalidation"
        n["closed_at"] = time.time()
        n["problems"] = problems
        _release(n, "no longer valid")
        WS.revision += 1
        return fail(409, "CONSTRAINT_VIOLATION", "Not applied, nothing changed: " + "; ".join(problems), details=problems)
    a = WS.submissions[n["holder_sub"]]
    a["placement"] = dict(n["a_to"])
    a["decision_reason"] = (f"Moved by agreement to {n['a_to']['room_id']} {n['a_to']['day']} "
                            f"P{n['a_to']['start_period']}-P{n['a_to']['end_period']} to make room for {b['id']}")
    b.update(status="APPROVED", decided_by=user["username"], decided_at=time.time(),
             decision_reason=reason or f"Approved after {a['requester']} agreed to move", negotiation_id=n["id"])
    n["applied"], n["applied_at"] = True, time.time()
    WS.revision += 1
    db.log(user["username"], "negotiation_apply", n["id"])
    return ok(_public_sub(b))
