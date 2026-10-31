import importlib.util, threading, time, uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from .solver.baseline import solve_timetable
from .solver.exams import solve_exams
from .solver.bookings import evaluate_bookings
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


@router.post("/exams/generate")
def exams_generate(time_limit: float = Query(30, ge=5, le=120)):
    status, out = solve_exams(WS.dataset, time_limit=time_limit)
    if out is None:
        code = "SOLVER_INFEASIBLE" if status == "INFEASIBLE" else "SOLVER_TIMEOUT"
        return fail(422, code, f"Exam solver returned {status}")
    sched = timetable_export(TEAM, WS.dataset["dataset_id"], WS.schedule or {}, exams=out)
    rep = official_validator().run(WS.dataset, sched)
    exam_v = [v for v in rep["hard_violations"] if v["rule"].startswith("E") or v["where"] == "exams"]
    if exam_v:
        return fail(500, "CONSTRAINT_VIOLATION", "Generated exams failed validation",
                    details=exam_v[:10], rule_ids=sorted({v["rule"] for v in exam_v}))
    with WS.lock:
        WS.exams = out
        WS.revision += 1
    return ok({"status": status, "count": len(out), "exam_soft_penalty": rep.get("exam_soft_penalty"),
               "hard_violation_count": 0})


@router.get("/exams")
def exams_list(group: str | None = None):
    if WS.exams is None:
        return fail(404, "INVALID_INPUT", "No exam schedule generated yet")
    info = {e["id"]: e for e in WS.dataset["exams"]}
    rows = []
    for x in WS.exams:
        e = info[x["exam_id"]]
        if group and group not in e["groups"]:
            continue
        rooms = {r["id"]: r for r in WS.dataset["rooms"]}
        rows.append({**x, "course_ids": e["course_ids"], "groups": e["groups"], "size": e["size"],
                     "seats": sum(rooms[r]["capacity"] // 2 for r in x["rooms"])})
    return ok({"exams": rows, "revision": WS.revision})


def _fest_week():
    keys = ("request_id", "status", "day", "start_period", "end_period", "room_id", "reason")
    return {"bookings": [{k: v for k, v in d.items() if k in keys} for d in WS.bookings["decisions"]],
            "session_overrides": WS.bookings["overrides"]}


@router.post("/bookings/evaluate-batch")
def bookings_evaluate():
    if WS.schedule is None:
        return fail(409, "INVALID_INPUT", "Generate the timetable before evaluating bookings")
    decisions, overrides, _ = evaluate_bookings(WS.dataset, WS.schedule)
    prev = WS.bookings
    WS.bookings = {"decisions": decisions, "overrides": overrides}
    sched = timetable_export(TEAM, WS.dataset["dataset_id"], WS.schedule, fest_week=_fest_week())
    rep = official_validator().run(WS.dataset, sched)
    hard = [v for v in rep["hard_violations"] if not v["rule"].startswith("E") and v["where"] != "exams"]
    if hard:
        WS.bookings = prev
        return fail(500, "CONSTRAINT_VIOLATION", "Booking decisions failed validation",
                    details=hard[:10], rule_ids=sorted({v["rule"] for v in hard}))
    with WS.lock:
        WS.revision += 1
    return ok({"decisions": decisions, "session_overrides": overrides, "booking_score": rep["bookings"]["booking_score"],
               "booking_score_max_if_all_approved": rep["bookings"]["booking_score_max_if_all_approved"],
               "priority_inversions": rep["bookings"]["priority_inversions"], "revision": WS.revision})


@router.get("/bookings")
def bookings_list():
    reqs = {r["id"]: r for r in WS.dataset["booking_requests"]}
    decisions = {d["request_id"]: d for d in (WS.bookings or {}).get("decisions", [])}
    rows = [{"request": r, "decision": decisions.get(r["id"])} for r in reqs.values()]
    return ok({"requests": rows, "decided": WS.bookings is not None, "revision": WS.revision})


@router.get("/exports/schedule")
def export_schedule():
    if WS.schedule is None or WS.bookings is None or WS.exams is None:
        return fail(409, "INVALID_INPUT", "Generate timetable, exams and booking decisions first",
                    details={"timetable": WS.schedule is not None, "exams": WS.exams is not None,
                             "bookings": WS.bookings is not None})
    sched = timetable_export(TEAM, WS.dataset["dataset_id"], WS.schedule,
                             fest_week=_fest_week(), exams=WS.exams)
    rep = official_validator().run(WS.dataset, sched)
    if rep["hard_violation_count"]:
        return fail(500, "CONSTRAINT_VIOLATION", "Export failed official validation",
                    details=rep["hard_violations"][:10], rule_ids=sorted(rep["hard_by_rule"]))
    return JSONResponse(content=sched)
