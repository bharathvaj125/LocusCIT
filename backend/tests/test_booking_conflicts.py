"""Conflict resolution between requests that are not confirmed yet (priority, windows, alternatives, declines)."""
import pytest

from conftest import wait

OFFICIAL = {"approved", "alternative_offered", "rejected"}


@pytest.fixture()
def fresh(client, admin):
    client.post("/api/admin/reset", headers=admin)
    jid = client.post("/api/schedules/generate?time_limit=0", headers=admin).json()["data"]["job_id"]
    assert wait(client, admin, f"/api/jobs/{jid}")["status"] == "DONE"
    assert client.post("/api/exams/generate", headers=admin).status_code == 200
    assert client.post("/api/bookings/evaluate-batch", headers=admin).status_code == 200
    return True


def draft(title, n, windows, types, cat="club_event", room=None, needs=None):
    dur = windows[0][2] - windows[0][1] + 1
    return {"title": title, "attendance": n, "duration_periods": dur, "needs": needs or [], "room_types": types,
            "windows": [{"day": d, "from_period": f, "to_period": t} for d, f, t in windows],
            "requested_room": room, "requested_category": cat, "mandatory_for_groups": []}


def submit(client, headers, d):
    r = client.post("/api/bookings/submit", json=d, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()["data"]["submissions"][0]


def get(client, headers, sid):
    return next(s for s in client.get("/api/bookings", headers=headers).json()["data"]["submitted"] if s["id"] == sid)


def free_slot(client, admin, room_ids, per=2):
    """A day and window where every one of these rooms is free for `per` periods."""
    for day in ("MON", "TUE", "WED", "THU", "FRI"):
        for start in (10, 11, 12):
            r = client.get(f"/api/campus/availability?day={day}&start={start}&end={start + per - 1}&events_only=false", headers=admin).json()["data"]
            free = {x["id"] for x in r["rooms"] if x["free"]}
            if set(room_ids) <= free:
                return day, start, start + per - 1
    pytest.skip("no common free slot in this timetable")


def test_a_later_higher_priority_request_takes_the_slot_and_the_lower_one_is_recalculated(client, admin, club, coordinator, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    low = submit(client, club, draft("Club gala", 300, [(day, a, b)], ["auditorium"]))
    assert low["proposed"]["status"] == "approved" and low["placement"]["room_id"] == "AUD"
    high = submit(client, coordinator, draft("Department convocation", 300, [(day, a, b)], ["auditorium"], cat="department_event"))
    assert high["proposed"]["status"] == "approved" and high["placement"]["room_id"] == "AUD"
    low = get(client, admin, low["id"])                                    # recalculated, not silently confirmed
    assert low["status"] == "PENDING_APPROVAL" and low["proposed"]["status"] == "alternative_offered"
    assert (low["placement"]["day"], low["placement"]["start_period"]) != (day, a)
    assert "Recalculated" in low["decision_reason"] and high["id"] in low["decision_reason"]
    # approving the lower one first can no longer block the higher one
    r = client.post(f"/api/bookings/{low['id']}/decision", json={"action": "approve"}, headers=admin)
    assert r.status_code == 200 and r.json()["data"]["status"] == "ALTERNATIVE_OFFERED"          # outside its window: needs the requester
    r = client.post(f"/api/bookings/{high['id']}/decision", json={"action": "approve"}, headers=admin)
    assert r.status_code == 200 and r.json()["data"]["status"] == "APPROVED"


def test_same_category_the_earlier_request_keeps_the_slot(client, admin, club, faculty, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    first = submit(client, club, draft("Club one", 300, [(day, a, b)], ["auditorium"]))
    second = submit(client, club, draft("Club two", 300, [(day, a, b)], ["auditorium"]))
    assert first["placement"]["room_id"] == "AUD"
    assert second["proposed"]["status"] == "alternative_offered"            # the later one is the one that has to move
    assert get(client, admin, first["id"])["proposed"]["status"] == "approved"


def test_a_lower_request_stays_inside_its_own_windows_when_another_slot_is_free(client, admin, club, coordinator, fresh):
    day, a, b = free_slot(client, admin, ["SH-1", "SH-2"])
    low = submit(client, club, draft("Club quiz", 90, [(day, a, b)], ["seminar_hall"], room="SH-1"))
    assert low["placement"]["room_id"] == "SH-1"
    submit(client, coordinator, draft("Dept talk", 90, [(day, a, b)], ["seminar_hall"], cat="department_event", room="SH-1"))
    low = get(client, admin, low["id"])
    assert low["proposed"]["status"] == "approved" and low["placement"]["room_id"] == "SH-2"       # still inside its window
    assert (low["placement"]["day"], low["placement"]["start_period"]) == (day, a)


def test_a_confirmed_booking_is_never_silently_revoked(client, admin, admin2, club, coordinator, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    low = submit(client, club, draft("Club gala", 300, [(day, a, b)], ["auditorium"]))
    assert client.post(f"/api/bookings/{low['id']}/decision", json={"action": "approve"}, headers=admin).status_code == 200
    high = submit(client, coordinator, draft("Department convocation", 300, [(day, a, b)], ["auditorium"], cat="department_event"))
    assert high["proposed"]["status"] == "alternative_offered"              # the confirmed slot is not taken away
    kept = get(client, admin, low["id"])
    assert kept["status"] == "APPROVED" and kept["placement"]["room_id"] == "AUD" and (kept["placement"]["day"], kept["placement"]["start_period"]) == (day, a)
    # the only route to that slot is the holder's own agreement (move offer), which needs an approver
    r = client.get(f"/api/bookings/{high['id']}/negotiation-options", headers=coordinator)
    assert r.status_code == 200


def test_approving_an_alternative_needs_the_requester_and_every_outcome_is_checked(client, admin, club, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    submit(client, club, draft("Hold the hall", 300, [(day, a, b)], ["auditorium"]))                 # takes AUD
    asked = submit(client, club, draft("Second gala", 300, [(day, a, b)], ["auditorium"]))
    assert asked["proposed"]["status"] == "alternative_offered"
    alt = asked["placement"]
    r = client.post(f"/api/bookings/{asked['id']}/decision", json={"action": "approve"}, headers=admin)
    assert r.status_code == 200 and r.json()["data"]["status"] == "ALTERNATIVE_OFFERED"              # not APPROVED: outside the window
    ok = client.post(f"/api/bookings/{asked['id']}/respond", json={"accept": True}, headers=club)
    assert ok.status_code == 200 and ok.json()["data"]["status"] == "APPROVED"
    assert ok.json()["data"]["placement"] == alt


def test_a_declined_alternative_is_kept_and_closes_the_request_as_rejected(client, admin, club, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    submit(client, club, draft("Hold the hall", 300, [(day, a, b)], ["auditorium"]))
    asked = submit(client, club, draft("Second gala", 300, [(day, a, b)], ["auditorium"]))
    client.post(f"/api/bookings/{asked['id']}/decision", json={"action": "approve"}, headers=admin)
    r = client.post(f"/api/bookings/{asked['id']}/respond", json={"accept": False}, headers=club)
    d = r.json()["data"]
    assert r.status_code == 200 and d["status"] == "REJECTED" and d["placement"] is None and d["declined_alternative"]
    assert "declined" in d["decision_reason"].lower()
    # decided once: it cannot be accepted or declined again, and it is not revived by later recalculation
    assert client.post(f"/api/bookings/{asked['id']}/respond", json={"accept": True}, headers=club).status_code == 409
    assert get(client, admin, asked["id"])["status"] == "REJECTED"


def test_an_offer_that_loses_its_slot_goes_back_to_an_approver_not_silently_changed(client, admin, club, coordinator, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    submit(client, club, draft("Hold the hall", 300, [(day, a, b)], ["auditorium"]))
    asked = submit(client, club, draft("Second gala", 300, [(day, a, b)], ["auditorium"]))
    client.post(f"/api/bookings/{asked['id']}/decision", json={"action": "approve"}, headers=admin)      # offer is out
    offered = get(client, admin, asked["id"])["placement"]
    # a department event now needs exactly the slot that was offered to the club
    high = submit(client, coordinator, draft("Dept day", 300, [(offered["day"], offered["start_period"], offered["end_period"])],
                                             ["auditorium"], cat="department_event"))
    assert high["proposed"]["status"] == "approved"
    now = get(client, admin, asked["id"])
    assert now["status"] == "PENDING_APPROVAL" and "Recalculated" in now["decision_reason"]
    assert now["placement"] != offered


def test_a_stale_approval_is_refused_when_the_request_changed_after_it_was_opened(client, admin, club, coordinator, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    low = submit(client, club, draft("Club gala", 300, [(day, a, b)], ["auditorium"]))
    seen = dict(low["placement"])
    submit(client, coordinator, draft("Department convocation", 300, [(day, a, b)], ["auditorium"], cat="department_event"))
    r = client.post(f"/api/bookings/{low['id']}/decision", json={"action": "approve", "expect": seen}, headers=admin)
    assert r.status_code == 409 and r.json()["errors"][0]["code"] == "STALE_PROPOSAL"
    assert get(client, admin, low["id"])["status"] == "PENDING_APPROVAL"


def test_cancelling_frees_the_slot_for_a_request_that_was_pushed_aside(client, admin, club, coordinator, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    low = submit(client, club, draft("Club gala", 300, [(day, a, b)], ["auditorium"]))
    high = submit(client, coordinator, draft("Department convocation", 300, [(day, a, b)], ["auditorium"], cat="department_event"))
    assert get(client, admin, low["id"])["proposed"]["status"] == "alternative_offered"
    assert client.post(f"/api/bookings/{high['id']}/cancel", headers=coordinator).status_code == 200
    back = get(client, admin, low["id"])
    assert back["proposed"]["status"] == "approved" and back["placement"]["room_id"] == "AUD"      # its own window is free again


def test_a_manual_event_cannot_take_a_slot_held_by_an_earlier_request_it_does_not_outrank(client, admin, club, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    held = submit(client, club, draft("Club gala", 300, [(day, a, b)], ["auditorium"]))
    body = {"title": "Walk-in event", "room_id": "AUD", "day": day, "start_period": a, "end_period": b, "attendance": 100}
    r = client.post("/api/events/manual", json=body, headers=admin)
    assert r.status_code == 422 and held["id"] in r.json()["errors"][0]["message"]
    r = client.post("/api/events/manual", json={**body, "requested_category": "institute_event"}, headers=admin)
    assert r.status_code == 200                                              # an institute event outranks it ...
    assert get(client, admin, held["id"])["proposed"]["status"] == "alternative_offered"   # ... and the club request is recalculated


def test_exports_stay_official_and_valid_after_all_of_this(client, admin, club, coordinator, fresh):
    day, a, b = free_slot(client, admin, ["AUD"])
    submit(client, club, draft("Club gala", 300, [(day, a, b)], ["auditorium"]))
    submit(client, coordinator, draft("Department convocation", 300, [(day, a, b)], ["auditorium"], cat="department_event"))
    exp = client.get("/api/exports/schedule", headers=admin).json()
    assert {x["status"] for x in exp["fest_week"]["bookings"]} <= OFFICIAL
    rep = client.get("/api/exports/report", headers=admin).json()["data"]["schedule"]
    assert rep["hard_violation_count"] == 0 and rep["bookings"]["priority_inversions"] == 0
