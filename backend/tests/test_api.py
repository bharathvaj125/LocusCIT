import time
from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)


def test_health():
    r = c.get("/api/health").json()
    assert r["success"] and r["data"]["dataset_id"] == "cit-public-v1"


def test_generate_then_read():
    assert c.get("/api/schedules").status_code == 404
    jid = c.post("/api/schedules/generate?time_limit=60").json()["data"]["job_id"]
    for _ in range(120):
        j = c.get(f"/api/jobs/{jid}").json()["data"]
        if j["status"] != "RUNNING":
            break
        time.sleep(2)
    assert j["status"] == "DONE", j
    assert j["sessions"] == 189 and j["hard_violation_count"] == 0
    rows = c.get("/api/schedules?view=group&id=Y1-A").json()["data"]["assignments"]
    assert rows and all("Y1-A" in r["groups"] for r in rows)
