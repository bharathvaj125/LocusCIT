"""CP-SAT timetable model: hard constraints H1-H14, optional soft objective."""
from collections import defaultdict
from ortools.sat.python import cp_model

from .candidates import build_candidates


def solve_timetable(data, time_limit=60.0, seed=1, workers=8, hint=None,
                    candidates=None, fixed=None, objective=None):
    """Return (status_name, assignment | None). assignment: sid -> (day, start, room).

    fixed:     sid -> (day, start, room) forced placements (used by repair).
    objective: optional callback(model, x, ctx) -> linear expr to minimise.
    """
    cands = candidates or build_candidates(data)
    sessions = {s["id"]: s for s in data["sessions"]}
    fac = {f["id"]: f for f in data["faculty"]}
    m = cp_model.CpModel()

    x = {}
    for sid, cl in cands.items():
        if fixed and sid in fixed:
            cl = [c for c in cl if c == tuple(fixed[sid])]
            if not cl:
                return "INFEASIBLE", None
        for c in cl:
            x[sid, c] = m.NewBoolVar(f"x_{sid}_{c[0]}_{c[1]}_{c[2]}")
        m.AddExactlyOne([x[sid, c] for c in cl])

    room_occ, fac_occ = defaultdict(list), defaultdict(list)
    grp_occ = defaultdict(list)           # (g, day, p) -> vars (non-basket sessions)
    fac_day = defaultdict(list)           # (f, day) -> (duration, var)
    by_basket = defaultdict(list)
    for (sid, c), v in x.items():
        s = sessions[sid]
        day, st, rid = c
        per = range(st, st + s["duration"])
        for p in per:
            room_occ[rid, day, p].append(v)
            fac_occ[s["faculty_id"], day, p].append(v)
            if not s.get("basket_slot"):
                for g in s["groups"]:
                    grp_occ[g, day, p].append(v)
        fac_day[s["faculty_id"], day].append((s["duration"], v))
        if s.get("basket_slot"):
            by_basket[s["basket_slot"]].append((sid, c, v))

    for vs in room_occ.values():
        if len(vs) > 1:
            m.AddAtMostOne(vs)
    for vs in fac_occ.values():
        if len(vs) > 1:
            m.AddAtMostOne(vs)
    for (f, day), lst in fac_day.items():
        mx = fac[f].get("max_hours_per_day", 4)
        if sum(d for d, _ in lst) > mx:
            m.Add(sum(d * v for d, v in lst) <= mx)

    # elective baskets: one shared (day, start); basket occupies groups once
    basket_cover = defaultdict(list)       # (basket, g, day, p) -> t vars covering
    t = {}
    for b, lst in by_basket.items():
        times = sorted({(c[0], c[1]) for _, c, _ in lst})
        sess_in = {sid for sid, _, _ in lst}
        dur = max(sessions[sid]["duration"] for sid in sess_in)
        groups = set().union(*[set(sessions[sid]["groups"]) for sid in sess_in])
        for tm in times:
            t[b, tm] = m.NewBoolVar(f"t_{b}_{tm[0]}_{tm[1]}")
        m.AddExactlyOne([t[b, tm] for tm in times])
        for sid in sess_in:
            for tm in times:
                vs = [v for s2, c, v in lst if s2 == sid and (c[0], c[1]) == tm]
                m.Add(sum(vs) == t[b, tm]) if vs else m.Add(t[b, tm] == 0)
        for tm in times:
            day, st = tm
            for p in range(st, st + dur):
                for g in groups:
                    grp_occ[g, day, p].append(t[b, tm])
    for vs in grp_occ.values():
        if len(vs) > 1:
            m.AddAtMostOne(vs)

    ctx = {"sessions": sessions, "cands": cands, "t": t, "by_basket": by_basket,
           "data": data, "grp_occ": grp_occ}
    if objective:
        m.Minimize(objective(m, x, ctx))
    if hint:
        for (sid, c), v in x.items():
            m.AddHint(v, 1 if tuple(hint.get(sid, ())) == c else 0)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.num_workers = workers
    solver.parameters.random_seed = seed
    status = solver.Solve(m)
    name = solver.StatusName(status)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return name, None
    assign = {}
    for (sid, c), v in x.items():
        if solver.Value(v):
            assign[sid] = c
    return name, assign
