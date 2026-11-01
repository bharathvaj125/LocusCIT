"""Role-based approval rules (problem statement section 4) and the shared campus view, through the real API."""
from concurrent.futures import ThreadPoolExecutor

import pytest

from app.core.official import official_validator
from conftest import wait

LAB = {"attendance": 20, "duration_periods": 2, "needs": [], "day_mode": "any"}
EVE = {"day": "THU", "from_period": 10, "to_period": 11}


@pytest.fixture(scope="module")
def ready(client, admin):
    client.post("/api/admin/reset", headers=admin)
    jid = client.post("/api/schedules/generate?time_limit=0", headers=admin).json()["data"]["job_id"]
    assert wait(client, admin, f"/api/jobs/{jid}")["status"] == "DONE"
    assert client.post("/api/exams/generate", headers=admin).status_code == 200
    assert client.post("/api/bookings/evaluate-batch", headers=admin).status_code == 200
    return True


def submit(client, who, title, room_types, room=None, windows=(EVE,), cat="club_event", **over):
    body = {**LAB, "title": title, "room_types": room_types, "requested_room": room, "windows": list(windows),
            "requested_category": cat, **over}
    r = client.post("/api/bookings/submit", headers=who, json=body)
    assert r.status_code == 200, r.text
    return r.json()["data"]["submissions"][0]


def decide(client, who, sid, action="approve"):
    return client.post(f"/api/bookings/{sid}/decision", headers=who, json={"action": action})


def find(client, who, sid):
    return next(s for s in client.get("/api/bookings", headers=who).json()["data"]["submitted"] if s["id"] == sid)


def classes(client, who):
    return {c["session_id"]: (c["day"], c["start"], c["room_id"]) for c in
            client.get("/api/venue-board", headers=who).json()["data"]["classes"]}


# ------------------------------------------------------------------------------ admin and coordinator authority
def test_admin_approves_another_users_request_and_not_their_own(client, club, admin, admin2, ready):
    s = submit(client, club, "Quiz night", ["classroom"], windows=[{"day": "FRI", "from_period": 2, "to_period": 3}])
    assert s["routing"]["approver"] == "admin" and s["can_decide"] is False       # the owner cannot decide it
    ok = decide(client, admin, s["id"])
    assert ok.status_code == 200 and ok.json()["data"]["status"] == "APPROVED"
    own = submit(client, admin, "Dean's briefing", ["classroom"], windows=[{"day": "FRI", "from_period": 4, "to_period": 5}])
    r = decide(client, admin, own["id"])
    assert r.status_code == 403 and "own request" in r.json()["errors"][0]["message"]
    assert find(client, admin, own["id"])["status"] == "PENDING_APPROVAL"          # no eligible approver: stays pending
    assert decide(client, admin2, own["id"]).status_code == 200


def test_coordinator_decides_their_own_departments_lab_without_a_second_approver(client, club, coordinator, ready):
    s = submit(client, club, "Hack night", ["lab_cs"], room="CS-LAB-1")
    assert s["placement"]["room_id"].startswith("CS-LAB") and s["routing"]["departments"] == ["CSE"]
    r = decide(client, coordinator, s["id"])
    assert r.status_code == 200 and r.json()["data"]["status"] == "APPROVED"      # one approver is enough
    done = find(client, coordinator, s["id"])
    assert done["decided_by"] == "coordinator" and done["decided_role"] == "department_coordinator" and done["decided_at"]


def test_coordinator_cannot_decide_another_departments_lab_and_the_attempt_is_recorded(client, club, coordinator, admin, ready):
    s = submit(client, club, "Circuits meet", ["lab_elec"], room="ELEC-LAB-1")
    assert s["routing"]["departments"] == ["ECE", "EE"]
    for action in ("approve", "reject", "offer_alternative"):
        r = decide(client, coordinator, s["id"], action)
        assert r.status_code == 403 and "ECE" in r.json()["errors"][0]["message"]
    assert find(client, admin, s["id"])["status"] == "PENDING_APPROVAL"            # untouched
    audit = client.get("/api/audit?limit=50", headers=admin).json()["data"]["events"]
    assert any(e["action"] == "approval_denied" and e["actor"] == "coordinator" and s["id"] in e["detail"] for e in audit)
    assert decide(client, admin, s["id"]).status_code == 200                       # Admin can


def test_coordinator_cannot_approve_their_own_lab_request(client, coordinator, admin, ready):
    s = submit(client, coordinator, "Dept workshop", ["lab_cs"], room="CS-LAB-2",
               windows=[{"day": "FRI", "from_period": 10, "to_period": 11}], cat="department_event")
    r = decide(client, coordinator, s["id"])
    assert r.status_code == 403 and "own request" in r.json()["errors"][0]["message"]
    assert decide(client, admin, s["id"]).status_code == 200


def test_faculty_and_club_have_no_approval_authority(client, faculty, club, admin, ready):
    s = submit(client, club, "Open mic", ["classroom"], windows=[{"day": "FRI", "from_period": 6, "to_period": 7}])
    for who in (faculty, club):
        for action in ("approve", "reject", "offer_alternative"):
            assert decide(client, who, s["id"], action).status_code == 403
    assert find(client, admin, s["id"])["status"] == "PENDING_APPROVAL"


# ------------------------------------------------------------------------------ moving classes
def _auditorium_class(client, who):
    for c in client.get("/api/venue-board", headers=who).json()["data"]["classes"]:
        if c["room_id"] == "AUD" and c["day"] in ("MON", "TUE", "WED", "THU", "FRI"):
            return c
    pytest.skip("no class in the auditorium on this timetable")


def test_a_booking_that_moves_classes_needs_an_admin_other_than_the_requester(client, admin, admin2, coordinator, ready):
    c = _auditorium_class(client, admin)
    before = classes(client, admin)
    s = submit(client, admin, "Convocation rehearsal", ["auditorium"], room="AUD", attendance=300, cat="institute_event",
               duration_periods=c["end"] - c["start"] + 1,
               windows=[{"day": c["day"], "from_period": c["start"], "to_period": c["end"]}])
    assert s["overrides"] and s["routing"]["approver"] == "admin" and s["affected_classes"]
    assert classes(client, admin) == before                                        # proposed only, nothing moved yet
    assert decide(client, coordinator, s["id"]).status_code == 403                 # a coordinator is never enough
    own = decide(client, admin, s["id"])
    assert own.status_code == 403 and "own request" in own.json()["errors"][0]["message"]
    assert classes(client, admin) == before
    r = decide(client, admin2, s["id"])
    assert r.status_code == 200 and r.json()["data"]["status"] == "APPROVED"
    after = classes(client, admin)
    moved = {o["session_id"] for o in s["overrides"]}
    assert all(after[m] != before[m] for m in moved) and all(after[k] == before[k] for k in before if k not in moved)
    assert client.get("/api/dashboard", headers=admin).json()["data"]["hard_violation_count"] == 0
    # cancelling the booking puts the classes back
    assert client.post(f"/api/bookings/{s['id']}/cancel", headers=admin).status_code == 200
    assert classes(client, admin) == before


def test_only_an_institute_level_request_may_move_classes(client, club, coordinator, faculty, admin, ready):
    c = _auditorium_class(client, admin)
    before = classes(client, admin)
    for who, cat in ((club, "club_event"), (coordinator, "department_event"), (faculty, "guest_lecture")):
        s = submit(client, who, f"Wants the auditorium {cat}", ["auditorium"], room="AUD", attendance=300, cat=cat,
                   duration_periods=c["end"] - c["start"] + 1,
                   windows=[{"day": c["day"], "from_period": c["start"], "to_period": c["end"]}])
        assert s["overrides"] == []                                               # classes are never offered up
        assert s["proposed"]["status"] in ("alternative_offered", "rejected")
    assert classes(client, admin) == before


def test_a_rejected_class_moving_request_changes_nothing(client, admin, admin2, ready):
    c = _auditorium_class(client, admin)
    before = classes(client, admin)
    s = submit(client, admin, "Guest convocation", ["auditorium"], room="AUD", attendance=300, cat="institute_event",
               duration_periods=c["end"] - c["start"] + 1,
               windows=[{"day": c["day"], "from_period": c["start"], "to_period": c["end"]}])
    r = decide(client, admin2, s["id"], "reject")
    assert r.status_code == 200 and find(client, admin, s["id"])["status"] == "REJECTED"
    assert classes(client, admin) == before


# ------------------------------------------------------------------------------ finality and concurrency
def test_cancelled_and_finished_requests_cannot_be_approved_twice(client, club, admin, admin2, ready):
    s = submit(client, club, "Cancelled show", ["classroom"], windows=[{"day": "WED", "from_period": 1, "to_period": 2}])
    assert client.post(f"/api/bookings/{s['id']}/cancel", headers=club).status_code == 200
    assert decide(client, admin, s["id"]).status_code == 409
    t = submit(client, club, "Double click", ["classroom"], windows=[{"day": "WED", "from_period": 3, "to_period": 4}])
    assert decide(client, admin, t["id"]).status_code == 200
    assert decide(client, admin2, t["id"]).status_code == 409                      # repeated click
    events = [e for e in client.get("/api/venue-board", headers=admin).json()["data"]["events"] if e["id"] == t["id"]]
    assert len(events) == 1


def test_two_conflicting_approvals_at_the_same_time_cannot_both_win(client, club, faculty, admin, admin2, ready):
    win = [{"day": "WED", "from_period": 6, "to_period": 7}]
    a = submit(client, club, "Race A", ["classroom"], room="CR-101", windows=win)
    b = submit(client, faculty, "Race B", ["classroom"], room="CR-101", windows=win)
    assert a["placement"] != b["placement"]                      # the later request was given another slot when it was submitted
    with ThreadPoolExecutor(max_workers=2) as ex:
        ra, rb = ex.map(lambda args: decide(client, *args), [(admin, a["id"]), (admin2, b["id"])])
    assert sorted([ra.status_code, rb.status_code]) == [200, 200]
    held = [e for e in client.get("/api/venue-board", headers=admin).json()["data"]["events"]
            if e["id"] in (a["id"], b["id"]) and e["status"] == "approved"]
    for i, x in enumerate(held):                                 # nothing is booked twice
        for y in held[i + 1:]:
            assert not (x["room_id"] == y["room_id"] and x["day"] == y["day"] and x["start"] <= y["end"] and y["start"] <= x["end"])
    # and one booking approved twice at the same moment succeeds exactly once
    c = submit(client, club, "Race C", ["classroom"], room="CR-103", windows=[{"day": "THU", "from_period": 6, "to_period": 7}])
    with ThreadPoolExecutor(max_workers=2) as ex:
        r1, r2 = ex.map(lambda args: decide(client, *args), [(admin, c["id"]), (admin2, c["id"])])
    assert sorted([r1.status_code, r2.status_code]) == [200, 409]


def test_every_approval_is_rechecked_against_the_current_schedule(client, club, admin, admin2, ready):
    s = submit(client, club, "Stale slot", ["classroom"], room="CR-102", windows=[{"day": "WED", "from_period": 9, "to_period": 10}])
    p = s["placement"]
    steal = {"title": "Took it", "room_id": p["room_id"], "day": p["day"], "start_period": p["start_period"],
             "end_period": p["end_period"], "attendance": 10}
    steal["requested_category"] = "institute_event"
    assert client.post("/api/events/manual", headers=admin, json=steal).status_code == 200
    r = client.post(f"/api/bookings/{s['id']}/decision", headers=admin2, json={"action": "approve", "expect": p})
    assert r.status_code == 409 and r.json()["errors"][0]["code"] == "STALE_PROPOSAL"     # the view the approver had is out of date
    now = find(client, admin, s["id"])
    assert now["status"] == "PENDING_APPROVAL" and now["placement"] != p                  # recalculated, still waiting for a person


# ------------------------------------------------------------------------------ shared campus view and boundaries
def test_all_four_roles_share_one_campus_view(client, admin, coordinator, faculty, club, ready):
    seen = []
    for who in (admin, coordinator, faculty, club):
        o = client.get("/api/campus/overview", headers=who).json()["data"]
        assert o["stats"]["sessions_scheduled"] == o["stats"]["sessions_total"] > 0
        assert all({"pending", "reason", "raw_text"}.isdisjoint(e) for e in o["approved_events"])
        seen.append(o["approved_events"])
        a = client.get("/api/campus/availability?day=THU&start=10&end=11", headers=who)
        assert a.status_code == 200 and a.json()["data"]["rooms"]
        assert client.get("/api/rooms", headers=who).status_code == 200 and client.get("/api/venue-board", headers=who).status_code == 200
        assert client.get("/api/schedules", headers=who).status_code in (200, 404)
    assert all(e == seen[0] for e in seen)                                         # the same data for everyone


def test_private_requests_stay_private(client, club, faculty, coordinator, admin, ready):
    s = submit(client, club, "Private plans", ["classroom"], windows=[{"day": "FRI", "from_period": 8, "to_period": 9}])
    lab = submit(client, club, "CSE lab party", ["lab_cs"], room="CS-LAB-1", windows=[{"day": "FRI", "from_period": 10, "to_period": 11}])
    ids = lambda who: {x["id"] for x in client.get("/api/bookings", headers=who).json()["data"]["submitted"]}
    assert s["id"] in ids(club) and s["id"] in ids(admin)
    assert s["id"] not in ids(faculty) and s["id"] not in ids(coordinator)         # a classroom request is not theirs to see
    assert lab["id"] in ids(coordinator)                                           # but a request for their lab is
    pend = {p["id"] for p in client.get("/api/dashboard", headers=coordinator).json()["data"]["pending_bookings"]}
    assert lab["id"] in pend and s["id"] not in pend
    assert client.get(f"/api/explain/booking/{s['id']}", headers=faculty).status_code in (403, 404)
    board = {e["id"] for e in client.get("/api/venue-board", headers=faculty).json()["data"]["events"]}
    assert s["id"] not in board                                                    # unapproved bookings are not published


def test_demo_account_permissions(client, admin, admin2, coordinator, faculty, club, ready):
    for who in (coordinator, faculty, club):
        assert client.post("/api/admin/reset", headers=who).status_code == 403
        assert client.post("/api/schedules/generate?time_limit=0", headers=who).status_code == 403
        assert client.post("/api/exams/generate", headers=who).status_code == 403
        assert client.post("/api/bookings/evaluate-batch", headers=who).status_code == 403
        assert client.get("/api/audit", headers=who).status_code == 403
        assert client.put("/api/admin/priority-order", headers=who, json={"reset": True}).status_code == 403
        assert client.get("/api/exports/schedule", headers=who).status_code == 403
    assert client.post("/api/disruptions/propose", headers=club, json={}).status_code in (403, 422)
    for who in (admin, admin2):
        assert client.get("/api/audit", headers=who).status_code == 200
        assert client.get("/api/admin/priority-order", headers=who).status_code == 200
    assert client.get("/api/auth/me", headers=faculty).json()["data"]["role"] == "faculty"


def test_admin_can_change_the_priority_order_and_restore_it(client, club, admin, faculty, ready):
    cur = client.get("/api/admin/priority-order", headers=admin).json()["data"]
    assert cur["changed"] is False and cur["order"][:2] == ["exam", "regular_session"]
    assert client.put("/api/admin/priority-order", headers=admin, json={"order": ["club_event"]}).status_code == 422
    bad = list(cur["order"]); bad[0], bad[2] = bad[2], bad[0]
    assert client.put("/api/admin/priority-order", headers=admin, json={"order": bad}).status_code == 422   # exams stay first
    new = list(cur["order"]); new[3], new[4] = new[4], new[3]
    r = client.put("/api/admin/priority-order", headers=admin, json={"order": new})
    assert r.status_code == 200 and r.json()["data"]["changed"] is True
    assert client.get("/api/dashboard", headers=admin).json()["data"]["hard_violation_count"] == 0
    back = client.put("/api/admin/priority-order", headers=admin, json={"reset": True}).json()["data"]
    assert back["changed"] is False and back["order"] == cur["official_order"]


def test_notifications_count_only_what_the_person_can_act_on(client, club, coordinator, admin, admin2, faculty, ready):
    dash = lambda who: client.get("/api/dashboard", headers=who).json()["data"]
    ece = submit(client, club, "ECE lab session", ["lab_elec"], room="ELEC-LAB-2", windows=[{"day": "FRI", "from_period": 12, "to_period": 13}])
    own = submit(client, admin, "Dean's own request", ["classroom"], windows=[{"day": "THU", "from_period": 2, "to_period": 3}])
    ids = lambda who: {b["id"] for b in dash(who)["pending_bookings"]}
    assert ece["id"] not in ids(coordinator)                       # a CSE coordinator cannot decide an ECE/EE lab
    assert ece["id"] in ids(admin) and ece["id"] in ids(admin2)
    assert own["id"] not in ids(admin) and own["id"] in ids(admin2)  # not your own
    assert ece["id"] not in ids(club) and ece["id"] not in ids(faculty)
    before = dash(admin)["pending_approvals"]
    assert decide(client, admin, ece["id"]).status_code == 200
    assert dash(admin)["pending_approvals"] == before - 1


def test_validator_report_matches_the_exports(client, admin, coordinator, ready):
    assert client.get("/api/exports/report", headers=coordinator).status_code == 403
    r = client.get("/api/exports/report", headers=admin).json()["data"]
    assert r["schedule"]["hard_violation_count"] == 0 and r["schedule"]["bookings"]["priority_inversions"] == 0
    assert r["schedule"]["sessions"] == 189 and r["schedule_after"] is None


# ------------------------------------------------------------------------------ exports and reset (keep these last)
def test_exports_stay_valid_and_official(client, admin, ready):
    sched = client.get("/api/exports/schedule", headers=admin)
    assert sched.status_code == 200
    data = sched.json()
    assert {b["status"] for b in data["fest_week"]["bookings"]} <= {"approved", "alternative_offered", "rejected"}
    assert all(not b["request_id"].startswith(("SUB-", "MAN-")) for b in data["fest_week"]["bookings"])
    from app.state import WS
    rep = official_validator().run(WS.dataset, data)
    assert rep["hard_violation_count"] == 0 and rep["bookings"]["priority_inversions"] == []


def test_admin_reset_leaves_no_stale_approvals(client, club, admin, admin2, ready):
    s = submit(client, club, "Before reset", ["classroom"], windows=[{"day": "THU", "from_period": 12, "to_period": 13}])
    client.post("/api/admin/reset", headers=admin)
    assert decide(client, admin2, s["id"]).status_code == 404
    from app.state import WS
    assert WS.submissions == {} and WS.negotiations == {} and WS.app_overrides == []
    assert client.get("/api/bookings", headers=admin).json()["data"]["submitted"] == []

