"""Exam scheduling: one (day, session) slot plus a set of exam-capable rooms per exam."""
from collections import defaultdict
from ortools.sat.python import cp_model


def solve_exams(data, time_limit=30.0, seed=1, workers=8):
    """Return (status, list of {exam_id, day, session, rooms}) or (status, None)."""
    cal = data["calendar"]["exam_week"]
    slots = [(d, s["id"]) for d in cal["days"] for s in cal["sessions"]]
    rooms = [r for r in data["rooms"] if "exam" in r["allowed_uses"]]
    seats = {r["id"]: r["capacity"] // 2 for r in rooms}
    exams = data["exams"]
    m = cp_model.CpModel()

    z = {(e["id"], s): m.NewBoolVar(f"z_{e['id']}_{s}") for e in exams for s in slots}
    u = {(e["id"], r, s): m.NewBoolVar(f"u_{e['id']}_{r}_{s}")
         for e in exams for r in seats for s in slots}
    for e in exams:
        m.AddExactlyOne([z[e["id"], s] for s in slots])
        for s in slots:
            for r in seats:
                m.AddImplication(u[e["id"], r, s], z[e["id"], s])
            # enough half-capacity seats whenever the exam sits in this slot
            m.Add(sum(seats[r] * u[e["id"], r, s] for r in seats) >= e["size"]).OnlyEnforceIf(z[e["id"], s])
    for s in slots:
        for r in seats:
            m.AddAtMostOne([u[e["id"], r, s] for e in exams])
    by_group = defaultdict(list)
    for e in exams:
        for g in e["groups"]:
            by_group[g].append(e["id"])
    for g, ids in by_group.items():
        for s in slots:
            m.AddAtMostOne([z[i, s] for i in ids])

    # soft: a group should not have two exams on the same day (5 points each in the validator)
    extras = []
    for g, ids in by_group.items():
        for d in cal["days"]:
            n = sum(z[i, s] for i in ids for s in slots if s[0] == d)
            x = m.NewIntVar(0, len(ids), f"x_{g}_{d}")
            m.Add(x >= n - 1)
            extras.append(x)
    m.Minimize(1000 * sum(extras) + sum(u.values()))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.num_workers = workers
    solver.parameters.random_seed = seed
    st = solver.Solve(m)
    name = solver.StatusName(st)
    if st not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return name, None
    out = []
    for e in exams:
        slot = next(s for s in slots if solver.Value(z[e["id"], s]))
        used = [r for r in seats if solver.Value(u[e["id"], r, slot])]
        out.append({"exam_id": e["id"], "day": slot[0], "session": slot[1], "rooms": used})
    return name, out
