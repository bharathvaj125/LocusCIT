"""Disruption proposals: compute a pending repair, show the diff, apply only on approval."""
import threading
import time
import uuid

from fastapi import APIRouter, Body, Depends

from .api import fail, ok, official_validator
from .solver.bookings import evaluate_bookings
from .solver.export import timetable_export
from .solver.repair import ChangeFileError, apply_changes, repair
from .auth import current_user, require
from .state import TEAM, WS

router = APIRouter(prefix="/api")


def _public(p):
    return {k: v for k, v in p.items() if not k.startswith("_")}


def _compute(pid, changes, time_limit, restrict=None):
    p = WS.proposals[pid]
    try:
        after = apply_changes(WS.dataset, changes)
        res = repair(after, WS.schedule, time_limit=time_limit, restrict=restrict)
        if res["status"] != "OK":
            p.update(status=res["status"], message=res["message"], diagnostics=res.get("diagnostics", []),
                     moved=[], moved_count=0, new_sessions=res.get("new_sessions", []),
                     removed_sessions=res.get("removed_sessions", []), seconds=res.get("seconds"))
            return
        sched = timetable_export(TEAM, after["dataset_id"], res["assignment"])
        rep = official_validator().run(after, sched, baseline=timetable_export(
            TEAM, after["dataset_id"], WS.schedule))
        hard = [v for v in rep["hard_violations"] if not v["rule"].startswith("E")]
        if hard:
            p.update(status="FAILED_VALIDATION", message="Proposed repair failed the hard-rule check",
                     diagnostics=hard[:10], moved=[], moved_count=0)
            return
        p.update(status="PENDING", message="Awaiting Admin approval", moved=res["moved"],
                 moved_count=res["moved_count"], directly_affected=res["directly_affected"],
                 new_sessions=res["new_sessions"], removed_sessions=res["removed_sessions"],
                 added=[{"session_id": sid, "new": {"day": res["assignment"][sid][0], "start_period": res["assignment"][sid][1],
                                                     "room_id": res["assignment"][sid][2]}} for sid in res["new_sessions"]],
                 proven_minimum=res["proven_minimum"], lower_bound=res["lower_bound"],
                 strategy=res["strategy"], seconds=res["seconds"],
                 hard_violation_count=0, soft_total=rep["soft_total"],
                 changes_requested=changes["changes"], _after=after, _assignment=res["assignment"])
    except ChangeFileError as e:
        p.update(status="INVALID", message=str(e), moved=[], moved_count=0)
    except Exception as e:  # keep the proposal pollable
        p.update(status="ERROR", message=str(e), moved=[], moved_count=0)
    finally:
        WS.save()


@router.post("/disruptions/propose", status_code=202)
def propose(changes: dict = Body(...), time_limit: float = 60, user=Depends(require("admin"))):
    if WS.schedule is None:
        return fail(409, "INVALID_INPUT", "Generate the timetable before proposing a disruption")
    try:  # fail fast on malformed files instead of creating a doomed proposal
        from .solver.repair import validate_changes
        import copy
        validate_changes(copy.deepcopy(WS.dataset), copy.deepcopy(changes))
    except ChangeFileError as e:
        return fail(422, "INVALID_INPUT", str(e))
    pid = uuid.uuid4().hex[:10]
    WS.proposals[pid] = {"proposal_id": pid, "type": "disruption", "status": "COMPUTING",
                         "base_schedule_version": WS.schedule_version,
                         "dataset_version": WS.dataset["dataset_id"], "requested_by": user["username"],
                         "approved_by": None, "created_at": time.time(), "approved_at": None}
    threading.Thread(target=_compute, args=(pid, changes, min(max(time_limit, 10), 120)), daemon=True).start()
    return ok({"proposal_id": pid, "status": "COMPUTING"})


@router.get("/proposals", dependencies=[Depends(require("admin"))])
def proposals():
    return ok({"proposals": [_public(p) | {"moved": None} for p in WS.proposals.values()]})


@router.get("/proposals/{pid}", dependencies=[Depends(require("admin"))])
def proposal(pid: str):
    p = WS.proposals.get(pid)
    if not p:
        return fail(404, "INVALID_INPUT", "Unknown proposal")
    return ok(_public(p))


@router.post("/proposals/{pid}/approve")
def approve(pid: str, user=Depends(require("admin"))):
    p = WS.proposals.get(pid)
    if not p:
        return fail(404, "INVALID_INPUT", "Unknown proposal")
    with WS.lock:
        if p["status"] != "PENDING":
            return fail(409, "INVALID_INPUT", f"Proposal is {p['status']}, only PENDING proposals can be approved")
        if p.get("requested_by") == user["username"]:
            return fail(403, "FORBIDDEN", "You cannot approve your own request; ask another Admin")
        if p["base_schedule_version"] != WS.schedule_version:
            p["status"] = "STALE"
            return fail(409, "STALE_PROPOSAL", "The timetable changed after this proposal was made; propose again")
        after, assign = p["_after"], p["_assignment"]
        sched = timetable_export(TEAM, after["dataset_id"], assign)
        rep = official_validator().run(after, sched)
        hard = [v for v in rep["hard_violations"] if not v["rule"].startswith("E")]
        if hard:
            return fail(500, "CONSTRAINT_VIOLATION", "Re-check before applying found hard violations",
                        details=hard[:10], rule_ids=sorted({v["rule"] for v in hard}))
        if WS.baseline is None:
            WS.baseline = dict(WS.schedule)
            # keep the official baseline export (and the dataset it belongs to) exactly as it was before any change
            if WS.bookings is not None and WS.exams is not None:
                keys = ("request_id", "status", "day", "start_period", "end_period", "room_id", "reason")
                WS.baseline_export = timetable_export(
                    TEAM, WS.dataset["dataset_id"], WS.schedule,
                    fest_week={"bookings": [{k: v for k, v in d.items() if k in keys} for d in WS.bookings["decisions"]],
                               "session_overrides": WS.bookings["overrides"]},
                    exams=WS.exams)
                WS.baseline_dataset = WS.dataset
        WS.dataset = after
        WS.schedule = dict(assign)
        WS.schedule_version += 1
        WS.revision += 1
        WS.applied.append(pid)
        from .api_bookings import reconcile_after_timetable_change
        reconcile_after_timetable_change()
        p.update(status="APPROVED", message="Approved and applied", approved_by=user["username"], approved_at=time.time(),
                 hard_validation_result="0 hard violations")
    return ok(_public(p))


@router.post("/proposals/{pid}/reject")
def reject(pid: str, user=Depends(require("admin"))):
    p = WS.proposals.get(pid)
    if not p:
        return fail(404, "INVALID_INPUT", "Unknown proposal")
    with WS.lock:
        if p["status"] not in ("PENDING", "INFEASIBLE", "UNKNOWN", "FAILED_VALIDATION"):
            return fail(409, "INVALID_INPUT", f"Proposal is {p['status']}")
        p["status"] = "REJECTED"
        p["rejected_by"] = user["username"]
    return ok(_public(p))


@router.get("/exports/schedule-after", dependencies=[Depends(require("admin"))])
def export_after():
    from fastapi.responses import JSONResponse
    if not WS.applied or WS.baseline is None:
        return fail(409, "INVALID_INPUT", "No approved disruption has been applied yet")
    fest = None
    if WS.bookings:
        keys = ("request_id", "status", "day", "start_period", "end_period", "room_id", "reason")
        fest = {"bookings": [{k: v for k, v in d.items() if k in keys} for d in WS.bookings["decisions"]],
                "session_overrides": WS.bookings["overrides"]}
    sched = timetable_export(TEAM, WS.dataset["dataset_id"], WS.schedule, fest_week=fest, exams=WS.exams)
    rep = official_validator().run(WS.dataset, sched, baseline=timetable_export(
        TEAM, WS.dataset["dataset_id"], WS.baseline))
    if rep["hard_violation_count"]:
        return fail(500, "CONSTRAINT_VIOLATION", "Export failed official validation",
                    details=rep["hard_violations"][:10], rule_ids=sorted(rep["hard_by_rule"]))
    return JSONResponse(content=sched)


def _brief(rep):
    b = rep.get("bookings") or {}
    return {"hard_violation_count": rep["hard_violation_count"], "hard_by_rule": rep.get("hard_by_rule", {}),
            "hard_violations": rep["hard_violations"][:5],
            "soft_total": rep["soft_total"], "soft_penalties": rep["soft_penalties"],
            "exam_soft_penalty": rep.get("exam_soft_penalty"),
            "bookings": {"score": b.get("booking_score"), "max": b.get("booking_score_max_if_all_approved"),
                         "approved": b.get("approved"), "alternatives": b.get("alternatives"), "rejected": b.get("rejected"),
                         "priority_inversions": len(b.get("priority_inversions", [])),
                         "inversions": b.get("priority_inversions", [])[:5]} if b else None,
            "stability": rep.get("stability")}


@router.get("/exports/report", dependencies=[Depends(require("admin"))])
def export_report():
    """What the official validator says about each export right now, so it can be read without a terminal."""
    from .api import _fest_week
    V = official_validator()
    schedule = after = None
    baseline_missing = bool(WS.applied) and WS.baseline_export is None
    if WS.applied and WS.baseline_export is not None:
        schedule = _brief(V.run(WS.baseline_dataset, WS.baseline_export))
        schedule["sessions"] = len(WS.baseline_export["sessions"])
    elif not baseline_missing and WS.schedule is not None and WS.bookings is not None and WS.exams is not None:
        sched = timetable_export(TEAM, WS.dataset["dataset_id"], WS.schedule, fest_week=_fest_week(), exams=WS.exams)
        schedule = _brief(V.run(WS.dataset, sched))
        schedule["sessions"] = len(sched["sessions"])
    if WS.applied and WS.baseline is not None and WS.schedule is not None:
        sched = timetable_export(TEAM, WS.dataset["dataset_id"], WS.schedule,
                                 fest_week=_fest_week() if WS.bookings else None, exams=WS.exams)
        after = _brief(V.run(WS.dataset, sched, baseline=timetable_export(TEAM, WS.dataset["dataset_id"], WS.baseline)))
        after["sessions"] = len(sched["sessions"])
    return ok({"schedule": schedule, "schedule_after": after, "applied_disruptions": len(WS.applied), "baseline_missing": baseline_missing})
