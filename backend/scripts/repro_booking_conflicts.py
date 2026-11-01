"""Reproduce booking-conflict behaviour in-process (fresh sqlite, real API, real solver).

Usage: python backend/scripts/repro_booking_conflicts.py
Prints what the engine does today for: pending requests that want the same room, a lower-priority request approved
first, an alternative that is approved and accepted/declined, and a request that is rejected after a decline.
"""
import os
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(tempfile.mkdtemp(), "repro.db").replace("\\", "/")
os.environ["SEED_SECOND_ADMIN"] = "true"      # a different Admin approves; the real app creates one under Users
os.environ["JWT_SECRET"] = "repro"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


def draft(title, n, day, f, t, room=None, types=None, cat="club_event", needs=None):
    return {"title": title, "attendance": n, "duration_periods": t - f + 1, "windows": [{"day": day, "from_period": f, "to_period": t}],
            "needs": needs or [], "room_types": types or ["seminar_hall"], "requested_room": room, "requested_category": cat,
            "mandatory_for_groups": []}


def main():
    with TestClient(app) as c:
        def login(u, p):
            return {"Authorization": "Bearer " + c.post("/api/auth/login", json={"username": u, "password": p}).json()["data"]["token"]}
        admin, admin2, coord, club, fac = (login("admin", "Admin@123"), login("admin2", "Admin@123"), login("coordinator", "Coord@123"),
                                           login("club", "Club@123"), login("faculty", "Faculty@123"))
        c.post("/api/admin/reset", headers=admin)
        jid = c.post("/api/schedules/generate?time_limit=0", headers=admin).json()["data"]["job_id"]
        while c.get(f"/api/jobs/{jid}", headers=admin).json()["data"]["status"] in ("RUNNING", "COMPUTING"):
            time.sleep(1)
        c.post("/api/bookings/evaluate-batch", headers=admin)

        def sub(h, d):
            r = c.post("/api/bookings/submit", json=d, headers=h)
            assert r.status_code == 200, r.text
            return r.json()["data"]["submissions"][0]

        def show(tag, s):
            print(f"  {tag}: {s['status']} proposed={s['proposed']['status']} {s.get('placement') and (s['placement']['room_id'], s['placement']['day'], s['placement']['start_period'])}")

        print("A. a club asks first, then a higher-priority department event wants the same only-possible slot (OAT is not seminar_hall: use both SHs)")
        # fill every seminar hall at the window except one by approved bookings is expensive; use a single-room window instead
        club_d = draft("Club quiz", 90, "WED", 12, 13, room="SH-1", types=["seminar_hall"])
        dept_d = draft("Dept seminar", 90, "WED", 12, 13, room="SH-1", types=["seminar_hall"], cat="department_event")
        # block SH-2 in that window so that SH-1 is the only choice
        blocker = c.post("/api/events/manual", headers=admin, json={"title": "Blocker", "room_id": "SH-2", "day": "WED", "start_period": 12, "end_period": 13, "attendance": 10, "requested_category": "institute_event"})
        print("  blocker SH-2 WED P12-13:", blocker.status_code)
        s1 = sub(club, club_d)
        show("club (earlier, lower priority)", s1)
        s2 = sub(coord, dept_d)
        show("coordinator dept event (later, HIGHER priority)", s2)
        print("  -> the club request still shows the slot as approvable:", c.get("/api/bookings", headers=admin).json()["data"]["submitted"][0]["proposed"]["status"])
        r = c.post(f"/api/bookings/{s1['id']}/decision", json={"action": "approve"}, headers=admin)
        print("  admin approves the LOWER one first ->", r.status_code, r.json()["data"]["status"] if r.status_code == 200 else r.json()["errors"][0]["message"][:120])
        r = c.post(f"/api/bookings/{s2['id']}/decision", json={"action": "approve"}, headers=admin2)
        print("  then the HIGHER one ->", r.status_code, "" if r.status_code == 200 else r.json()["errors"][0]["message"][:150])

        print("B. approving a proposal that is only an alternative (outside the requested window)")
        full = draft("Fest dinner", 300, "THU", 10, 11, types=["auditorium"], cat="club_event")
        s3 = sub(club, full)
        show("club asks the auditorium THU P10-11", s3)
        if s3["proposed"]["status"] == "alternative_offered":
            r = c.post(f"/api/bookings/{s3['id']}/decision", json={"action": "approve"}, headers=admin)
            print("  admin presses Approve ->", r.status_code, (r.json()["data"]["status"] if r.status_code == 200 else r.json()["errors"][0]["message"][:140]))
            if r.status_code == 200:
                r2 = c.post(f"/api/bookings/{s3['id']}/respond", json={"accept": False}, headers=club)
                print("  requester DECLINES ->", r2.status_code, r2.json()["data"]["status"], "|", (r2.json()["data"].get("decision_reason") or "")[:100])


if __name__ == "__main__":
    main()
