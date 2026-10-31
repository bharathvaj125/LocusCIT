"""Eligible (day, start_period, room) placements for each session."""
from collections import defaultdict


class Eligibility:
    def __init__(self, data):
        cal = data["calendar"]
        self.days = cal["days"]
        self.lab_starts = set(cal["lab_start_periods"])
        self.lunch = cal["lunch"]["after_period"]
        self.last = max(p["id"] for p in cal["periods"] if p["teaching"])
        self.rooms = {r["id"]: r for r in data["rooms"]}
        self.fac = {f["id"]: f for f in data["faculty"]}
        self.fac_un = defaultdict(set)
        for f in data["faculty"]:
            for u in f.get("unavailable", []):
                for p in u["periods"]:
                    self.fac_un[f["id"]].add((u["day"], p))
        self.room_un = defaultdict(set)
        for u in data.get("room_unavailability", []):
            for p in u["periods"]:
                self.room_un[u["room_id"]].add((u["day"], p))

    def starts_for(self, s):
        d = s["duration"]
        out = []
        for p in range(1, self.last - d + 2):
            per = range(p, p + d)
            if p <= self.lunch < p + d - 1:
                continue
            if s["kind"] == "lab" and p not in self.lab_starts:
                continue
            out.append(p)
        return out

    def rooms_for(self, s):
        return [r["id"] for r in self.rooms.values()
                if r["type"] in s["room_types"]
                and r["capacity"] >= s["size"]
                and (r["accessible"] or not s.get("needs_accessible"))]


def build_candidates(data):
    """sid -> list of (day, start, room). Raises if any session has none."""
    el = Eligibility(data)
    out, empty = {}, []
    for s in data["sessions"]:
        fx = s.get("fixed_slot")
        cands = []
        for rid in el.rooms_for(s):
            for day in el.days:
                for st in el.starts_for(s):
                    if fx and (fx["day"] != day or fx["start_period"] != st):
                        continue
                    per = range(st, st + s["duration"])
                    if any((day, p) in el.fac_un[s["faculty_id"]] for p in per):
                        continue
                    if any((day, p) in el.room_un[rid] for p in per):
                        continue
                    cands.append((day, st, rid))
        if not cands:
            empty.append(s["id"])
        out[s["id"]] = cands
    if empty:
        raise ValueError(f"Sessions with no eligible placement: {empty}")
    return out


def prune_rooms(data, cands, hint, k):
    """Keep, per session and time slot, the k smallest-capacity fitting rooms plus the hinted placement.

    Rooms that differ only by size matter little to the soft score (only S5) but multiply the model size.
    The hinted placement is always kept, so a feasible solution always remains available. k <= 0 disables.
    """
    if not k or k <= 0:
        return cands
    cap = {r["id"]: r["capacity"] for r in data["rooms"]}
    out = {}
    for sid, cl in cands.items():
        taken, res = defaultdict(int), []
        for c in sorted(cl, key=lambda x: (cap[x[2]], x[2])):
            if taken[c[0], c[1]] < k:
                taken[c[0], c[1]] += 1
                res.append(c)
        h = tuple(hint[sid]) if sid in hint else None
        if h and h not in res:
            res.append(h)
        out[sid] = res
    return out
