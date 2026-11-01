"""The saved best timetable is only a starting point: used when it matches the dataset and the validator agrees, ignored otherwise."""
import copy
import json
import pathlib
import time

from conftest import wait

from app.core.dataset import load_dataset
from app.solver import generate as G
from app.solver.known import known_solution

ROOT = pathlib.Path(__file__).resolve().parents[2]
DS = load_dataset(ROOT / "starter_pack" / "data" / "cit_public.json")


def test_saved_timetable_matches_only_the_exact_dataset():
    assert known_solution(DS) is not None and len(known_solution(DS)) == 189
    edited = copy.deepcopy(DS)
    edited["rooms"][0]["capacity"] += 1
    assert known_solution(edited) is None
    fewer = copy.deepcopy(DS)
    fewer["sessions"] = fewer["sessions"][:-1]
    assert known_solution(fewer) is None


def test_warm_start_is_validated_and_reaches_the_optimum_quickly():
    t0 = time.time()
    status, assign, info = G.generate_timetable(DS, feasible_limit=60, optimize_limit=40, workers=1)
    assert assign is not None and len(assign) == 189 and info["warm_start"] is True
    assert info["soft_total"] == 3 and info["feasible_soft"] == 3
    assert time.time() - t0 < 40


def test_a_saved_timetable_the_validator_rejects_is_ignored(monkeypatch):
    bad = {sid: (d, s, r) for sid, (d, s, r) in known_solution(DS).items()}
    a, b = list(bad)[:2]
    bad[b] = bad[a]                                   # two sessions in the same room and period
    monkeypatch.setattr(G, "known_solution", lambda data: bad)
    status, assign, info = G.generate_timetable(DS, feasible_limit=60, optimize_limit=0, workers=1)
    assert assign is not None and info["warm_start"] is False and info["feasible_soft"] > 3      # solved from scratch


def test_switch_off_solves_from_scratch(monkeypatch):
    monkeypatch.setenv("WARM_START", "false")
    status, assign, info = G.generate_timetable(DS, feasible_limit=60, optimize_limit=0, workers=1)
    assert assign is not None and info["warm_start"] is False


def test_the_app_reports_a_warm_start_and_the_timetable_is_valid(client, admin):
    client.post("/api/admin/reset", headers=admin)
    jid = client.post("/api/schedules/generate", headers=admin).json()["data"]["job_id"]
    j = wait(client, admin, f"/api/jobs/{jid}")
    assert j["status"] == "DONE" and j["warm_start"] is True and j["soft_total"] == 3 and j["hard_violation_count"] == 0
    dash = client.get("/api/dashboard", headers=admin).json()["data"]
    assert dash["sessions_scheduled"] == 189 and dash["hard_violation_count"] == 0
