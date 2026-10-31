"""Produce exports/schedule.json and exports/schedule_after.json by driving the real API in-process.

Nothing is hand-written: every file comes from the same endpoints the website uses
(generate -> exams -> bookings -> export -> propose sample disruption -> approve -> export),
then the unmodified official validator is run on both. Usage (from backend/):

    python scripts/generate_exports.py [optimise_seconds]
"""
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(tempfile.mkdtemp(), "export.db").replace("\\", "/")

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

SP = ROOT / "starter_pack"
OUT = ROOT / "exports"


def wait(c, h, url):
    while True:
        j = c.get(url, headers=h).json()["data"]
        if j["status"] not in ("RUNNING", "COMPUTING"):
            return j
        time.sleep(2)


def main():
    optimise = float(sys.argv[1]) if len(sys.argv) > 1 else 120
    OUT.mkdir(exist_ok=True)
    with TestClient(app) as c:
        def login(u, p):
            r = c.post("/api/auth/login", json={"username": u, "password": p}).json()["data"]["token"]
            return {"Authorization": "Bearer " + r}
        admin, admin2 = login("admin", "Admin@123"), login("admin2", "Admin@123")
        c.post("/api/admin/reset", headers=admin)
        job = c.post(f"/api/schedules/generate?time_limit={optimise}", headers=admin).json()["data"]["job_id"]
        j = wait(c, admin, f"/api/jobs/{job}")
        assert j["status"] == "DONE", j
        print("timetable:", {k: j[k] for k in ("solver_status", "soft_total", "seconds")})
        assert c.post("/api/exams/generate", headers=admin).status_code == 200
        assert c.post("/api/bookings/evaluate-batch", headers=admin).status_code == 200
        base = c.get("/api/exports/schedule", headers=admin)
        assert base.status_code == 200, base.text
        (OUT / "schedule.json").write_text(json.dumps(base.json(), indent=2), encoding="utf-8")

        dis = json.loads((SP / "examples" / "sample_disruption.json").read_text(encoding="utf-8"))
        pid = c.post("/api/disruptions/propose", json=dis, headers=admin).json()["data"]["proposal_id"]
        p = wait(c, admin, f"/api/proposals/{pid}")
        assert p["status"] == "PENDING", p
        print("repair:", {k: p[k] for k in ("moved_count", "lower_bound", "proven_minimum")})
        ap = c.post(f"/api/proposals/{pid}/approve", headers=admin2)      # a different Admin approves
        assert ap.status_code == 200, ap.text
        after = c.get("/api/exports/schedule-after", headers=admin)
        assert after.status_code == 200, after.text
        (OUT / "schedule_after.json").write_text(json.dumps(after.json(), indent=2), encoding="utf-8")

    data = str(SP / "data" / "cit_public.json")
    for args, rep in (([ "--schedule", str(OUT / "schedule.json")], "validation_report.json"),
                      (["--schedule", str(OUT / "schedule_after.json"), "--disruption",
                        str(SP / "examples" / "sample_disruption.json"), "--baseline", str(OUT / "schedule.json")],
                       "disruption_validation_report.json")):
        out = subprocess.run([sys.executable, str(SP / "validator.py"), "--data", data, *args, "--quiet",
                              "--json", str(OUT / rep)], capture_output=True, text=True).stdout
        print(out)


if __name__ == "__main__":
    main()
