"""Spectra week booking decisions: batch, priority-ordered, deterministic placement."""
import copy
from collections import defaultdict

from ..core.official import official_validator
from .candidates import build_candidates

MAXP = 13


class Week:
    """Week-7 occupancy view: classes (possibly moved) plus placed events."""

    def __init__(self, ctx, base):
        self.ctx = ctx
        self.sess = ctx.sessions
        self.pos = dict(base)                       # sid -> (day, start, room)
        self.room = defaultdict(list)               # (room, day, p) -> ids (sessions or requests)
        self.fac = defaultdict(list)
        self.grp = defaultdict(set)
        self.ev_grp = defaultdict(set)              # (group, day, p) -> request ids
        self.hours = defaultdict(int)               # (faculty, day) -> hours
        for sid, (d, st, r) in self.pos.items():
            self._add(sid, d, st, r)

    @staticmethod
    def key(s):
        return s.get("basket_slot") or s["id"]

    def _add(self, sid, d, st, r):
        s = self.sess[sid]
        for p in range(st, st + s["duration"]):
            self.room[r, d, p].append(sid)
            self.fac[s["faculty_id"], d, p].append(sid)
            for g in s["groups"]:
                self.grp[g, d, p].add(self.key(s))
        self.hours[s["faculty_id"], d] += s["duration"]

    def _remove(self, sid):
        d, st, r = self.pos[sid]
        s = self.sess[sid]
        for p in range(st, st + s["duration"]):
            self.room[r, d, p].remove(sid)
            self.fac[s["faculty_id"], d, p].remove(sid)
            for g in s["groups"]:
                self.grp[g, d, p].discard(self.key(s))
        self.hours[s["faculty_id"], d] -= s["duration"]

    def move(self, sid, d, st, r):
        self._remove(sid)
        self.pos[sid] = (d, st, r)
        self._add(sid, d, st, r)

    def add_event(self, req, room_id, d, a, b):
        for p in range(a, b + 1):
            self.room[room_id, d, p].append(req["id"])
            for g in req["mandatory_for_groups"]:
                self.ev_grp[g, d, p].add(req["id"])

    def snapshot(self):
        return copy.deepcopy((self.pos, self.room, self.fac, self.grp, self.ev_grp, self.hours))

    def restore(self, snap):
        self.pos, self.room, self.fac, self.grp, self.ev_grp, self.hours = snap

    def blockers(self, req, rid, d, a, b):
        out = []
        for p in range(a, b + 1):
            if (d, p) in self.ctx.room_un[rid]:
                out.append(("maintenance", rid))
            for x in self.room.get((rid, d, p), []):
                out.append(("class" if x in self.sess else "event", x))
            for g in req["mandatory_for_groups"]:
                if self.grp.get((g, d, p)):
                    out.append(("group", g))
        return out

    def relocate(self, sid, cands):
        """Move class sid to the closest legal slot; False if none (basket classes never move)."""
        s = self.sess[sid]
        if s.get("basket_slot"):
            return False
        cd, cst, cr = self.pos[sid]
        mx = self.ctx.fac[s["faculty_id"]].get("max_hours_per_day", 4)
        best = None
        for (d, st, r) in cands[sid]:
            if (d, st, r) == (cd, cst, cr):
                continue
            ok = True
            for p in range(st, st + s["duration"]):
                if [x for x in self.room.get((r, d, p), []) if x != sid]:
                    ok = False
                if [x for x in self.fac.get((s["faculty_id"], d, p), []) if x != sid]:
                    ok = False
                for g in s["groups"]:
                    if self.grp.get((g, d, p), set()) - {self.key(s)} or self.ev_grp.get((g, d, p)):
                        ok = False
                if not ok:
                    break
            if not ok:
                continue
            if d != cd and self.hours[s["faculty_id"], d] + s["duration"] > mx:
                continue
            score = (d != cd, abs(st - cst), r != cr)
            if best is None or score < best[0]:
                best = (score, (d, st, r))
        if best is None:
            return False
        self.move(sid, *best[1])
        return True


def evaluate_bookings(data, base):
    """Return (decisions in request order, week-7 session overrides, week-7 positions)."""
    V = official_validator()
    ctx = V.Ctx(data)
    cands = build_candidates(data)
    week = Week(ctx, base)
    order = data["priority_order"]
    cap = data["role_category_cap"]
    rooms = data["rooms"]
    days = data["calendar"]["days"]
    inst = order.index("institute_event")

    def eff(r):
        return V.effective_category(data, r)

    reqs = sorted(data["booking_requests"],
                  key=lambda r: (order.index(eff(r)), r["submitted_at"], r["id"]))

    def feats(r):
        return set(r["features"]) | ({"accessible"} if r["accessible"] else set())

    def eligible(req):
        return [r for r in rooms if "event" in r["allowed_uses"] and r["type"] in req["room_types"]
                and r["capacity"] >= req["attendance"] and not set(req["needs"]) - feats(r)]

    def room_pref(req, r):
        return (r["id"] != req.get("requested_room"), r["capacity"], r["id"])

    def priority_note(req):
        note = f"Treated as {eff(req)}"
        if eff(req) != req["requested_category"]:
            note += (f" (requested {req['requested_category']}, but role '{req['role']}' "
                     f"is capped at {cap[req['role']]})")
        return note

    def no_room_reason(req):
        by_type = [r for r in rooms if "event" in r["allowed_uses"] and r["type"] in req["room_types"]]
        if not by_type:
            return f"No venue of type {req['room_types']} can host events"
        big = [r for r in by_type if r["capacity"] >= req["attendance"]]
        if not big:
            top = max(by_type, key=lambda r: r["capacity"])
            return (f"No suitable venue seats {req['attendance']} "
                    f"(largest allowed: {top['id']} with {top['capacity']})")
        if not any(not set(req["needs"]) - feats(r) for r in big):
            return f"No venue of the right type and size has all required facilities {sorted(req['needs'])}"
        return None

    def slots(req, el):
        """In-window candidate slots in preference order: window, start, room."""
        dur = req["duration_periods"]
        for w in req["windows"]:
            for a in range(w["from_period"], min(w["to_period"], MAXP) - dur + 2):
                for r in el:
                    yield r["id"], w["day"], a, a + dur - 1

    decisions, overrides = {}, []
    for req in reqs:
        rid = req["id"]
        note = priority_note(req)
        if rid in ctx.cancelled:
            decisions[rid] = {"request_id": rid, "status": "rejected",
                              "reason": "Request was cancelled by the requester, so it is not scheduled",
                              "effective_category": eff(req), "priority_rank": None}
            continue
        el = sorted(eligible(req), key=lambda r: room_pref(req, r))
        dur = req["duration_periods"]
        found, status, reason, pre_added = None, None, None, False
        held = defaultdict(int)

        for (r_id, d, a, b) in slots(req, el):
            bl = week.blockers(req, r_id, d, a, b)
            if not bl:
                found = (r_id, d, a, b)
                break
            for k, x in bl:
                held[x] += 1
        if found:
            status = "approved"
            reason = f"Approved. {note}. {found[0]} fits inside the requested window"
            if req.get("requested_room") and req["requested_room"] != found[0]:
                reason += f"; the requested room {req['requested_room']} was not suitable or free"

        if not found and el and order.index(eff(req)) <= inst:
            # only an institute-level event may displace regular classes (relocated, never dropped)
            best = None
            for (r_id, d, a, b) in slots(req, el):
                bl = week.blockers(req, r_id, d, a, b)
                if bl and all(k == "class" and not week.sess[x].get("basket_slot") for k, x in bl):
                    victims = sorted({x for _, x in bl})
                    rr = next(r for r in el if r["id"] == r_id)
                    key = (len(victims), room_pref(req, rr), d, a)
                    if best is None or key < best[0]:
                        best = (key, r_id, d, a, b, victims)
            if best:
                _, r_id, d, a, b, victims = best
                snap = week.snapshot()
                week.add_event(req, r_id, d, a, b)
                if all(week.relocate(x, cands) for x in victims):
                    found = (r_id, d, a, b)
                    pre_added = True
                    status = "approved"
                    overrides += [{"session_id": x, "day": week.pos[x][0], "start_period": week.pos[x][1],
                                   "room_id": week.pos[x][2], "displaced_by": rid} for x in victims]
                    reason = (f"Approved. {note}. {r_id} was in use by {len(victims)} regular class(es) "
                              f"({', '.join(victims)}), which were relocated for Week 7 only")
                else:
                    week.restore(snap)

        if not found:
            alt = None
            for r in el:
                for d in days:
                    for a in range(1, MAXP - dur + 2):
                        if week.blockers(req, r["id"], d, a, a + dur - 1):
                            continue
                        w0 = req["windows"][0]
                        k = (not any(w["day"] == d for w in req["windows"]),
                             abs(days.index(d) - days.index(w0["day"])),
                             abs(a - w0["from_period"]), room_pref(req, r))
                        if alt is None or k < alt[0]:
                            alt = (k, r["id"], d, a, a + dur - 1)
            if alt:
                found = alt[1:]
                status = "alternative_offered"
                if not any(min(w["to_period"], MAXP) - w["from_period"] + 1 >= dur for w in req["windows"]):
                    why = "the requested window is too short or runs past P13"
                else:
                    why = "no suitable room was free in the requested window"
                    names = sorted({x for x in held})[:4]
                    if names:
                        why += f" (conflicts with {', '.join(names)})"
                reason = f"Alternative offered. {note}. It cannot be approved as asked: {why}"
            else:
                status = "rejected"
                reason = (f"Rejected. {note}. "
                          + (no_room_reason(req) or "No suitable room is free at any time that week "
                             "after higher-priority bookings and classes"))

        dec = {"request_id": rid, "status": status, "reason": reason,
               "effective_category": eff(req), "priority_rank": order.index(eff(req)) + 1}
        if found and status != "rejected":
            r_id, d, a, b = found
            dec.update({"day": d, "start_period": a, "end_period": b, "room_id": r_id})
            if not pre_added:
                week.add_event(req, r_id, d, a, b)
        decisions[rid] = dec
    return [decisions[r["id"]] for r in data["booking_requests"]], overrides, dict(week.pos)
