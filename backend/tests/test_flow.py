"""Full workflow through the API as real logged-in users, checked by the official validator CLI."""
import json
import pathlib
import subprocess
import sys

from conftest import wait

SP = pathlib.Path(__file__).resolve().parents[2] / "starter_pack"


def test_generate_exams_bookings_export_disruption(client, admin, admin2, tmp_path):
    assert client.post("/api/admin/reset", headers=admin).status_code == 200
    assert client.get("/api/schedules?view=room&id=AUD", headers=admin).status_code == 404

    jid = client.post("/api/schedules/generate?time_limit=0", headers=admin).json()["data"]["job_id"]
    j = wait(client, admin, f"/api/jobs/{jid}")
    assert j["status"] == "DONE" and j["sessions"] == 189 and j["hard_violation_count"] == 0
    rows = client.get("/api/schedules?view=group&id=Y1-A", headers=admin).json()["data"]["assignments"]
    assert rows and all("Y1-A" in r["groups"] for r in rows)

    assert client.post("/api/exams/generate", headers=admin).status_code == 200
    r = client.post("/api/bookings/evaluate-batch", headers=admin).json()["data"]
    assert r["priority_inversions"] == []
    base = client.get("/api/exports/schedule", headers=admin).json()
    (tmp_path / "schedule.json").write_text(json.dumps(base))

    dash = client.get("/api/dashboard", headers=admin).json()["data"]
    assert dash["sessions_scheduled"] == 189 and dash["hard_violation_count"] == 0
    assert dash["exams_scheduled"] == 41 and dash["ready_for_export"]

    dis = json.loads((SP / "examples" / "sample_disruption.json").read_text())
    pid = client.post("/api/disruptions/propose", json=dis, headers=admin).json()["data"]["proposal_id"]
    p = wait(client, admin, f"/api/proposals/{pid}")
    assert p["status"] == "PENDING", p
    assert p["hard_violation_count"] == 0 and p["moved_count"] >= 1
    assert client.get("/api/exports/schedule-after", headers=admin).status_code == 409   # nothing applied yet
    assert client.post(f"/api/proposals/{pid}/approve", headers=admin).status_code == 403  # no self-approval
    assert client.post(f"/api/proposals/{pid}/approve", headers=admin2).json()["data"]["status"] == "APPROVED"
    assert client.post(f"/api/proposals/{pid}/approve", headers=admin2).status_code == 409  # not twice

    (tmp_path / "schedule_after.json").write_text(json.dumps(client.get("/api/exports/schedule-after", headers=admin).json()))
    out = subprocess.run([sys.executable, str(SP / "validator.py"), "--data", str(SP / "data" / "cit_public.json"),
                          "--schedule", str(tmp_path / "schedule_after.json"), "--disruption",
                          str(SP / "examples" / "sample_disruption.json"), "--baseline",
                          str(tmp_path / "schedule.json"), "--quiet"], capture_output=True, text=True).stdout
    print(out)
    assert "Hard violations: 0" in out


def test_malformed_change_file_rejected_without_state_change(client, admin):
    r = client.post("/api/disruptions/propose", headers=admin, json={"changes": [
        {"type": "faculty_unavailable", "faculty_id": "NOPE", "days": ["MON"], "periods": [1]}]})
    assert r.status_code == 422
    r = client.post("/api/disruptions/propose", headers=admin, json={"changes": [{"type": "explode"}]})
    assert r.status_code == 422
