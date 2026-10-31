"""Flexible-slot allocation: requests with several acceptable windows are placed so that more of them can be approved.

The tests use the single outdoor venue (OAT) on an empty timetable, so every conflict is a conflict between events.
"""
import copy
import pathlib

from app.core.dataset import load_dataset
from app.core.official import official_validator
from app.solver.bookings import Decider, evaluate_bookings
from app.solver.export import timetable_export

SP = pathlib.Path(__file__).resolve().parents[2] / "starter_pack"
DATA = load_dataset(SP / "data" / "cit_public.json")


def req(rid, windows, ts, role="club", cat="club_event", dur=2, room="OAT"):
    return {"id": rid, "submitted_at": f"2027-02-0{ts}T10:00:00+05:30", "requester": rid, "role": role,
            "department": None, "requested_category": cat, "title": rid, "attendance": 20, "duration_periods": dur,
            "windows": windows, "room_types": ["outdoor"], "needs": [], "requested_room": room,
            "mandatory_for_groups": [], "series_id": None, "raw_text": ""}


def win(day, a, b):
    return {"day": day, "from_period": a, "to_period": b}


def run(reqs, cancelled=()):
    data = copy.deepcopy(DATA)
    data["booking_requests"] = reqs
    data["cancellations"] = [{"request_id": c} for c in cancelled]
    dec, ov, _ = evaluate_bookings(data, {})
    return data, {d["request_id"]: d for d in dec}


def slot(d):
    return d["day"], d["start_period"], d["end_period"], d["room_id"]


def official_ok(data, by):
    keys = ("request_id", "status", "day", "start_period", "end_period", "room_id", "reason")
    fest = {"bookings": [{k: v for k, v in d.items() if k in keys} for d in by.values()], "session_overrides": []}
    rep = official_validator().run(data, timetable_export("t", data["dataset_id"], {}, fest_week=fest))
    return [v for v in rep["hard_violations"] if v["where"] == "fest_week"], rep["bookings"]


def test_two_flexible_requests_do_not_collide():
    a = req("A", [win("MON", 9, 12)], 1)
    b = req("B", [win("MON", 9, 12)], 2)
    data, by = run([a, b])
    assert by["A"]["status"] == by["B"]["status"] == "approved"
    assert slot(by["A"]) != slot(by["B"])
    hard, stats = official_ok(data, by)
    assert hard == [] and stats["priority_inversions"] == []


def test_flexible_request_steps_aside_for_a_fixed_one():
    a = req("A", [win("MON", 9, 10), win("MON", 11, 12)], 1)         # earlier, flexible: could take either
    b = req("B", [win("MON", 9, 10)], 2)                              # later, fixed
    data, by = run([a, b])
    assert by["A"]["status"] == "approved" and by["B"]["status"] == "approved"
    assert slot(by["A"]) == ("MON", 11, 12, "OAT") and slot(by["B"]) == ("MON", 9, 10, "OAT")
    assert official_ok(data, by)[0] == []


def test_improvement_pass_moves_an_approved_request_to_free_a_slot():
    a = req("A", [win("MON", 9, 10), win("MON", 7, 8)], 1)
    b = req("B", [win("MON", 9, 10)], 2)
    d = copy.deepcopy(DATA)
    d["booking_requests"] = [a, b]
    D = Decider(d, {})
    decisions = {x["id"]: D.decide(x) for x in (a, b)}                 # no look-ahead: A sits on P9-P10
    assert decisions["B"]["status"] == "alternative_offered"
    D.improve(decisions)
    assert decisions["A"]["status"] == decisions["B"]["status"] == "approved"
    assert slot(decisions["B"]) == ("MON", 9, 10, "OAT") and slot(decisions["A"]) == ("MON", 7, 8, "OAT")
    hard, stats = official_ok(d, decisions)
    assert hard == [] and stats["priority_inversions"] == []


def test_an_alternative_does_not_take_the_slot_a_later_request_needs():
    a = req("A", [win("MON", 9, 10)], 1)
    b = req("B", [win("MON", 9, 10)], 2)                                 # loses to A, gets an alternative
    c = req("C", [win("MON", 11, 12)], 3)
    data, by = run([a, b, c])
    assert by["A"]["status"] == by["C"]["status"] == "approved"
    assert by["B"]["status"] == "alternative_offered"
    assert slot(by["C"]) == ("MON", 11, 12, "OAT")
    assert official_ok(data, by)[0] == []


def test_higher_priority_keeps_the_slot_even_if_flexibility_would_score_more():
    club = req("CLUB", [win("MON", 9, 10)], 1)
    inst = req("INST", [win("MON", 9, 10)], 3, role="admin", cat="institute_event")
    data, by = run([club, inst])
    assert by["INST"]["status"] == "approved" and slot(by["INST"]) == ("MON", 9, 10, "OAT")
    assert by["CLUB"]["status"] == "alternative_offered"
    hard, stats = official_ok(data, by)
    assert hard == [] and stats["priority_inversions"] == []


def test_same_category_follows_submission_time():
    early = req("EARLY", [win("TUE", 9, 10)], 1)
    late = req("LATE", [win("TUE", 9, 10)], 2)
    for order in ([early, late], [late, early]):
        _, by = run(order)
        assert by["EARLY"]["status"] == "approved" and by["LATE"]["status"] == "alternative_offered"


def test_role_cap_cannot_be_bypassed():
    club_fake = req("FAKE", [win("WED", 9, 10)], 1, role="club", cat="institute_event")
    real = req("REAL", [win("WED", 9, 10)], 2, role="admin", cat="institute_event")
    _, by = run([club_fake, real])
    assert by["FAKE"]["effective_category"] == "club_event"
    assert by["REAL"]["status"] == "approved" and by["FAKE"]["status"] == "alternative_offered"


def test_cancelled_request_is_never_approved_and_frees_its_slot():
    gone = req("GONE", [win("THU", 9, 10)], 1)
    other = req("OTHER", [win("THU", 9, 10)], 2)
    data, by = run([gone, other], cancelled=["GONE"])
    assert by["GONE"]["status"] == "rejected" and by["OTHER"]["status"] == "approved"
    assert official_ok(data, by)[0] == []


def test_requested_room_is_a_preference_not_a_requirement():
    d = copy.deepcopy(DATA)
    r = req("PREF", [win("FRI", 9, 10)], 1, room="AUD")
    r["room_types"] = ["auditorium", "outdoor"]
    d["booking_requests"] = [r, req("TAKE", [win("FRI", 9, 10)], 1, room="AUD")]
    d["booking_requests"][1]["room_types"] = ["auditorium"]
    dec, _, _ = evaluate_bookings(d, {})
    by = {x["request_id"]: x for x in dec}
    assert by["PREF"]["status"] == "approved" and by["TAKE"]["status"] == "approved"
    assert {by["PREF"]["room_id"], by["TAKE"]["room_id"]} == {"AUD", "OAT"}


def test_existing_decisions_are_not_overwritten_by_suggestions():
    d = copy.deepcopy(DATA)
    held = req("HELD", [win("MON", 9, 10)], 1)
    d["booking_requests"] = [held]
    D = Decider(d, {})
    dec = D.decide(held)
    probe = req("PROBE", [win("MON", 9, 10), win("MON", 11, 12)], 2)
    opts = D.suggestions(probe)
    assert dec["status"] == "approved"
    assert opts and all(not (o["day"] == "MON" and o["room_id"] == "OAT" and o["start_period"] in (9, 10)) for o in opts)
    assert opts[0]["kind"] == "inside_window"
