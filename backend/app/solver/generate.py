"""Two-phase timetable generation: feasible first, then optimise the official soft penalty."""
import time

from ..core.official import official_validator
from .baseline import solve_timetable
from . import config
from .candidates import build_candidates, prune_rooms
from .export import timetable_export
from .known import known_solution
from .soft import soft_objective


def protected_slots(data):
    """(room, day, period) cells that an institute-level event can only get in one specific room, at one exact time.

    Keeping regular classes out of those cells costs almost nothing in the timetable but avoids having to
    displace a class later, so the event can be approved in full instead of being offered an alternative.
    """
    V = official_validator()
    order = data["priority_order"]
    inst = order.index("institute_event")
    cancelled = {c["request_id"] for c in data.get("cancellations", [])}
    prot = set()
    for r in data["booking_requests"]:
        if r["id"] in cancelled or order.index(V.effective_category(data, r)) > inst:
            continue
        eligible = [room for room in data["rooms"]
                    if "event" in room["allowed_uses"] and room["type"] in r["room_types"]
                    and room["capacity"] >= r["attendance"]
                    and not set(r["needs"]) - (set(room["features"]) | ({"accessible"} if room["accessible"] else set()))]
        if len(eligible) != 1:
            continue
        for w in r["windows"]:
            if w["to_period"] - w["from_period"] + 1 == r["duration_periods"]:
                for pd in range(w["from_period"], min(w["to_period"], 9) + 1):
                    prot.add((eligible[0]["id"], w["day"], pd))
    return prot


def _objective_with_protection(prot):
    def objective(m, x, ctx):
        base = soft_objective(m, x, ctx)
        sess = ctx["sessions"]
        hits = [v for (sid, c), v in x.items()
                if any((c[2], c[0], pd) in prot for pd in range(c[1], c[1] + sess[sid]["duration"]))]
        return base + sum(hits)
    return objective


def _check(data, assign):
    rep = official_validator().run(data, timetable_export("x", data["dataset_id"], assign))
    hard = {k: v for k, v in rep["hard_by_rule"].items() if not k.startswith("E")}
    return hard, rep["soft_total"], rep["soft_penalties"]


def generate_timetable(data, feasible_limit=60.0, optimize_limit=60.0, seed=1, workers=None, on_feasible=None):
    """Return (status, assignment|None, info). The returned assignment is always validator-clean."""
    t0 = time.time()
    cands = build_candidates(data)
    assign, warm = None, False
    saved = known_solution(data) if config.warm_start() else None
    if saved:                                    # the saved best for this exact dataset, accepted only if the official validator agrees
        hard, soft, pen = _check(data, saved)
        if not hard:
            assign, status, warm = saved, "FEASIBLE", True
    if assign is None:
        status, assign = solve_timetable(data, time_limit=feasible_limit, seed=seed, workers=workers, candidates=cands)
        if assign is None:
            return status, None, {"phase": "feasibility", "seconds": round(time.time() - t0, 1)}
        hard, soft, pen = _check(data, assign)
        if hard:
            return "FAILED_VALIDATION", None, {"hard": hard}
    best, best_soft, best_pen, best_status = assign, soft, pen, status
    info = {"feasible_soft": soft, "warm_start": warm}
    if on_feasible:
        on_feasible(assign, {"solver_status": status, "soft_total": soft, "soft_penalties": pen, "warm_start": warm})
    if optimize_limit > 0:
        small = prune_rooms(data, cands, assign, config.prune_rooms())
        st2, a2 = solve_timetable(data, time_limit=optimize_limit, seed=seed, workers=workers,
                                  candidates=small, hint=assign,
                                  objective=_objective_with_protection(protected_slots(data)))
        if a2 is not None:
            h2, s2, p2 = _check(data, a2)
            if not h2 and s2 <= best_soft:         # only ever keep a validator-verified improvement
                best, best_soft, best_pen, best_status = a2, s2, p2, st2
    info.update(soft_total=best_soft, soft_penalties=best_pen, solver_status=best_status,
                seconds=round(time.time() - t0, 1))
    return best_status, best, info
