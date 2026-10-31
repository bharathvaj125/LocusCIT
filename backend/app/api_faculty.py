"""Faculty change requests: natural language (or structured) -> restrictions -> validated pending proposal."""
import re
import threading
import time
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from . import db
from .api import fail, ok
from .api_repair import _compute, _public
from .auth import current_user
from .nlp import ABUSE, DAY_RE, IST, WEEKDAYS, _hour_to_24, _period_of_hour
from .solver.bookings import Week
from .core.official import official_validator
from .solver.candidates import Eligibility, build_candidates
from .state import WS

router = APIRouter(prefix="/api")
PERIOD_WORDS = [(r"after lunch|post lunch", [6, 7, 8, 9]), (r"afternoon", [6, 7, 8, 9]),
                (r"morning", [1, 2, 3, 4, 5]), (r"evening", [10, 11, 12, 13]), (r"first period|first hour", [1]),
                (r"last period|last hour", [9])]
NEG = r"\b(?:not|no|never|avoid|off|except|cannot|can't|cant|can not|unable|don't|dont|without|nahi|nahin|na)\b"
LEAVE = r"leave|travel|conference|sick|unwell|unavailable|not available|can't teach|cannot teach|away|out of station|busy"


class ChangeBody(BaseModel):
    text: str | None = Field(default=None, max_length=1200)
    session_id: str | None = None
    kind: str | None = None                 # "move" | "unavailable"
    avoid_slots: list[dict] = []            # [{"days": ["MON"], "periods": [1,2,3]}]
    allow_slots: list[dict] = []
    days: list[str] = []                    # for kind=unavailable
    periods: list[int] = []
    reason: str | None = Field(default=None, max_length=300)


def _owns(user, s):
    if user["role"] == "admin":
        return True
    fac = next(f for f in WS.dataset["faculty"] if f["id"] == s["faculty_id"])
    if user["role"] == "faculty":
        return s["faculty_id"] == user["faculty_id"]
    if user["role"] == "department_coordinator":
        return fac["department"] == user["department"]
    return False


def _my_sessions(user):
    out = []
    for s in WS.dataset["sessions"]:
        if _owns(user, s) and (user["role"] != "admin"):
            slot = (WS.schedule or {}).get(s["id"])
            out.append({"session_id": s["id"], "course_id": s["course_id"], "kind": s["kind"], "groups": s["groups"],
                        "faculty_id": s["faculty_id"],
                        "current": {"day": slot[0], "start_period": slot[1], "room_id": slot[2]} if slot else None})
    return out


def _periods_in(clause):
    """Period set described by the clause, or None."""
    for rx, ps in PERIOD_WORDS:
        if re.search(rx, clause):
            return ps
    m = re.search(r"(before|after|till|until|from)\s+(\d{1,2})(?::\d{2})?\s*(am|pm)?", clause)
    if m:
        kind, h, mk = m.group(1), int(m.group(2)), m.group(3)
        p = _period_of_hour(_hour_to_24(h, mk, mk == "pm" or h <= 7))
        if p:
            return list(range(1, p)) if kind in ("before", "till", "until") else list(range(p, 10))
    m = re.search(r"\bat\s+(\d{1,2})(?::\d{2})?\s*(am|pm)\b", clause)
    if m:
        p = _period_of_hour(_hour_to_24(int(m.group(1)), m.group(2), False))
        if p:
            return [p]
    return None


def parse_change_text(text, user, now=None):
    t = " " + re.sub(r"\s+", " ", (text or "").lower().replace("’", "'")) + " "
    out = {"intent": None, "session_id": None, "avoid_slots": [], "allow_slots": [], "days": [], "periods": [],
           "follow_up": None, "options": [], "interpretation": [], "security_flags": [], "denied": None}
    for rx in ABUSE:
        mm = re.search(rx, t)
        if mm:
            out["security_flags"].append(mm.group(0).strip())
    t = re.sub("|".join(ABUSE), " ", t)
    mine = _my_sessions(user)
    mine_ids = {m["session_id"] for m in mine}
    # a request that names someone else's faculty id or session is refused outright
    for fid in re.findall(r"\bf\d{2}\b", t):
        if user["faculty_id"] and fid.upper() != user["faculty_id"]:
            out["denied"] = "You can only change your own sessions."
    sid_match = [s["session_id"] for s in mine if s["session_id"].lower() in t]
    all_ids = {s["id"].lower(): s["id"] for s in WS.dataset["sessions"]}
    for low, real in all_ids.items():
        if low in t and real not in mine_ids and user["role"] != "admin":
            out["denied"] = f"{real} is not one of your sessions."
    cands = list(sid_match)
    if not cands:
        for code in re.findall(r"\b([a-z]{2,3}\d{3})\b", t):
            cands += [s["session_id"] for s in mine if s["course_id"].lower() == code]
            other = [s for s in WS.dataset["sessions"] if s["course_id"].lower() == code and s["id"] not in mine_ids]
            if other and not any(s["course_id"].lower() == code for s in mine):
                out["denied"] = f"You do not teach {code.upper()}."
    kinds = [k for k in ("lecture", "tutorial", "lab") if re.search(rf"\b{k}s?\b", t)]
    if kinds and len(cands) != 1:
        narrowed = [c for c in cands if next(s for s in mine if s["session_id"] == c)["kind"] in kinds]
        cands = narrowed or cands
    clauses = [c for c in re.split(r"[.;,]| but | and then | then ", t) if c.strip()]
    day_re = {d: DAY_RE[d] for d in WEEKDAYS[:5]}
    cur_day = None
    if len(set(cands)) > 1:
        # a day mentioned alongside "my ... class" can identify which session is meant
        for d, rx in day_re.items():
            hit = [c for c in set(cands) if rx.search(t) and dict(
                (m["session_id"], m["current"]) for m in mine)[c] and dict(
                (m["session_id"], m["current"]) for m in mine)[c]["day"] == d]
            if len(hit) == 1:
                cands, cur_day = hit, d
                break
    cands = list(dict.fromkeys(cands))
    if len(cands) == 1:
        out["session_id"] = cands[0]
        cur = dict((m["session_id"], m["current"]) for m in mine).get(cands[0])
        cur_day = cur_day or (cur or {}).get("day")
    elif len(cands) > 1:
        out["options"] = [m for m in mine if m["session_id"] in cands]
    for c in clauses:
        neg = bool(re.search(NEG, c))
        periods = _periods_in(c)
        found = []
        for d, rx in day_re.items():
            for mm in rx.finditer(c):
                pre = c[max(0, mm.start() - 14):mm.start()]
                role = ("avoid" if re.search(r"(?:from|off|not|except|avoid|no)\b\s*(?:on\s*)?$", pre) else
                        "allow" if re.search(r"(?:to|on|for|towards|prefer|only)\s*$", pre) else None)
                found.append((d, role))
        days = [d for d, _ in found]
        if not days and periods is None:
            continue
        if not days:
            slot = {"days": [], "periods": periods}
            (out["avoid_slots"] if neg else out["allow_slots"]).append(slot)
            continue
        avoid_days = [d for d, r in found if r == "avoid" or (r is None and neg)]
        allow_days = [d for d, r in found if r == "allow" or (r is None and not neg and d != cur_day)]
        if avoid_days:
            out["avoid_slots"].append({"days": avoid_days, "periods": periods or []})
        if allow_days:
            out["allow_slots"].append({"days": allow_days, "periods": periods or []})
        if not avoid_days and not allow_days and periods:
            out["allow_slots"].append({"days": [], "periods": periods})
    # unavailable vs move
    if re.search(LEAVE, t) and not out["session_id"] and out["avoid_slots"] + out["allow_slots"]:
        slots = out["avoid_slots"] or out["allow_slots"]
        out["intent"] = "unavailable"
        out["days"] = sorted({d for s in slots for d in s["days"]})
        out["periods"] = sorted({p for s in slots for p in s["periods"]}) or list(range(1, 10))
        out["avoid_slots"], out["allow_slots"] = [], []
    elif out["session_id"] or re.search(r"\b(move|shift|reschedule|change|swap|put)\b", t):
        out["intent"] = "move"
    if out["intent"] == "unavailable" and not out["days"]:
        out["follow_up"] = "Which day(s) are you unavailable?"
    elif out["intent"] == "move":
        if not out["session_id"]:
            out["follow_up"] = "Which of your classes should move?" + \
                (" Options: " + ", ".join(o["session_id"] for o in out["options"]) if out["options"] else "")
        elif not out["avoid_slots"] and not out["allow_slots"]:
            out["follow_up"] = "When should it be (or avoid): which days or times?"
    elif out["intent"] is None:
        out["follow_up"] = ("I could not tell what to change. Say which class to move (for example CS201) and "
                            "when, or which days you are unavailable.")
    if out["denied"]:
        out["follow_up"] = None
    if out["session_id"]:
        out["interpretation"].append(f"Session: {out['session_id']}")
    return out


def _pred(avoid, allow, dur, current):
    avoid = [{"days": a.get("days") or [], "periods": set(a.get("periods") or [])} for a in avoid]
    allow = [{"days": a.get("days") or [], "periods": set(a.get("periods") or [])} for a in allow]

    def ok_(c):
        if c == current:
            return False
        day, st, _ = c
        per = set(range(st, st + dur))
        for a in avoid:
            if (not a["days"] or day in a["days"]) and (not a["periods"] or per & a["periods"]):
                return False
        if allow:
            return any((not a["days"] or day in a["days"]) and (not a["periods"] or per <= a["periods"]) for a in allow)
        return True
    return ok_


def blockers_for(sid, pred, limit=8):
    """Why the allowed slots cannot take this session on their own (first-level facts only)."""
    V = official_validator()
    ctx = V.Ctx(WS.dataset)
    s = ctx.sessions[sid]
    el = Eligibility(WS.dataset)
    week = Week(ctx, WS.schedule)
    mx = ctx.fac[s["faculty_id"]].get("max_hours_per_day", 4)
    cur = WS.schedule[sid]
    rows = []
    for d in el.days:
        for st in el.starts_for(s):
            if not pred((d, st, "*")) and not pred((d, st, cur[2])):
                continue
            per = range(st, st + s["duration"])
            why = []
            if any((d, p) in el.fac_un[s["faculty_id"]] for p in per):
                why.append(f"You are marked unavailable on {d} at that time")
            for p in per:
                for x in week.fac.get((s["faculty_id"], d, p), []):
                    if x != sid:
                        why.append(f"You already teach {x} at {d} P{p}")
                for g in s["groups"]:
                    for k in week.grp.get((g, d, p), set()) - {week.key(s)}:
                        why.append(f"Group {g} has {k} at {d} P{p}")
            free = [r for r in el.rooms_for(s) if not any((d, p) in el.room_un[r] for p in per) and
                    not any([x for x in week.room.get((r, d, p), []) if x != sid] for p in per)]
            if not free:
                why.append("No suitable room is free then")
            if week.hours[s["faculty_id"], d] + (0 if d == cur[0] else s["duration"]) > mx:
                why.append(f"Your daily teaching limit ({mx}h) would be exceeded on {d}")
            if why:
                rows.append({"slot": f"{d} P{st}-P{st + s['duration'] - 1}", "blocked_by": sorted(set(why))[:4]})
    return rows[:limit]


def _run(pid, user, parsed, body, time_limit):
    p = WS.proposals[pid]
    try:
        if parsed["intent"] == "unavailable":
            ch = {"changes": [{"type": "faculty_unavailable", "faculty_id": user["faculty_id"],
                               "days": parsed["days"], "periods": parsed["periods"],
                               "reason": body.reason or "Requested by faculty"}]}
            _compute(pid, ch, time_limit)
        else:
            s = next(x for x in WS.dataset["sessions"] if x["id"] == parsed["session_id"])
            cur = WS.schedule[parsed["session_id"]]
            pred = _pred(parsed["avoid_slots"], parsed["allow_slots"], s["duration"], tuple(cur))
            _compute(pid, {"changes": []}, time_limit, restrict={parsed["session_id"]: pred})
            if p["status"] in ("INFEASIBLE", "UNKNOWN"):
                p["unavailable_because"] = blockers_for(parsed["session_id"], pred)
                p["message"] = ("No valid alternative exists for these constraints." if p["status"] == "INFEASIBLE"
                                else "The solver could not finish in time; this is not proof that no slot exists.")
    except Exception as e:
        p.update(status="ERROR", message=str(e))
    finally:
        WS.save()


@router.get("/faculty/my-sessions")
def my_sessions(user=Depends(current_user)):
    if user["role"] not in ("faculty", "department_coordinator"):
        return fail(403, "FORBIDDEN", "Only faculty and department coordinators have sessions to change")
    return ok({"sessions": _my_sessions(user), "revision": WS.revision})


@router.post("/faculty/change-request", status_code=202)
def change_request(body: ChangeBody, user=Depends(current_user)):
    if user["role"] not in ("faculty", "department_coordinator"):
        return fail(403, "FORBIDDEN", "Only faculty and department coordinators can request schedule changes")
    if WS.schedule is None:
        return fail(409, "INVALID_INPUT", "The timetable has not been generated yet")
    if user["role"] == "faculty" and not user["faculty_id"]:
        return fail(403, "FORBIDDEN", "Your account is not linked to a faculty member")
    if body.text:
        parsed = parse_change_text(body.text, user)
    else:
        parsed = {"intent": body.kind, "session_id": body.session_id, "avoid_slots": body.avoid_slots,
                  "allow_slots": body.allow_slots, "days": body.days, "periods": body.periods or list(range(1, 10)),
                  "follow_up": None, "options": [], "interpretation": [], "security_flags": [], "denied": None}
        if body.kind == "unavailable" and not body.days:
            parsed["follow_up"] = "Which day(s) are you unavailable?"
        if body.kind == "move" and not (body.session_id and (body.avoid_slots or body.allow_slots)):
            parsed["follow_up"] = "Choose a session and when it should (or should not) be."
        if body.kind not in ("move", "unavailable"):
            return fail(422, "INVALID_INPUT", "kind must be 'move' or 'unavailable' when no text is given")
    if parsed["denied"]:
        return fail(403, "FORBIDDEN", parsed["denied"], details={"security_flags": parsed["security_flags"]})
    if parsed["session_id"]:
        s = next((x for x in WS.dataset["sessions"] if x["id"] == parsed["session_id"]), None)
        if not s:
            return fail(422, "INVALID_INPUT", f"Unknown session {parsed['session_id']}")
        if not _owns(user, s):
            return fail(403, "FORBIDDEN", "You can only change your own sessions")
    if parsed["intent"] == "unavailable" and user["role"] != "faculty":
        return fail(403, "FORBIDDEN", "Only a faculty member can mark their own unavailability")
    days = set(WS.dataset["calendar"]["days"])
    if parsed["intent"] == "unavailable":
        if any(d not in days for d in parsed["days"]) or any(not 1 <= p <= 9 for p in parsed["periods"]):
            return fail(422, "INVALID_INPUT", "Days must be Monday-Friday and periods P1-P9")
    if parsed["follow_up"]:
        return ok({"status": "NEEDS_INFO", "question": parsed["follow_up"], "options": parsed["options"],
                   "understood": {k: parsed[k] for k in ("intent", "session_id", "avoid_slots", "allow_slots", "days")},
                   "security_flags": parsed["security_flags"]})
    pid = uuid.uuid4().hex[:10]
    WS.proposals[pid] = {"proposal_id": pid, "type": "faculty_unavailable" if parsed["intent"] == "unavailable"
                         else "faculty_change", "status": "COMPUTING", "base_schedule_version": WS.schedule_version,
                         "dataset_version": WS.dataset["dataset_id"], "requested_by": user["username"],
                         "approved_by": None, "created_at": time.time(), "approved_at": None,
                         "request_text": body.text, "understood": {k: parsed[k] for k in (
                             "intent", "session_id", "avoid_slots", "allow_slots", "days", "periods")},
                         "security_flags": parsed["security_flags"]}
    threading.Thread(target=_run, args=(pid, user, parsed, body, 45), daemon=True).start()
    db.log(user["username"], "faculty_change_request", pid)
    return ok({"status": "COMPUTING", "proposal_id": pid, "security_flags": parsed["security_flags"],
               "understood": WS.proposals[pid]["understood"]})


@router.get("/faculty/change-requests")
def my_requests(user=Depends(current_user)):
    rows = [_public(p) | {"moved": p.get("moved")} for p in WS.proposals.values()
            if p.get("requested_by") == user["username"] or user["role"] == "admin"]
    return ok({"requests": [r for r in rows if r.get("type") in ("faculty_change", "faculty_unavailable")]})


@router.get("/faculty/change-requests/{pid}")
def my_request(pid: str, user=Depends(current_user)):
    p = WS.proposals.get(pid)
    if not p or (p.get("requested_by") != user["username"] and user["role"] != "admin"):
        return fail(404, "INVALID_INPUT", "Unknown request")
    return ok(_public(p))
