"""Two-phase timetable generation: feasible first, then optimise the official soft penalty."""
import time

from ..core.official import official_validator
from .baseline import solve_timetable
from . import config
from .candidates import build_candidates, prune_rooms
from .export import timetable_export
from .soft import soft_objective


def _check(data, assign):
    rep = official_validator().run(data, timetable_export("x", data["dataset_id"], assign))
    hard = {k: v for k, v in rep["hard_by_rule"].items() if not k.startswith("E")}
    return hard, rep["soft_total"], rep["soft_penalties"]


def generate_timetable(data, feasible_limit=60.0, optimize_limit=60.0, seed=1, workers=None, on_feasible=None):
    """Return (status, assignment|None, info). The returned assignment is always validator-clean."""
    t0 = time.time()
    cands = build_candidates(data)
    status, assign = solve_timetable(data, time_limit=feasible_limit, seed=seed, workers=workers, candidates=cands)
    if assign is None:
        return status, None, {"phase": "feasibility", "seconds": round(time.time() - t0, 1)}
    hard, soft, pen = _check(data, assign)
    if hard:
        return "FAILED_VALIDATION", None, {"hard": hard}
    best, best_soft, best_pen, best_status = assign, soft, pen, status
    info = {"feasible_soft": soft}
    if on_feasible:
        on_feasible(assign, {"solver_status": status, "soft_total": soft, "soft_penalties": pen})
    if optimize_limit > 0:
        small = prune_rooms(data, cands, assign, config.prune_rooms())
        st2, a2 = solve_timetable(data, time_limit=optimize_limit, seed=seed, workers=workers,
                                  candidates=small, hint=assign, objective=soft_objective)
        if a2 is not None:
            h2, s2, p2 = _check(data, a2)
            if not h2 and s2 <= best_soft:         # only ever keep a validator-verified improvement
                best, best_soft, best_pen, best_status = a2, s2, p2, st2
    info.update(soft_total=best_soft, soft_penalties=best_pen, solver_status=best_status,
                seconds=round(time.time() - t0, 1))
    return best_status, best, info
