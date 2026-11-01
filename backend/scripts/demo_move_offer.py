"""Walk through the move-offer flow in-process (fresh sqlite, real API and solver) and print every step.

A is flexible (two acceptable windows) and already confirmed. B can only use A's slot. B asks A to move; A agrees; an
approver applies both changes together. Then the declined and the not-answered paths. Run: python backend/scripts/demo_move_offer.py
"""
import os
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(tempfile.mkdtemp(), "demo.db").replace("\\", "/")
os.environ["SEED_SECOND_ADMIN"] = "true"      # a different Admin approves; the real app creates one under Users
os.environ["JWT_SECRET"] = "demo"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


def slot(p):
    return f"{p['room_id']} {p['day']} P{p['start_period']}-P{p['end_period']}" if p else "none"


def main():
    with TestClient(app) as c:
        def login(u, p):
            return {"Authorization": "Bearer " + c.post("/api/auth/login", json={"username": u, "password": p}).json()["data"]["token"]}
        admin, admin2, club, fac = login("admin", "Admin@123"), login("admin2", "Admin@123"), login("club", "Club@123"), login("faculty", "Faculty@123")
        c.post("/api/admin/reset", headers=admin)
        jid = c.post("/api/schedules/generate?time_limit=0", headers=admin).json()["data"]["job_id"]
        while c.get(f"/api/jobs/{jid}", headers=admin).json()["data"]["status"] in ("RUNNING", "COMPUTING"):
            time.sleep(1)
        c.post("/api/exams/generate", headers=admin)
        c.post("/api/bookings/evaluate-batch", headers=admin)

        def free(day, a, b):
            r = c.get(f"/api/campus/availability?day={day}&start={a}&end={b}&events_only=false", headers=admin).json()["data"]
            return any(x["id"] == "AUD" and x["free"] for x in r["rooms"])
        days = [d for d in ("MON", "TUE", "WED", "THU", "FRI") if free(d, 10, 11)]
        d1, d2 = days[0], days[1]

        def draft(title, windows, mode="any"):
            return {"title": title, "attendance": 300, "duration_periods": 2, "needs": [], "room_types": ["auditorium"],
                    "windows": [{"day": d, "from_period": 10, "to_period": 11} for d in windows], "day_mode": mode,
                    "requested_room": "AUD", "requested_category": "club_event", "mandatory_for_groups": []}

        def sub(h, d):
            return c.post("/api/bookings/submit", json=d, headers=h).json()["data"]["submissions"][0]

        def get(h, sid):
            return next(s for s in c.get("/api/bookings", headers=h).json()["data"]["submitted"] if s["id"] == sid)

        print(f"1. A (club, flexible: {d1} or {d2} evening) submits; an approver confirms it")
        a = sub(club, draft("A: Annual gala", [d1, d2]))
        print("   proposed:", slot(a["placement"]))
        r = c.post(f"/api/bookings/{a['id']}/decision", json={"action": "approve"}, headers=admin)
        print("   approver ->", r.json()["data"]["status"], slot(r.json()["data"]["placement"]))
        a_old = r.json()["data"]["placement"]

        print(f"2. B (faculty, can only do {a_old['day']} evening) submits the same hall")
        b = sub(fac, draft("B: Guest convocation", [a_old["day"]]))
        print("   proposal:", b["proposed"]["status"], slot(b["placement"]), "-> A keeps its confirmed slot:", get(admin, a["id"])["status"])

        print("3. B asks: can someone make room?")
        opts = c.get(f"/api/bookings/{b['id']}/negotiation-options", headers=fac).json()["data"]
        print("   options:", [(o["holder"]["id"], slot(o["holder_would_move_to"]) if "holder_would_move_to" in o else o.get("a_to")) for o in opts["options"]] if "options" in opts else opts)
        neg = c.post(f"/api/bookings/{b['id']}/negotiate", json={}, headers=fac)
        n = neg.json()["data"]
        print("   offer sent to the holder:", n["status"], "| B is now", get(admin, b["id"])["status"], "| A is still", get(admin, a["id"])["status"], slot(get(admin, a["id"])["placement"]))

        print("4. A agrees to move")
        r = c.post(f"/api/negotiations/{n['id']}/respond", json={"accept": True}, headers=club)
        print("   ->", r.json()["data"]["status"], "| nothing applied yet:", slot(get(admin, a["id"])["placement"]), "| B:", get(admin, b["id"])["status"])

        print("5. B cannot approve itself; an approver can")
        print("   B tries:", c.post(f"/api/bookings/{b['id']}/decision", json={"action": "approve"}, headers=fac).status_code)
        r = c.post(f"/api/bookings/{b['id']}/decision", json={"action": "approve"}, headers=admin)
        print("   approver ->", r.status_code, r.json()["data"]["status"] if r.status_code == 200 else r.json()["errors"][0]["message"])
        A, B = get(admin, a["id"]), get(admin, b["id"])
        print("   A now:", A["status"], slot(A["placement"]), "| B now:", B["status"], slot(B["placement"]))
        print("   A still inside its own windows:", any(w["day"] == A["placement"]["day"] for w in A["request"]["windows"]))
        wk = c.get("/api/schedules/week7?view=room&id=AUD", headers=admin).json()["data"]["events"]
        print("   Week 7 grid for AUD holds both:", sorted((e["id"], e["day"], e["start"]) for e in wk if e["id"] in (a["id"], b["id"])))
        rep = c.get("/api/exports/report", headers=admin).json()["data"]["schedule"]
        print("   official validator on the export: hard", rep["hard_violation_count"], "| inversions", rep["bookings"]["priority_inversions"])

        print("6. Declined offer: the holder keeps the booking, the requester stays where it was")
        d3 = [d for d in days if d not in (a_old["day"], A["placement"]["day"])]
        if d3:
            a2 = sub(club, draft("A2", [d3[0], a_old["day"]]))
            c.post(f"/api/bookings/{a2['id']}/decision", json={"action": "approve"}, headers=admin)
            hold = get(admin, a2["id"])["placement"]
            b2 = sub(fac, draft("B2", [hold["day"]]))
            n2 = c.post(f"/api/bookings/{b2['id']}/negotiate", json={}, headers=fac)
            if n2.status_code == 200:
                c.post(f"/api/negotiations/{n2.json()['data']['id']}/respond", json={"accept": False}, headers=club)
                print("   A2 after decline:", get(admin, a2["id"])["status"], slot(get(admin, a2["id"])["placement"]), "| B2:", get(admin, b2["id"])["status"])
            else:
                print("   (no offer possible here:", n2.json()["errors"][0]["message"], ")")


if __name__ == "__main__":
    main()
