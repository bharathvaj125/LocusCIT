"""Solver settings that depend on the host.

SOLVER_WORKERS      CP-SAT worker threads. Default: CPU count (max 8). Use 1 on a small free instance.
OPTIMISE_SECONDS    default wall-clock budget for the soft-penalty optimiser.
FEASIBLE_SECONDS    wall-clock budget for finding the first valid timetable.

Measured on the CIT dataset (one worker): the model below finds a valid timetable in ~3-4 CPU seconds
(the default settings need ~20) and the optimiser reaches a soft penalty of ~12 in 60 CPU seconds,
where default settings made no progress. Wall time on a throttled host is CPU time divided by its CPU share.
"""
import os


def workers():
    try:
        w = int(os.getenv("SOLVER_WORKERS", ""))
        if w > 0:
            return w
    except ValueError:
        pass
    return max(1, min(8, os.cpu_count() or 1))


def optimise_seconds():
    return float(os.getenv("OPTIMISE_SECONDS", "90"))


def feasible_seconds():
    return float(os.getenv("FEASIBLE_SECONDS", "180"))


def prune_rooms():
    """Rooms kept per slot when optimising (0 = keep all). Smaller is faster and uses less memory."""
    try:
        return int(os.getenv("PRUNE_ROOMS", "6"))
    except ValueError:
        return 6


def tune_timetable(params):
    """Presolve/probing/symmetry search costs far more than it saves on this model."""
    params.cp_model_presolve = False
    params.linearization_level = 0
    params.cp_model_probing_level = 0
    params.symmetry_level = 0
