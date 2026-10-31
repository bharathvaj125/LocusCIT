import pathlib
from app.core.dataset import load_dataset
from app.solver.baseline import solve_timetable
from app.solver.bookings import evaluate_bookings
from app.solver.export import timetable_export
from app.core.official import official_validator

SP = pathlib.Path(__file__).resolve().parents[2] / "starter_pack"


def test_booking_decisions_are_valid_and_prioritised():
    data = load_dataset(SP / "data" / "cit_public.json")
    _, base = solve_timetable(data, time_limit=60)
    dec, ov, _ = evaluate_bookings(data, base)
    assert len(dec) == len(data["booking_requests"]) == 25
    by = {d["request_id"]: d for d in dec}
    assert by["BR-04"]["status"] == "rejected"              # cancelled never approved
    assert by["BR-09"]["status"] == "rejected"              # no venue seats 1200
    assert by["BR-15"]["effective_category"] == "club_event"  # role cap beats requested category
    keys = ("request_id", "status", "day", "start_period", "end_period", "room_id", "reason")
    fest = {"bookings": [{k: v for k, v in d.items() if k in keys} for d in dec], "session_overrides": ov}
    rep = official_validator().run(data, timetable_export("t", data["dataset_id"], base, fest_week=fest))
    hard = [v for v in rep["hard_violations"] if v["where"] != "exams" and not v["rule"].startswith("E")]
    assert hard == [], hard
    assert rep["bookings"]["priority_inversions"] == []
    assert rep["warnings"] == []
