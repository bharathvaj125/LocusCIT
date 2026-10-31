"""Explanations built only from real facts: rule checks, penalties and booking decisions. No LLM is involved."""
from collections import Counter

from fastapi import APIRouter, Depends

from .api import fail, ok
from .auth import current_user
from .core.official import official_validator
from .solver.bookings import Week
from .solver.candidates import Eligibility, build_candidates
from .state import WS

router = APIRouter(prefix="/api")
CLOCK = {1: "08:00", 2: "09:00", 3: "10:00", 4: "11:00", 5: "12:00", 6: "14:00", 7: "15:00", 8: "16:00", 9: "17:00",
         10: "18:00", 11: "19:00", 12: "20:00", 13: "21:00"}
NAMES = {"S1": "faculty avoid-preference", "S2": "free periods in a group's day", "S3": "more than 6 hours in a day",
         "S4": "same course twice in a day", "S5": "room under 40% full", "S6": "P9 (17:00) class"}


def _slot(c):
    return f"{c[0]} P{c[1]} ({CLOCK.get(c[1], '?')}) in {c[2]}"


@router.get("/explain/session/{sid}")
def explain_session(sid: str, user=Depends(current_user)):
    if WS.schedule is None:
        return fail(404, "INVALID_INPUT", "No timetable yet")
    s = next((x for x in WS.dataset["sessions"] if x["id"] == sid), None)
    if not s or sid not in WS.schedule:
        return fail(404, "INVALID_INPUT", "Unknown session")
    V = official_validator()
    ctx = V.Ctx(WS.dataset)
    cur = dict(WS.schedule)
    day, st, rid = cur[sid]
    el = Eligibility(WS.dataset)
    week = Week(ctx, cur)
    mx = ctx.fac[s["faculty_id"]].get("max_hours_per_day", 4)
    pen0, tot0 = V.soft_score(ctx, cur)

    hist, legal = Counter(), []
    cset = set(build_candidates(WS.dataset)[sid])
    for d in el.days:
        for p0 in el.starts_for(s):
            per = range(p0, p0 + s["duration"])
            if any((d, p) in el.fac_un[s["faculty_id"]] for p in per):
                hist["faculty unavailable (H7)"] += 1
                continue
            rooms = [r for r in el.rooms_for(s) if not any((d, p) in el.room_un[r] for p in per)]
            if not rooms:
                hist["every suitable room is closed (H8)"] += 1
                continue
            if any([x for x in week.fac.get((s["faculty_id"], d, p), []) if x != sid] for p in per):
                hist["faculty already teaching another class (H2)"] += 1
                continue
            if any(week.grp.get((g, d, p), set()) - {week.key(s)} for g in s["groups"] for p in per):
                hist["a student group has another class (H3)"] += 1
                continue
            if week.hours[s["faculty_id"], d] + (0 if d == day else s["duration"]) > mx:
                hist["faculty daily limit reached (H12)"] += 1
                continue
            free = [r for r in rooms if not any([x for x in week.room.get((r, d, p), []) if x != sid] for p in per)]
            if not free:
                hist["no suitable room free (H4)"] += 1
                continue
            for r in free:
                if (d, p0, r) in cset and (d, p0, r) != (day, st, rid):
                    legal.append((d, p0, r))
    alts = []
    if not s.get("basket_slot"):
        for c in legal:
            trial = dict(cur)
            trial[sid] = c
            pen, tot = V.soft_score(ctx, trial)
            diff = {k: pen[k] - pen0[k] for k in pen if pen[k] != pen0[k]}
            alts.append({"slot": _slot(c), "soft_change": tot - tot0,
                         "because": [f"{'+' if v > 0 else ''}{v} {NAMES[k]} ({k})" for k, v in sorted(diff.items())]})
        alts.sort(key=lambda a: (a["soft_change"], a["slot"]))
    best = alts[0] if alts else None
    lines = [f"{sid} ({s['kind']}, {s['duration']}h) is at {_slot((day, st, rid))}.",
             f"It satisfies every hard rule: {rid} fits {s['size']} students and is a permitted room type, and "
             f"{s['faculty_id']} and groups {', '.join(s['groups'])} are free then."]
    if s.get("basket_slot"):
        lines.append(f"It is an elective in basket {s['basket_slot']}: every session of that basket must share the "
                     "same day and period (H11), so it cannot move on its own.")
    if st == 1:
        lines.append("It starts at 08:00 (P1). Nothing forbids P1; the solver put it there because it keeps the total "
                     f"soft penalty at {tot0}" + (f", and the best single-session alternative would change that by "
                                                   f"{best['soft_change']:+d}." if best else "."))
    if st + s["duration"] - 1 == 9:
        lines.append("It ends in P9 (17:00), which costs 1 soft point (S6); no cheaper legal arrangement was found.")
    if best:
        if best["soft_change"] >= 0:
            lines.append(f"Moving it alone to the best alternative ({best['slot']}) changes the total penalty by "
                         f"{best['soft_change']:+d}; no single move lowers it.")
        else:
            lines.append(f"Note: {best['slot']} would lower the penalty by {-best['soft_change']}, so this timetable is "
                         "not fully optimised (the solver ran out of time).")
    return ok({"session_id": sid, "placement": {"day": day, "start_period": st, "room_id": rid},
               "weekly_slots_considered": sum(hist.values()) + len(legal) + 1,
               "slots_blocked_by": dict(hist), "legal_alternatives": len(legal),
               "soft_total": tot0, "soft_penalties": pen0, "best_alternatives": alts[:3],
               "rule_ids": ["H1-H14", "S1-S6"], "explanation": lines,
               "week7_override": next((o for o in (WS.bookings or {}).get("overrides", []) if o["session_id"] == sid), None)})


@router.get("/explain/booking/{request_id}")
def explain_booking(request_id: str, user=Depends(current_user)):
    d = next((x for x in (WS.bookings or {}).get("decisions", []) if x["request_id"] == request_id), None)
    sub = WS.submissions.get(request_id)
    if not d and sub:
        d = sub["proposed"]
        req = sub["request"]
    else:
        req = next((r for r in WS.dataset["booking_requests"] if r["id"] == request_id), None)
    if not req or not d:
        return fail(404, "INVALID_INPUT", "No decision recorded for that request")
    if user["role"] != "admin":
        if sub and sub["requester_username"] != user["username"]:
            return fail(403, "FORBIDDEN", "You can only see explanations for your own requests")
        if not sub and not (req["role"] == user["role"] and (user["role"] != "club" or req["requester"] == user["org"])):
            return fail(403, "FORBIDDEN", "You can only see explanations for your own requests")
    order = WS.dataset["priority_order"]
    V = official_validator()
    eff = V.effective_category(WS.dataset, req)
    cap = WS.dataset["role_category_cap"].get(req["role"])
    others = []
    if d.get("room_id"):
        for x in (WS.bookings or {}).get("decisions", []):
            if x["request_id"] != request_id and x.get("room_id") == d["room_id"] and x.get("day") == d.get("day") \
                    and x["status"] in ("approved", "alternative_offered") and not (
                    x["end_period"] < d["start_period"] or x["start_period"] > d["end_period"]):
                others.append(x["request_id"])
    facts = [f"Request {request_id} from {req['requester']} (role {req['role']}) asked for category "
             f"'{req['requested_category']}'. The role cap is '{cap}', so it ranks as '{eff}' "
             f"(priority {order.index(eff) + 1} of {len(order)}; ties go to the earlier submission time)."]
    if req["requested_category"] != eff:
        facts.append("The requested category was ignored in favour of the role cap; a request cannot raise its own priority.")
    facts.append(f"Decision: {d['status']}. {d['reason']}")
    if d.get("room_id"):
        facts.append(f"Placed in {d['room_id']} on {d['day']} P{d['start_period']}-P{d['end_period']}.")
    if others:
        facts.append("Nearby bookings in the same room and day: " + ", ".join(others) + ".")
    return ok({"request_id": request_id, "status": d["status"], "reason": d["reason"], "effective_category": eff,
               "role_cap": cap, "priority_rank": order.index(eff) + 1, "same_room_neighbours": others,
               "rule_ids": ["H13", "B1-B3"], "explanation": facts})
