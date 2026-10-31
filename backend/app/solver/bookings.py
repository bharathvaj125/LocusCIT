"""Spectra week booking decisions: batch, priority-ordered, deterministic placement."""
import copy
import re
from collections import defaultdict

from ..core.official import official_validator
from .candidates import build_candidates

MAXP = 13

_LEAD = re.compile(r"^(Rejected|Approved|Alternative offered|Fits the rules and can be approved|Only an alternative fits)\.\s+")


def plain_reason(text):
    """The reason without the leading status word, for screens that already show the status next to it."""
    return _LEAD.sub("", text or "", count=1)


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
            for g in req.get("mandatory_for_groups", []):
                self.ev_grp[g, d, p].add(req["id"])

    def remove_event(self, req, room_id, d, a, b):
        for p in range(a, b + 1):
            self.room[room_id, d, p].remove(req["id"])
            for g in req.get("mandatory_for_groups", []):
                self.ev_grp[g, d, p].discard(req["id"])

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
            for g in req.get("mandatory_for_groups", []):
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


class Decider:
    """Decides one request at a time against a shared Week-7 state."""

    def __init__(self, data, base, ctx=None, cands=None):
        self.data = data
        self.V = official_validator()
        self.ctx = ctx or self.V.Ctx(data)
        self.cands = cands or build_candidates(data)
        self.week = Week(self.ctx, base)
        self.order = data["priority_order"]
        self.cap = data["role_category_cap"]
        self.rooms = data["rooms"]
        self.days = data["calendar"]["days"]
        self.inst = self.order.index("institute_event")
        self.overrides = []
        self.placed = {}                            # request id -> (room, day, start, end) of events decided here
        self.reqs = {}                              # request id -> request, for the ones in `placed`
        self.titles = {}                            # request id -> title, for readable reasons
        self.seen = {}                              # request id -> request, every request decided here
        self.weight = getattr(self.V, "CAT_WEIGHT", {"institute_event": 5, "guest_lecture": 4,
                                                     "department_event": 3, "club_event": 2})

    # -- helpers -------------------------------------------------------------------------------
    def eff(self, r):
        return self.V.effective_category(self.data, r)

    def sort_key(self, r):
        return (self.order.index(self.eff(r)), r["submitted_at"], r["id"])

    @staticmethod
    def feats(r):
        return set(r["features"]) | ({"accessible"} if r["accessible"] else set())

    def eligible(self, req):
        return [r for r in self.rooms if "event" in r["allowed_uses"] and r["type"] in req["room_types"]
                and r["capacity"] >= req["attendance"] and not set(req["needs"]) - self.feats(r)]

    @staticmethod
    def room_pref(req, r):
        return (r["id"] != req.get("requested_room"), r["capacity"], r["id"])

    def priority_note(self, req):
        note = f"Treated as {self.eff(req)}"
        if self.eff(req) != req["requested_category"]:
            note += (f" (requested {req['requested_category']}, but role '{req['role']}' "
                     f"is capped at {self.cap[req['role']]})")
        return note

    def no_room_reason(self, req):
        by_type = [r for r in self.rooms if "event" in r["allowed_uses"] and r["type"] in req["room_types"]]
        if not by_type:
            return f"No venue of type {req['room_types']} can host events"
        big = [r for r in by_type if r["capacity"] >= req["attendance"]]
        if not big:
            top = max(by_type, key=lambda r: r["capacity"])
            return (f"No suitable venue seats {req['attendance']} "
                    f"(largest allowed: {top['id']} with {top['capacity']})")
        if not any(not set(req["needs"]) - self.feats(r) for r in big):
            return f"No venue of the right type and size has all required facilities {sorted(req['needs'])}"
        return None

    def slots(self, req, el):
        dur = req["duration_periods"]
        for w in req["windows"]:
            for a in range(w["from_period"], min(w["to_period"], MAXP) - dur + 2):
                for r in el:
                    yield r["id"], w["day"], a, a + dur - 1

    def check_slot(self, req, room_id, day, a, b):
        """Hard-rule facts for a manually chosen slot. Returns a list of plain-language problems."""
        room = next((r for r in self.rooms if r["id"] == room_id), None)
        if room is None:
            return [("H13", f"Unknown room {room_id}")]
        bad = []
        if day not in self.days:
            bad.append(("H13", f"{day} is not a valid day"))
        if not isinstance(a, int) or not isinstance(b, int) or a < 1 or b > MAXP or b < a:
            bad.append(("H13", f"Periods P{a}-P{b} are outside P1-P{MAXP}"))
        if bad:
            return bad
        if b - a + 1 != req["duration_periods"]:
            bad.append(("H13", f"Booked {b - a + 1} period(s) but the event needs {req['duration_periods']}"))
        if "event" not in room["allowed_uses"]:
            bad.append(("H13", f"{room_id} cannot host events"))
        if req["room_types"] and room["type"] not in req["room_types"]:
            bad.append(("H13", f"{room_id} is a {room['type']}, not one of {req['room_types']}"))
        if room["capacity"] < req["attendance"]:
            bad.append(("H5", f"{room_id} seats {room['capacity']}, the event needs {req['attendance']}"))
        miss = set(req["needs"]) - self.feats(room)
        if miss:
            bad.append(("H13", f"{room_id} lacks {sorted(miss)}"))
        for kind, who in self.week.blockers(req, room_id, day, a, b):
            if kind == "maintenance":
                bad.append(("H8", f"{room_id} is unavailable (maintenance) during that time"))
            elif kind == "class":
                s = self.ctx.sessions[who]
                bad.append(("H4", f"{room_id} is used by class {who} ({s['course_id']})"))
            elif kind == "event":
                bad.append(("H4", f"{room_id} is already booked by {who}"))
            elif kind == "group":
                bad.append(("H13", f"Group {who} is mandatory for this event but has a class then"))
        seen, out = set(), []
        for x in bad:
            if x not in seen:
                seen.add(x)
                out.append(x)
        return out

    def label(self, x):
        """Plain name for whatever occupies a slot: a class or another request with its title."""
        if x in self.ctx.sessions:
            return f"class {self.ctx.sessions[x]['course_id']}"
        r = self.seen.get(x) or next((q for q in self.data["booking_requests"] if q["id"] == x), None)
        title = self.titles.get(x) or (r and r["title"])
        return f"{x} ({title})" if title else x

    # -- flexible-slot allocation ------------------------------------------------------------------
    def free_slots(self, req):
        """Every (room, day, start, end) inside the request's own windows that is free right now."""
        return [(r, d, a, b) for (r, d, a, b) in self.slots(req, self.eligible(req))
                if not self.week.blockers(req, r, d, a, b)]

    def least_harmful(self, req, free, pending):
        """Choose which of req's acceptable slots to use. req keeps an approved slot either way (priority is not
        touched); we pick the one that takes the fewest options away from the requests still to be decided, so a
        flexible request does not sit on the only slot a fixed one can use. Ties keep the requested room, then the
        earliest window and start."""
        if len(free) == 1:
            return free[0]
        opts = self.later_options(pending)
        best = None
        for i, c in enumerate(free):
            hard, soft = self.harm(c, opts)
            key = (hard, c[0] != req.get("requested_room"), soft, i)
            if best is None or key < best[0]:
                best = (key, c)
        return best[1]

    def later_options(self, pending):
        """For each still-undecided request: (category weight, its free slots inside its own windows)."""
        opts = []
        for q in pending:
            fs = self.free_slots(q)
            if fs:
                opts.append((self.weight[self.eff(q)], fs))
        return opts

    @staticmethod
    def harm(c, opts):
        """(weight of requests that would lose their last acceptable slot, weighted share of options lost)."""
        r, d, a, b = c
        hard, soft = 0, 0.0
        for w, fs in opts:
            lost = sum(1 for (r2, d2, a2, b2) in fs if r2 == r and d2 == d and not (b2 < a or b < a2))
            if lost == len(fs):
                hard += w
            elif lost:
                soft += w * lost / len(fs)
        return hard, round(soft, 6)

    def improve(self, decisions):
        """Second pass over a finished batch. A request that got an alternative or a rejection may take a slot another
        request holds, if that request can move to another free slot inside its own windows. The moved request stays
        approved, so nobody ends up worse off and no priority is inverted. Returns the ids whose decision changed."""
        changed = []
        for req in sorted(self.seen.values(), key=self.sort_key):
            dec = decisions.get(req["id"])
            if not dec or dec["status"] == "approved":
                continue
            old = self.placed.get(req["id"])
            el = sorted(self.eligible(req), key=lambda r: self.room_pref(req, r))
            for (r_id, d, a, b) in self.slots(req, el):
                bl = self.week.blockers(req, r_id, d, a, b)
                if not bl or any(k != "event" or x == req["id"] or x not in self.placed for k, x in bl):
                    continue
                blockers = sorted({x for _, x in bl})
                if any(decisions[x]["status"] != "approved" for x in blockers):
                    continue
                moved = [(x, self.placed[x]) for x in blockers]
                if old:
                    self.week.remove_event(req, *old)
                for x, xp in moved:
                    self.week.remove_event(self.reqs[x], *xp)
                self.week.add_event(req, r_id, d, a, b)
                new_places = {}
                for x, xp in moved:
                    spot = next(iter(self.free_slots(self.reqs[x])), None)
                    if spot is None:
                        break
                    self.week.add_event(self.reqs[x], *spot)
                    new_places[x] = spot
                if len(new_places) != len(moved):
                    for x, spot in new_places.items():
                        self.week.remove_event(self.reqs[x], *spot)
                    self.week.remove_event(req, r_id, d, a, b)
                    for x, xp in moved:
                        self.week.add_event(self.reqs[x], *xp)
                    if old:
                        self.week.add_event(req, *old)
                    continue
                for x, spot in new_places.items():
                    self.placed[x] = spot
                    dx = decisions[x]
                    dx.update(room_id=spot[0], day=spot[1], start_period=spot[2], end_period=spot[3])
                    dx["reason"] += (f"; moved within its own requested window to {spot[0]} {spot[1]} "
                                     f"P{spot[2]}-P{spot[3]} so that {req['id']} could be approved")
                self.placed[req["id"]] = (r_id, d, a, b)
                dec.update(status="approved", room_id=r_id, day=d, start_period=a, end_period=b,
                           reason=(f"Approved. {self.priority_note(req)}. {r_id} fits inside the requested window "
                                   f"after {', '.join(blockers)} moved to another of its acceptable slots"))
                changed += [req["id"], *blockers]
                break
        return changed

    def suggestions(self, req, limit=8):
        """Ranked options for a draft: free slots inside the windows first (these would be approved), then nearby
        alternatives (these can only be offered as alternatives)."""
        dur = req["duration_periods"]
        inside = [{"room_id": r, "day": d, "start_period": a, "end_period": b, "kind": "inside_window"}
                  for (r, d, a, b) in self.free_slots(req)]
        inside.sort(key=lambda o: o["room_id"] != req.get("requested_room"))
        out = inside[:limit]
        if len(out) < limit:
            w0 = req["windows"][0]
            alts = []
            for r in self.eligible(req):
                for d in self.days:
                    for a in range(1, MAXP - dur + 2):
                        if self.week.blockers(req, r["id"], d, a, a + dur - 1):
                            continue
                        if any(w["day"] == d and w["from_period"] <= a and a + dur - 1 <= w["to_period"]
                               for w in req["windows"]):
                            continue
                        key = (not any(w["day"] == d for w in req["windows"]),
                               abs(self.days.index(d) - self.days.index(w0["day"])),
                               abs(a - w0["from_period"]), self.room_pref(req, r))
                        alts.append((key, {"room_id": r["id"], "day": d, "start_period": a,
                                           "end_period": a + dur - 1, "kind": "alternative"}))
            alts.sort(key=lambda t: t[0])
            out += [o for _, o in alts[: limit - len(out)]]
        return out

    # -- decision ------------------------------------------------------------------------------
    def decide(self, req, allow_displace=True, pending=None):
        rid = req["id"]
        self.seen[rid] = req
        eff = self.eff(req)
        note = self.priority_note(req)
        week, cands, order = self.week, self.cands, self.order
        el = sorted(self.eligible(req), key=lambda r: self.room_pref(req, r))
        dur = req["duration_periods"]
        found, status, reason, pre_added = None, None, None, False
        held = defaultdict(int)

        free = []
        for (r_id, d, a, b) in self.slots(req, el):
            bl = week.blockers(req, r_id, d, a, b)
            if not bl:
                free.append((r_id, d, a, b))
            for k, x in bl:
                held[x] += 1
        if free:
            found = self.least_harmful(req, free, pending or [])
        if found:
            status = "approved"
            reason = f"Approved. {note}. {found[0]} fits inside the requested window"
            if req.get("requested_room") and req["requested_room"] != found[0]:
                reason += f"; the requested room {req['requested_room']} was not suitable or free"

        if not found and el and allow_displace and order.index(eff) <= self.inst:
            # only an institute-level event may displace regular classes (relocated, never dropped)
            best = None
            for (r_id, d, a, b) in self.slots(req, el):
                bl = week.blockers(req, r_id, d, a, b)
                if bl and all(k == "class" and not week.sess[x].get("basket_slot") for k, x in bl):
                    victims = sorted({x for _, x in bl})
                    rr = next(r for r in el if r["id"] == r_id)
                    key = (len(victims), self.room_pref(req, rr), d, a)
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
                    self.overrides += [{"session_id": x, "day": week.pos[x][0], "start_period": week.pos[x][1],
                                        "room_id": week.pos[x][2], "displaced_by": rid} for x in victims]
                    reason = (f"Approved. {note}. {r_id} was in use by {len(victims)} regular class(es) "
                              f"({', '.join(victims)}), which were relocated for Week 7 only")
                else:
                    week.restore(snap)

        if not found:
            alt = None
            opts = self.later_options(pending) if pending else []
            for r in el:
                for d in self.days:
                    for a in range(1, MAXP - dur + 2):
                        if week.blockers(req, r["id"], d, a, a + dur - 1):
                            continue
                        w0 = req["windows"][0]
                        k = (self.harm((r["id"], d, a, a + dur - 1), opts),
                             not any(w["day"] == d for w in req["windows"]),
                             abs(self.days.index(d) - self.days.index(w0["day"])),
                             abs(a - w0["from_period"]), self.room_pref(req, r))
                        if alt is None or k < alt[0]:
                            alt = (k, r["id"], d, a, a + dur - 1)
            if alt:
                found = alt[1:]
                status = "alternative_offered"
                asked = ", ".join(f"{w['day']} P{w['from_period']}-P{w['to_period']}" for w in req["windows"])
                if not any(min(w["to_period"], MAXP) - w["from_period"] + 1 >= dur for w in req["windows"]):
                    why = (f"the requested window ({asked}) is too short for {dur} period(s) or runs past P{MAXP}, "
                           "the last event period")
                else:
                    why = f"no suitable room was free in the requested window ({asked})"
                    names = [self.label(x) for x in sorted({x for x in held})[:4]]
                    if names:
                        why += f"; it is held by {', '.join(names)}"
                # what stands between the request and the offered slot: the closer times that are already taken
                closer = []
                for r in el:
                    for d in self.days:
                        for a in range(1, MAXP - dur + 2):
                            bl = week.blockers(req, r["id"], d, a, a + dur - 1)
                            if not bl:
                                continue
                            k = (self.harm((r["id"], d, a, a + dur - 1), opts),
                                 not any(w["day"] == d for w in req["windows"]),
                                 abs(self.days.index(d) - self.days.index(req["windows"][0]["day"])),
                                 abs(a - req["windows"][0]["from_period"]), self.room_pref(req, r))
                            if k < alt[0]:
                                closer += [self.label(x) for kind, x in bl if kind in ("event", "class")]
                closer = list(dict.fromkeys(closer))[:3]
                reason = (f"Alternative offered. {note}. It cannot be approved as asked: {why}. "
                          f"Offered instead: {alt[2]} P{alt[3]}-P{alt[4]} in {alt[1]}"
                          + (f"; the closer times are taken by {', '.join(closer)}" if closer else ""))
            else:
                status = "rejected"
                reason = (f"Rejected. {note}. "
                          + (self.no_room_reason(req) or "No suitable room is free at any time that week "
                             "after higher-priority bookings and classes"))

        dec = {"request_id": rid, "status": status, "reason": reason,
               "effective_category": eff, "priority_rank": order.index(eff) + 1}
        if found and status != "rejected":
            r_id, d, a, b = found
            dec.update({"day": d, "start_period": a, "end_period": b, "room_id": r_id})
            if not pre_added:
                week.add_event(req, r_id, d, a, b)
            self.placed[rid] = (r_id, d, a, b)
            self.reqs[rid] = req
        return dec

    def place_existing(self, decision, req):
        """Register an already-decided event (approved or alternative) in the week view."""
        self.titles[req["id"]] = req["title"]
        if decision.get("status") in ("approved", "alternative_offered") and decision.get("room_id"):
            self.week.add_event(req, decision["room_id"], decision["day"], decision["start_period"],
                                decision["end_period"])


def evaluate_bookings(data, base):
    """Return (decisions in request order, week-7 session overrides, week-7 positions)."""
    D = Decider(data, base)
    decisions = {}
    ordered = sorted(data["booking_requests"], key=D.sort_key)
    for i, req in enumerate(ordered):
        if req["id"] in D.ctx.cancelled:
            decisions[req["id"]] = {"request_id": req["id"], "status": "rejected",
                                    "reason": "Request was cancelled by the requester, so it is not scheduled",
                                    "effective_category": D.eff(req), "priority_rank": None}
            continue
        later = [q for q in ordered[i + 1:] if q["id"] not in D.ctx.cancelled]
        decisions[req["id"]] = D.decide(req, pending=later)
    D.improve(decisions)
    return [decisions[r["id"]] for r in data["booking_requests"]], D.overrides, dict(D.week.pos)
