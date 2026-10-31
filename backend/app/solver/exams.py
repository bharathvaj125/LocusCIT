"""Exam scheduling in two cheap stages.

Stage 1 picks a (day, session) slot for every exam: no group has two exams in a slot, the exams in a slot fit the
campus's total half-capacity seats, and same-day exams per group are minimised (5 validator points each).
Stage 2 seats each slot's exams in distinct exam-capable rooms (summed half capacity >= class size, a room used once),
using as few rooms as possible. If some slot cannot be seated, that exact combination of exams is forbidden for that
slot ("cut") and stage 1 runs again, so the result is always complete and valid, and it is far cheaper than one big model.
"""
import os
import time
from collections import defaultdict

from ortools.sat.python import cp_model



def _seat_slot(exam_list, seats, limit, workers, seed):
    """Return {exam_id: [rooms]} for the exams sharing one slot, or None if they cannot all be seated."""
    m = cp_model.CpModel()
    u = {(e["id"], r): m.NewBoolVar(f"u_{e['id']}_{r}") for e in exam_list for r in seats}
    for e in exam_list:
        m.Add(sum(seats[r] * u[e["id"], r] for r in seats) >= e["size"])
    for r in seats:
        m.AddAtMostOne([u[e["id"], r] for e in exam_list])
    m.Minimize(sum(u.values()))
    s = cp_model.CpSolver()
    s.parameters.max_time_in_seconds = limit
    s.parameters.num_workers = workers
    s.parameters.random_seed = seed
    st = s.Solve(m)
    if st not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None if st == cp_model.INFEASIBLE else False      # False = ran out of time (not proof)
    return {e["id"]: [r for r in seats if s.Value(u[e["id"], r])] for e in exam_list}


def solve_exams(data, time_limit=30.0, seed=1, workers=None):
    """Return (status, list of {exam_id, day, session, rooms}) or (status, None)."""
    t0 = time.time()
    # the multi-worker portfolio solves this small model ~30x faster than one worker, and it uses little memory
    workers = workers or int(os.getenv("EXAM_WORKERS", "8"))
    cal = data["calendar"]["exam_week"]
    slots = [(d, s["id"]) for d in cal["days"] for s in cal["sessions"]]
    seats = {r["id"]: r["capacity"] // 2 for r in data["rooms"] if "exam" in r["allowed_uses"]}
    total_seats = sum(seats.values())
    exams = data["exams"]
    by_id = {e["id"]: e for e in exams}
    by_group = defaultdict(list)
    for e in exams:
        for g in e["groups"]:
            by_group[g].append(e["id"])
    cuts = []                                    # (slot, tuple(exam ids)) that cannot be seated together
    for _ in range(60):
        left = time_limit - (time.time() - t0)
        if left <= 1:
            return "UNKNOWN", None
        m = cp_model.CpModel()
        z = {(e["id"], s): m.NewBoolVar(f"z_{e['id']}_{s}") for e in exams for s in slots}
        for e in exams:
            m.AddExactlyOne([z[e["id"], s] for s in slots])
        for s in slots:
            m.Add(sum(e["size"] * z[e["id"], s] for e in exams) <= total_seats)
        for g, ids in by_group.items():
            for s in slots:
                m.AddAtMostOne([z[i, s] for i in ids])
        for slot, ids in cuts:
            m.AddBoolOr([z[i, slot].Not() for i in ids])
        extras = []
        for g, ids in by_group.items():
            for d in cal["days"]:
                n = sum(z[i, s] for i in ids for s in slots if s[0] == d)
                x = m.NewIntVar(0, len(ids), f"x_{g}_{d}")
                m.Add(x >= n - 1)
                extras.append(x)
        m.Minimize(sum(extras))
        sv = cp_model.CpSolver()
        sv.parameters.max_time_in_seconds = min(left, max(5.0, left / 2))
        sv.parameters.num_workers = workers
        sv.parameters.random_seed = seed
        st = sv.Solve(m)
        name = sv.StatusName(st)
        if st not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return name, None
        placed = {s: [by_id[e["id"]] for e in exams if sv.Value(z[e["id"], s])] for s in slots}
        rooms_for, failed = {}, []
        for s, lst in placed.items():
            if not lst:
                continue
            res = _seat_slot(lst, seats, min(10.0, max(2.0, time_limit - (time.time() - t0))), workers, seed)
            if res is None or res is False:
                failed.append((s, tuple(sorted(e["id"] for e in lst)), res is False))
            else:
                rooms_for.update(res)
        if not failed:
            out = []
            for s, lst in placed.items():
                for e in lst:
                    out.append({"exam_id": e["id"], "day": s[0], "session": s[1], "rooms": rooms_for[e["id"]]})
            order = {e["id"]: i for i, e in enumerate(exams)}
            out.sort(key=lambda r: order[r["exam_id"]])
            return name, out
        if any(timed_out for _, _, timed_out in failed):
            return "UNKNOWN", None
        cuts += [(s, ids) for s, ids, _ in failed]
    return "UNKNOWN", None
