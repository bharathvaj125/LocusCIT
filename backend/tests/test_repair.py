import json, pathlib, subprocess, sys, time
from fastapi.testclient import TestClient
from app.main import app

SP = pathlib.Path(__file__).resolve().parents[2] / "starter_pack"
c = TestClient(app)


def _wait(url, key="status", bad="RUNNING"):
    while True:
        j = c.get(url).json()["data"]
        if j[key] not in (bad, "COMPUTING"):
            return j
        time.sleep(1.5)


def test_sample_disruption_end_to_end(tmp_path):
    jid = c.post("/api/schedules/generate?time_limit=20").json()["data"]["job_id"]
    assert _wait(f"/api/jobs/{jid}")["status"] == "DONE"
    assert c.post("/api/exams/generate").status_code == 200
    assert c.post("/api/bookings/evaluate-batch").status_code == 200
    base = c.get("/api/exports/schedule").json()
    (tmp_path / "schedule.json").write_text(json.dumps(base))

    dis = json.loads((SP / "examples" / "sample_disruption.json").read_text())
    pid = c.post("/api/disruptions/propose", json=dis).json()["data"]["proposal_id"]
    p = _wait(f"/api/proposals/{pid}")
    assert p["status"] == "PENDING", p
    assert p["hard_violation_count"] == 0 and p["moved_count"] >= 1
    # nothing changes before approval
    assert c.get("/api/exports/schedule-after").status_code == 409
    assert c.post(f"/api/proposals/{pid}/approve").json()["data"]["status"] == "APPROVED"
    assert c.post(f"/api/proposals/{pid}/approve").status_code == 409   # cannot apply twice
    after = c.get("/api/exports/schedule-after").json()
    (tmp_path / "schedule_after.json").write_text(json.dumps(after))
    out = subprocess.run([sys.executable, str(SP / "validator.py"), "--data", str(SP / "data" / "cit_public.json"),
                          "--schedule", str(tmp_path / "schedule_after.json"), "--disruption",
                          str(SP / "examples" / "sample_disruption.json"), "--baseline",
                          str(tmp_path / "schedule.json"), "--quiet"], capture_output=True, text=True).stdout
    print(out)
    assert "Hard violations: 0" in out
    print("PROPOSAL moved", p["moved_count"], "lower bound", p["lower_bound"], "proven", p["proven_minimum"], p["strategy"])


def test_bad_change_file_is_rejected():
    r = c.post("/api/disruptions/propose", json={"changes": [{"type": "faculty_unavailable", "faculty_id": "NOPE",
                                                          "days": ["MON"], "periods": [1]}]})
    assert r.status_code in (409, 422)
