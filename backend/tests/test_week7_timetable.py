import pytest

from conftest import wait


@pytest.fixture(scope="module")
def ready(client, admin):
    client.post("/api/admin/reset", headers=admin)
    jid = client.post("/api/schedules/generate?time_limit=0", headers=admin).json()["data"]["job_id"]
    assert wait(client, admin, f"/api/jobs/{jid}")["status"] == "DONE"
    assert client.post("/api/exams/generate", headers=admin).status_code == 200
    assert client.post("/api/bookings/evaluate-batch", headers=admin).status_code == 200
    return True


def week7(client, headers, view, id_):
    r = client.get(f"/api/schedules/week7?view={view}&id={id_}", headers=headers)
    assert r.status_code == 200, r.text
    return r.json()["data"]


def test_every_decided_booking_appears_in_its_room_grid_up_to_p13(client, admin, ready):
    decisions = client.get("/api/exports/schedule", headers=admin).json()["fest_week"]["bookings"]
    placed = [b for b in decisions if b["status"] in ("approved", "alternative_offered")]
    rooms = {b["room_id"] for b in placed}
    seen = {}
    for room in rooms:
        for e in week7(client, admin, "room", room)["events"]:
            seen[e["id"]] = e
    assert {b["request_id"] for b in placed} == set(seen)                 # none lost, none invented
    for b in placed:
        e = seen[b["request_id"]]
        assert (e["day"], e["start"], e["end"], e["room_id"], e["status"]) == (
            b["day"], b["start_period"], b["end_period"], b["room_id"], b["status"])
    assert any(e["end"] >= 10 for e in seen.values())                    # evening periods are present
    assert all(1 <= e["start"] <= e["end"] <= 13 for e in seen.values())


def test_room_view_has_classes_and_events_without_exams(client, admin, ready):
    d = week7(client, admin, "room", "AUD")
    regular = client.get("/api/schedules?view=room&id=AUD", headers=admin).json()["data"]["assignments"]
    official = {o["session_id"]: o for o in client.get("/api/exports/schedule", headers=admin).json()["fest_week"]["session_overrides"]}
    expected = {a["session_id"] for a in regular if a["session_id"] not in official}       # classes the dataset events displaced leave
    assert {c["session_id"] for c in d["classes"] if not c["week7_override"]} == expected
    for c in d["classes"]:
        if c["week7_override"]:
            assert official[c["session_id"]]["room_id"] == "AUD" and c["displaced_by"] == official[c["session_id"]]["displaced_by"]
    assert d["events"] and all(e["room_id"] == "AUD" for e in d["events"])
    assert "exam" not in str(d).lower().replace("exams", "")             # Week 8 stays on its own page


def test_group_and_faculty_views_pick_up_their_events(client, admin, ready):
    d = week7(client, admin, "faculty", "F12")
    assert any("(F12)" in e["requester"] for e in d["events"]) or d["events"] == []
    g = week7(client, admin, "group", "Y1-A")
    regular = client.get("/api/schedules?view=group&id=Y1-A", headers=admin).json()["data"]["assignments"]
    assert {c["session_id"] for c in g["classes"]} == {a["session_id"] for a in regular}


def test_every_role_can_read_it_and_it_needs_a_timetable_and_a_login(client, admin, faculty, club, coordinator, ready):
    for h in (faculty, club, coordinator):
        assert client.get("/api/schedules/week7?view=room&id=AUD", headers=h).status_code == 200
    assert client.get("/api/schedules/week7?view=room&id=AUD").status_code == 401
    assert client.get("/api/schedules/week7?view=planet&id=AUD", headers=admin).status_code == 422


def test_a_class_displaced_by_an_institute_event_shows_moved_and_the_event_shows_in_the_grid(client, admin, admin2, ready):
    classes = client.get("/api/schedules?view=room&id=LH-1", headers=admin).json()["data"]["assignments"]
    sub = None
    for a in classes:
        r = client.post("/api/events/manual", headers=admin, json={
            "title": "Convocation rehearsal", "room_id": "LH-1", "day": a["day"], "start_period": a["start_period"],
            "end_period": a["end_period"], "attendance": 100, "requested_category": "institute_event"})
        if r.status_code == 200 and r.json()["data"]["status"] == "PENDING_APPROVAL":
            sub, victim = r.json()["data"], a
            break
    if sub is None:
        pytest.skip("no class in LH-1 could be relocated in this timetable")
    before = week7(client, admin, "room", "LH-1")
    assert not any(e["id"] == sub["id"] for e in before["events"])           # pending: nothing is shown as booked yet
    assert not any(c.get("displaced_by") == sub["id"] for c in week7(client, admin, "group", victim["groups"][0])["classes"])
    assert client.post(f"/api/bookings/{sub['id']}/decision", headers=admin2, json={"action": "approve"}).status_code == 200
    after = week7(client, admin, "room", "LH-1")
    assert any(e["id"] == sub["id"] for e in after["events"])
    assert victim["session_id"] not in {c["session_id"] for c in after["classes"] if (c["day"], c["start_period"]) == (victim["day"], victim["start_period"])}
    group = victim["groups"][0]
    moved = [c for c in week7(client, admin, "group", group)["classes"] if c["session_id"] == victim["session_id"]]
    assert moved and moved[0]["week7_override"] and moved[0]["displaced_by"] == sub["id"]
    assert moved[0]["regular"]["room_id"] == "LH-1"
    # the regular-week timetable is untouched
    regular = client.get("/api/schedules?view=room&id=LH-1", headers=admin).json()["data"]["assignments"]
    assert victim["session_id"] in {a["session_id"] for a in regular}
