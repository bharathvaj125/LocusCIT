"""Exact CP-SAT encoding of the official soft penalties S1-S6 (validator.py soft_score)."""
from collections import defaultdict


def soft_objective(m, x, ctx, return_terms=False):
    """Return a linear expression equal to the validator's soft_total for the chosen placement."""
    data = ctx["data"]
    sessions = ctx["sessions"]
    days = data["calendar"]["days"]
    last = max(p["id"] for p in data["calendar"]["periods"] if p["teaching"])
    fac = {f["id"]: f for f in data["faculty"]}
    rooms = {r["id"]: r for r in data["rooms"]}
    terms = []

    # S1 (avoid preferences), S5 (<40% full), S6 (P9): fixed cost per candidate placement
    for (sid, c), v in x.items():
        s = sessions[sid]
        day, st, rid = c
        per = range(st, st + s["duration"])
        w = 0
        for pref in fac[s["faculty_id"]].get("preferences", []):
            if pref.get("type") == "avoid" and day in pref.get("days", days):
                w += 2 * sum(1 for p in per if p in pref["periods"])
        r = rooms[rid]
        if r["capacity"] and s["size"] / r["capacity"] < 0.4:
            w += 1
        if last in per:
            w += 1
        if w:
            terms.append(w * v)

    # per group-day occupancy (non-basket sessions plus shared basket slot), already 0/1
    occ = {}
    groups = sorted({g for g, _, _ in ctx["grp_occ"]})
    for g in groups:
        for d in days:
            for p in range(1, last + 1):
                lst = ctx["grp_occ"].get((g, d, p))
                if lst:
                    o = m.NewBoolVar(f"occ_{g}_{d}_{p}")
                    m.Add(o == sum(lst))
                    occ[g, d, p] = o

    for g in groups:
        for d in days:
            ps = [p for p in range(1, last + 1) if (g, d, p) in occ]
            if not ps:
                continue
            # S2: free periods between the first and last occupied period
            allp = range(1, last + 1)
            before = {p: m.NewBoolVar(f"bf_{g}_{d}_{p}") for p in allp}
            after = {p: m.NewBoolVar(f"af_{g}_{d}_{p}") for p in allp}
            for q in ps:
                for p in allp:
                    if q < p:
                        m.AddImplication(occ[g, d, q], before[p])
                    if q > p:
                        m.AddImplication(occ[g, d, q], after[p])
            for p in allp:
                gap = m.NewBoolVar(f"gap_{g}_{d}_{p}")
                here = occ[g, d, p] if (g, d, p) in occ else 0
                m.Add(gap >= before[p] + after[p] - here - 1)
                terms.append(gap)
            # S3: more than 6 occupied hours
            ex = m.NewIntVar(0, len(ps), f"ex_{g}_{d}")
            m.Add(ex >= sum(occ[g, d, p] for p in ps) - 6)
            terms.append(3 * ex)

    # S4: same group, same course, several lectures on one day (non-basket lectures)
    by_gc = defaultdict(list)
    for (sid, c), v in x.items():
        s = sessions[sid]
        if s["kind"] == "lecture" and not s.get("basket_slot"):
            for g in s["groups"]:
                by_gc[g, c[0], s["course_id"]].append(v)
    for key, vs in by_gc.items():
        if len(vs) > 1:
            ex = m.NewIntVar(0, len(vs), f"s4_{key}")
            m.Add(ex >= sum(vs) - 1)
            terms.append(3 * ex)
    # S4 (basket flavour): same course in several basket sessions on one day
    by_c = defaultdict(list)
    for (sid, c), v in x.items():
        s = sessions[sid]
        if s.get("basket_slot"):
            by_c[s["course_id"], c[0]].append(v)
    for key, vs in by_c.items():
        if len(vs) > 1:
            ex = m.NewIntVar(0, len(vs), f"s4b_{key}")
            m.Add(ex >= sum(vs) - 1)
            terms.append(3 * ex)

    return sum(terms) if terms else 0
