import importlib.util, threading, time, uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from .solver.baseline import solve_timetable
from .solver.export import timetable_export
from .state import WS, TEAM

router = APIRouter(prefix="/api")
_SP = Path(__file__).resolve().parents[2] / "starter_pack" / "validator.py"


def official_validator():
    spec = importlib.util.spec_from_file_location("official_validator", _SP)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def ok(data):
    return {"success": True, "data": data, "errors": []}


def fail(status, code, message, **extra):
    err = {"code": code, "message": message, "details": extra.get("details"),
           "rule_ids": extra.get("rule_ids", []), "related_entity_ids": extra.get("ids", [])}
    return JSONResponse(status_code=status, content={"success": False, "data": None, "errors": [err]})


@router.get("/health")
def health():
    return ok({"status": "ok", "version": "0.1.0", "dataset_id": WS.dataset["dataset_id"],
               "revision": WS.revision})


def _run_generate(job_id, time_limit):
    job = WS.jobs[job_id]
    start_rev = WS.revision
    t0 = time.time()
    try:
        status, assign = solve_timetable(WS.dataset, time_limit=time_limit)
        if assign is None:
            job.update(status="INFEASIBLE" if status == "INFEASIBLE" else "UNKNOWN",
                       error=f"Solver returned {status}")
            return
        sched = timetable_export(TEAM, WS.dataset["dataset_id"], assign)
        rep = official_validator().run(WS.dataset, sched)
        teaching = {k: v for k, v in rep["hard_by_rule"].items() if not k.startswith("E")}
        if teaching:
            job.update(status="FAILED_VALIDATION", error=f"Hard violations: {teaching}")
            return
        with WS.lock:
            if WS.revision != start_rev:
                job.update(status="STALE", error="Workspace changed while solving")
                return
            WS.schedule = assign
            WS.schedule_meta = {"solver_status": status, "soft_total": rep["soft_total"],
                                "soft_penalties": rep["soft_penalties"]}
            WS.revision += 1
        job.update(status="DONE", solver_status=status, soft_total=rep["soft_total"],
                   hard_violation_count=len(teaching), sessions=len(assign),
                   seconds=round(time.time() - t0, 1))
    except Exception as e:  # keep the job pollable
        job.update(status="ERROR", error=str(e))


@router.post("/schedules/generate", status_code=202)
def generate(time_limit: float = Query(60, ge=5, le=300)):
    if any(j["status"] == "RUNNING" for j in WS.jobs.values()):
        return fail(409, "INVALID_INPUT", "A generation job is already running")
    jid = uuid.uuid4().hex[:12]
    WS.jobs[jid] = {"job_id": jid, "status": "RUNNING"}
    threading.Thread(target=_run_generate, args=(jid, time_limit), daemon=True).start()
    return ok({"job_id": jid, "status": "RUNNING"})


@router.get("/jobs/{job_id}")
def job(job_id: str):
    j = WS.jobs.get(job_id)
    if not j:
        return fail(404, "INVALID_INPUT", "Unknown job")
    return ok(j)


@router.get("/schedules")
def schedules(view: str = Query("group", pattern="^(group|faculty|room)$"), id: str | None = None):
    if WS.schedule is None:
        return fail(404, "INVALID_INPUT", "No schedule generated yet")
    sess = {s["id"]: s for s in WS.dataset["sessions"]}
    rows = []
    for sid, (day, st, rid) in sorted(WS.schedule.items()):
        s = sess[sid]
        hit = (view == "group" and id in s["groups"]) or (view == "faculty" and id == s["faculty_id"]) \
            or (view == "room" and id == rid)
        if id is None or hit:
            rows.append({"session_id": sid, "course_id": s["course_id"], "kind": s["kind"],
                         "groups": s["groups"], "faculty_id": s["faculty_id"],
                         "basket_slot": s.get("basket_slot"), "day": day, "start_period": st,
                         "end_period": st + s["duration"] - 1, "room_id": rid})
    return ok({"view": view, "id": id, "dataset_id": WS.dataset["dataset_id"],
               "revision": WS.revision, "assignments": rows, "meta": WS.schedule_meta})
