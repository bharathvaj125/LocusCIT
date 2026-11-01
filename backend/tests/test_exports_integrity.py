import json
from pathlib import Path

import pytest

from conftest import wait

SAMPLE = json.loads((Path(__file__).resolve().parents[2] / "starter_pack" / "examples" / "sample_disruption.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def flow(client, admin, admin2):
    client.post("/api/admin/reset", headers=admin)
    jid = client.post("/api/schedules/generate?time_limit=0", headers=admin).json()["data"]["job_id"]
    assert wait(client, admin, f"/api/jobs/{jid}")["status"] == "DONE"
    assert client.post("/api/exams/generate", headers=admin).status_code == 200
    assert client.post("/api/bookings/evaluate-batch", headers=admin).status_code == 200
    before = client.get("/api/exports/schedule", headers=admin).json()
    pid = client.post("/api/disruptions/propose", json=SAMPLE, headers=admin).json()["data"]["proposal_id"]
    assert wait(client, admin, f"/api/proposals/{pid}")["status"] == "PENDING"
    assert client.post(f"/api/proposals/{pid}/approve", headers=admin2).status_code == 200
    return before


def test_schedule_json_stays_the_original_189_sessions_after_a_change(client, admin, flow):
    again = client.get("/api/exports/schedule", headers=admin).json()
    assert len(flow["sessions"]) == 189 and again == flow            # byte-for-byte the file produced before the change
    assert len(flow["exams"]) == 41


def test_schedule_after_json_is_the_repaired_190_sessions_and_both_files_agree_with_the_page(client, admin, flow):
    after = client.get("/api/exports/schedule-after", headers=admin).json()
    assert len(after["sessions"]) == 190 and "CS202-T2" in {s["session_id"] for s in after["sessions"]}
    assert "CS202-T2" not in {s["session_id"] for s in flow["sessions"]}
    rep = client.get("/api/exports/report", headers=admin).json()["data"]
    assert rep["schedule"]["sessions"] == 189 and rep["schedule_after"]["sessions"] == 190      # the page counts the files, not the live timetable
    assert rep["schedule"]["hard_violation_count"] == 0 and rep["schedule_after"]["hard_violation_count"] == 0
    assert rep["schedule_after"]["stability"]["sessions_moved"] >= 1


def test_a_missing_original_is_refused_not_replaced_by_the_changed_timetable(client, admin, flow):
    from app.state import WS
    saved = WS.baseline_export
    WS.baseline_export = None
    try:
        r = client.get("/api/exports/schedule", headers=admin)
        assert r.status_code == 409 and "Reset demo data" in r.json()["errors"][0]["message"]
        assert client.get("/api/exports/report", headers=admin).json()["data"]["baseline_missing"] is True
    finally:
        WS.baseline_export = saved
