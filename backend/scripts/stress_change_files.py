"""Apply judge-style change files through the running app and check every result with the official validator.

Usage:  python backend/scripts/stress_change_files.py [case numbers, e.g. 01 05 09]
        API=https://locuscit.onrender.com python backend/scripts/stress_change_files.py 01

The backend must be running. It is RESET for every case, so do not point this at a demo you want to keep.
For each case: reset, generate the timetable, export schedule.json, propose the change as `admin`, try to approve it as
`admin` (must be refused), approve it as `admin2`, export schedule_after.json, then run validator.py with
--disruption and --baseline. A summary is printed per case and written to a temporary folder.
"""
import copy
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

B = os.getenv("API", "http://localhost:8000")
ROOT = Path(__file__).resolve().parents[2]
OUT = Path(tempfile.mkdtemp(prefix="locus-stress-"))
data = json.load(open(ROOT / "starter_pack" / "data" / "cit_public.json", encoding="utf-8"))
sess = {s["id"]: s for s in data["sessions"]}
ALL = list(range(1, 10))


def call(path, body=None, tok=None, method=None):
    req = urllib.request.Request(B + path, data=json.dumps(body).encode() if body is not None else None, method=method,
                                 headers={"Content-Type": "application/json", **({"Authorization": "Bearer " + tok} if tok else {})})
    try:
        r = urllib.request.urlopen(req, timeout=900)
        return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.load(e)
        except Exception:
            return e.code, {}


def login(u, p):
    return call("/api/auth/login", {"username": u, "password": p})[1]["data"]["token"]


def new_session(sid, base_id, **over):
    s = copy.deepcopy(sess[base_id])
    s["id"] = sid
    s.update(over)
    return s


sample = json.load(open(ROOT / "starter_pack" / "examples" / "sample_disruption.json", encoding="utf-8"))
WEEK = ["MON", "TUE", "WED", "THU", "FRI"]
CASES = {
    "01 official sample file": sample,
    "02 two teachers unavailable, partial days": {"changes": [
        {"type": "faculty_unavailable", "faculty_id": "F01", "days": ["TUE", "WED"], "periods": ALL, "reason": "Medical leave"},
        {"type": "faculty_unavailable", "faculty_id": "F36", "days": ["THU"], "periods": [1, 2, 3, 4, 5], "reason": "Exam duty"}]},
    "03 big lecture hall closed all week": {"changes": [
        {"type": "room_unavailable", "room_id": "LH-1", "days": WEEK, "periods": ALL, "reason": "Roof repair"}]},
    "04 lab closed all week": {"changes": [
        {"type": "room_unavailable", "room_id": "CS-LAB-1", "days": WEEK, "periods": ALL, "reason": "Power upgrade"}]},
    "05 add a teacher and a new session": {"changes": [
        {"type": "add_faculty", "faculty": {"id": "F99", "name": "Dr. New Joiner", "department": "CSE", "max_hours_per_day": 4,
                                            "needs_accessible": False, "unavailable": [], "preferences": []}},
        {"type": "add_session", "session": new_session("CSE201-X-L9", "MA101-CD-L3", faculty_id="F99", groups=["CSE-2"], size=60, duration=1)}]},
    "06 new session pinned to a slot": {"changes": [
        {"type": "add_session", "session": new_session("MA101-X-L8", "MA101-CD-L3", groups=["Y1-A"], size=60,
                                                       fixed_slot={"day": "WED", "start_period": 3})}]},
    "07 remove several sessions": {"changes": [
        {"type": "remove_session", "session_id": "MA101-CD-L3"}, {"type": "remove_session", "session_id": list(sess)[40]},
        {"type": "remove_session", "session_id": list(sess)[90]}]},
    "08 combination": {"changes": [
        {"type": "faculty_unavailable", "faculty_id": "F06", "days": ["FRI"], "periods": ALL, "reason": "Conference"},
        {"type": "room_unavailable", "room_id": "CR-105", "days": ["MON", "TUE"], "periods": [1, 2, 3, 4, 5], "reason": "Painting"},
        {"type": "add_session", "session": new_session("MA101-X-L7", "MA101-CD-L3", groups=["Y1-B"], size=60)},
        {"type": "remove_session", "session_id": list(sess)[10]}]},
    "09 several rooms closed on one day": {"changes": [
        {"type": "room_unavailable", "room_id": r, "days": ["WED"], "periods": ALL, "reason": "Campus event"} for r in ("CR-101", "CR-103", "LH-2", "LH-3")]},
    "10 teacher unavailable most of the week (must be reported as impossible)": {"changes": [
        {"type": "faculty_unavailable", "faculty_id": "F02", "days": ["MON", "TUE", "WED", "THU"], "periods": ALL, "reason": "Sabbatical"}]},
    "11 extra fields and no reason": {"id": "x", "description": "d", "dataset": "cit-public-v1", "changes": [
        {"type": "faculty_unavailable", "faculty_id": "F07", "days": ["MON"], "periods": [1], "extra": 1}]},
}


def main():
    only = sys.argv[1:] or [c.split()[0] for c in CASES]
    a1, a2 = login("admin", "Admin@123"), login("admin2", "Admin@123")
    for name, chg in CASES.items():
        pre = name.split()[0]
        if pre not in only:
            continue
        t0 = time.time()
        call("/api/admin/reset", {}, a1, "POST")
        jid = call("/api/schedules/generate", {}, a1, "POST")[1]["data"]["job_id"]
        while call(f"/api/jobs/{jid}", tok=a1)[1]["data"]["status"] in ("RUNNING", "COMPUTING"):
            time.sleep(4)
        call("/api/exams/generate", {}, a1, "POST")
        call("/api/bookings/evaluate-batch", {}, a1, "POST")
        base = call("/api/exports/schedule", tok=a1)[1]
        json.dump(base, open(OUT / f"{pre}_schedule.json", "w"))
        json.dump(chg, open(OUT / f"{pre}_change.json", "w"))
        s, r = call("/api/disruptions/propose", chg, a1, "POST")
        row = {"case": name, "propose_http": s}
        if s != 202:
            row["error"] = (r.get("errors") or [{}])[0].get("message")
            print(json.dumps(row), flush=True)
            continue
        pid = r["data"]["proposal_id"]
        while True:
            p = call(f"/api/proposals/{pid}", tok=a1)[1]["data"]
            if p["status"] != "COMPUTING":
                break
            time.sleep(2)
        row.update(status=p["status"], moved=p.get("moved_count"), lower_bound=p.get("lower_bound"),
                   proven_minimum=p.get("proven_minimum"), message=(p.get("message") or "")[:160])
        if p["status"] == "PENDING":
            row["own_approval_http"] = call(f"/api/proposals/{pid}/approve", {}, a1, "POST")[0]      # expect 403
            row["second_admin_http"] = call(f"/api/proposals/{pid}/approve", {}, a2, "POST")[0]      # expect 200
            after = call("/api/exports/schedule-after", tok=a1)[1]
            row["schedule_json_still_baseline"] = call("/api/exports/schedule", tok=a1)[1]["sessions"] == base["sessions"]
            json.dump(after, open(OUT / f"{pre}_after.json", "w"))
            out = subprocess.run([sys.executable, str(ROOT / "starter_pack" / "validator.py"), "--data",
                                  str(ROOT / "starter_pack" / "data" / "cit_public.json"), "--schedule", str(OUT / f"{pre}_after.json"),
                                  "--disruption", str(OUT / f"{pre}_change.json"), "--baseline", str(OUT / f"{pre}_schedule.json")],
                                 capture_output=True, text=True).stdout
            row["validator"] = [ln.strip() for ln in out.splitlines() if ln.startswith(("Hard", "Soft", "Stability", "Bookings"))]
        row["seconds"] = int(time.time() - t0)
        print(json.dumps(row), flush=True)
    print("files kept in", OUT)


if __name__ == "__main__":
    main()
