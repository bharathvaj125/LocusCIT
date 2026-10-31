"""Voluntary booking-move negotiation, through the real API."""
import time

import pytest

from app.api import OFFICIAL_STATUSES, _official_decision
from conftest import wait

OUTDOOR = {"attendance": 20, "duration_periods": 2, "needs": [], "room_types": ["outdoor"], "day_mode": "any"}
MON, TUE = {"day": "MON", "from_period": 7, "to_period": 8}, {"day": "TUE", "from_period": 7, "to_period": 8}


@pytest.fixture(scope="module")
def ready(client, admin):
    client.post("/api/admin/reset", headers=admin)
    jid = client.post("/api/schedules/generate?time_limit=0", headers=admin).json()["data"]["job_id"]
    assert wait(client, admin, f"/api/jobs/{jid}")["status"] == "DONE"
    assert client.post("/api/bookings/evaluate-batch", headers=admin).status_code == 200
    return True


def submit(client, who, title, windows):
    r = client.post("/api/bookings/submit", headers=who, json={**OUTDOOR, "title": title, "windows": windows})
    assert r.status_code == 200, r.text
    return r.json()["data"]["submissions"][0]


def approve(client, who, sid):
    r = client.post(f"/api/bookings/{sid}/decision", headers=who, json={"action": "approve"})
    assert r.status_code == 200, r.text
    return r.json()["data"]


def mine(client, who):
    return {s["id"]: s for s in client.get("/api/bookings", headers=who).json()["data"]["submitted"]}


def holder_and_requester(client, club, faculty, admin, windows_a, window_b, deadline=60):
    a = submit(client, club, "Holder event", windows_a)
    a = approve(client, admin, a["id"])
    b = submit(client, faculty, "Wants the same slot", [window_b])
    assert b["proposed"]["status"] == "alternative_offered"          # the engine alone can only offer something else
    return a, b


def test_accept_then_approval_applies_both_changes_together(client, club, faculty, admin, admin2, ready):
    a, b = holder_and_requester(client, club, faculty, admin, [MON, TUE], MON)
    assert a["placement"]["day"] == "MON"
    opt = client.get(f"/api/bookings/{b['id']}/negotiation-options", headers=faculty).json()["data"]
    assert opt["available"] and opt["holder"]["id"] == a["id"] and opt["a_to"]["day"] == "TUE"

    n = client.post(f"/api/bookings/{b['id']}/negotiate", headers=faculty, json={"deadline_seconds": 60}).json()["data"]
    assert n["status"] == "awaiting_response" and 55 <= n["seconds_left"] <= 60
    assert mine(client, faculty)[b["id"]]["status"] == "PENDING_NEGOTIATION"
    assert mine(client, club)[a["id"]]["placement"]["day"] == "MON"                       # untouched while open
    # only the holder may answer: not the requester, not even an Admin
    assert client.post(f"/api/negotiations/{n['id']}/respond", headers=faculty, json={"accept": True}).status_code == 403
    assert client.post(f"/api/negotiations/{n['id']}/respond", headers=admin, json={"accept": True}).status_code == 403
    assert client.post(f"/api/bookings/{b['id']}/decision", headers=admin, json={"action": "approve"}).status_code == 409

    acc = client.post(f"/api/negotiations/{n['id']}/respond", headers=club, json={"accept": True})
    assert acc.status_code == 200 and acc.json()["data"]["status"] == "accepted"
    assert mine(client, club)[a["id"]]["placement"]["day"] == "MON"                       # still untouched: not approved yet
    assert mine(client, faculty)[b["id"]]["status"] == "PENDING_APPROVAL"
    assert client.post(f"/api/negotiations/{n['id']}/respond", headers=club, json={"accept": True}).status_code == 409
    assert client.post(f"/api/bookings/{b['id']}/decision", headers=faculty, json={"action": "approve"}).status_code == 403

    done = client.post(f"/api/bookings/{b['id']}/decision", headers=admin2, json={"action": "approve"})
    assert done.status_code == 200 and done.json()["data"]["status"] == "APPROVED"
    both = mine(client, admin)
    assert both[b["id"]]["placement"]["day"] == "MON" and both[a["id"]]["placement"]["day"] == "TUE"
    assert both[a["id"]]["status"] == "APPROVED"
    # no double booking anywhere in the venue board
    ev = [e for e in client.get("/api/venue-board", headers=admin).json()["data"]["events"] if e["source"] == "app"]
    slots = [(e["room_id"], e["day"], p) for e in ev if e["status"] == "approved" for p in range(e["start"], e["end"] + 1)]
    assert len(slots) == len(set(slots))
    assert client.post(f"/api/bookings/{b['id']}/decision", headers=admin2, json={"action": "approve"}).status_code == 409


def test_decline_keeps_the_existing_booking(client, club, faculty, admin, ready):
    a, b = holder_and_requester(client, club, faculty, admin, [{**MON, "from_period": 9, "to_period": 10},
                                                              {**TUE, "from_period": 9, "to_period": 10}],
                                {**MON, "from_period": 9, "to_period": 10})
    n = client.post(f"/api/bookings/{b['id']}/negotiate", headers=faculty).json()["data"]
    r = client.post(f"/api/negotiations/{n['id']}/respond", headers=club, json={"accept": False})
    assert r.json()["data"]["status"] == "declined"
    after_a, after_b = mine(client, admin)[a["id"]], mine(client, admin)[b["id"]]
    assert after_a["status"] == "APPROVED" and after_a["placement"] == a["placement"]
    assert after_b["status"] == "PENDING_APPROVAL" and after_b["proposed"]["status"] == "alternative_offered"
    assert after_b["placement"] != a["placement"]                          # resolved by the normal rules: an alternative


def test_timeout_never_cancels_the_holder(client, club, faculty, admin, ready):
    a, b = holder_and_requester(client, club, faculty, admin, [{**MON, "from_period": 5, "to_period": 6},
                                                              {**TUE, "from_period": 5, "to_period": 6}],
                                {**MON, "from_period": 5, "to_period": 6})
    n = client.post(f"/api/bookings/{b['id']}/negotiate", headers=faculty, json={"deadline_seconds": 1}).json()["data"]
    time.sleep(1.3)
    listing = {x["id"]: x for x in client.get("/api/negotiations", headers=club).json()["data"]["negotiations"]}
    assert listing[n["id"]]["status"] == "expired"
    assert client.post(f"/api/negotiations/{n['id']}/respond", headers=club, json={"accept": True}).status_code == 409
    sub = mine(client, admin)
    assert sub[a["id"]]["status"] == "APPROVED" and sub[a["id"]]["placement"] == a["placement"]
    assert sub[b["id"]]["status"] == "PENDING_APPROVAL"


def test_accept_is_revalidated_and_a_stolen_slot_blocks_the_swap(client, club, faculty, admin, admin2, ready):
    a, b = holder_and_requester(client, club, faculty, admin, [{**MON, "from_period": 3, "to_period": 4},
                                                              {**TUE, "from_period": 3, "to_period": 4}],
                                {**MON, "from_period": 3, "to_period": 4})
    n = client.post(f"/api/bookings/{b['id']}/negotiate", headers=faculty).json()["data"]
    new = n["a_to"]
    assert client.post(f"/api/negotiations/{n['id']}/respond", headers=club, json={"accept": True}).status_code == 200
    # while waiting for the approver, someone books the slot the holder would have moved to
    steal = {"title": "Steals it", "room_id": new["room_id"], "day": new["day"], "start_period": new["start_period"],
             "end_period": new["end_period"], "attendance": 10}
    assert client.post("/api/events/manual", headers=admin, json=steal).status_code == 200
    r = client.post(f"/api/bookings/{b['id']}/decision", headers=admin2, json={"action": "approve"})
    assert r.status_code == 409
    sub = mine(client, admin)
    assert sub[a["id"]]["placement"] == a["placement"] and sub[a["id"]]["status"] == "APPROVED"     # nothing changed
    assert sub[b["id"]]["status"] != "APPROVED"


def test_second_request_cannot_double_book_the_same_holder(client, club, faculty, coordinator, admin, ready):
    a, b1 = holder_and_requester(client, club, faculty, admin, [{**MON, "from_period": 1, "to_period": 2},
                                                               {**TUE, "from_period": 1, "to_period": 2}],
                                 {**MON, "from_period": 1, "to_period": 2})
    b2 = submit(client, coordinator, "Also wants it", [{**MON, "from_period": 1, "to_period": 2}])
    first = client.post(f"/api/bookings/{b1['id']}/negotiate", headers=faculty)
    second = client.post(f"/api/bookings/{b2['id']}/negotiate", headers=coordinator)
    assert first.status_code == 200 and second.status_code == 409
    again = client.post(f"/api/bookings/{b1['id']}/negotiate", headers=faculty)
    assert again.status_code == 409                                            # repeated click


def test_cancelling_the_holder_closes_the_offer(client, club, faculty, admin, ready):
    a, b = holder_and_requester(client, club, faculty, admin, [{"day": "WED", "from_period": 1, "to_period": 2},
                                                              {"day": "WED", "from_period": 3, "to_period": 4}],
                                {"day": "WED", "from_period": 1, "to_period": 2})
    n = client.post(f"/api/bookings/{b['id']}/negotiate", headers=faculty).json()["data"]
    assert client.post(f"/api/bookings/{a['id']}/cancel", headers=club).status_code == 200
    listing = {x["id"]: x for x in client.get("/api/negotiations", headers=faculty).json()["data"]["negotiations"]}
    assert listing[n["id"]]["status"] == "withdrawn"
    assert mine(client, faculty)[b["id"]]["status"] == "PENDING_APPROVAL"


def test_internal_negotiation_states_never_reach_the_official_export():
    assert set(OFFICIAL_STATUSES) == {"approved", "alternative_offered", "rejected"}
    for internal in ("pending_negotiation", "awaiting_response", "accepted", "declined", "expired", "PENDING_NEGOTIATION"):
        out = _official_decision({"request_id": "X", "status": internal, "day": "MON", "start_period": 1,
                                  "end_period": 2, "room_id": "OAT", "reason": "r"})
        assert out["status"] == "rejected" and out["reason"] and "room_id" not in out
    ok = {"request_id": "X", "status": "approved", "day": "MON", "start_period": 1, "end_period": 2, "room_id": "OAT",
          "reason": "r", "internal_note": "dropped"}
    assert _official_decision(ok) == {k: v for k, v in ok.items() if k != "internal_note"}


def test_an_approved_booking_is_never_silently_overwritten(client, club, admin, admin2, ready):
    slot = [{"day": "THU", "from_period": 1, "to_period": 2}]
    held = approve(client, admin, submit(client, club, "Already approved", slot)["id"])
    boss = submit(client, admin2, "Institute event, same slot", slot)         # outranks the club, but the slot is taken
    assert boss["proposed"]["status"] == "alternative_offered"
    assert mine(client, admin)[held["id"]]["placement"] == held["placement"]
    assert mine(client, admin)[held["id"]]["status"] == "APPROVED"


def test_suggestions_list_free_slots_and_change_nothing(client, club, admin, ready):
    before = len(client.get("/api/bookings", headers=admin).json()["data"]["submitted"])
    body = {**OUTDOOR, "title": "Probe", "windows": [{"day": "FRI", "from_period": 1, "to_period": 4}]}
    r = client.post("/api/bookings/suggest", headers=club, json=body).json()["data"]
    assert r["outcome"] == "approved" and r["options"] and r["options"][0]["kind"] == "inside_window"
    taken = {**body, "windows": [{"day": "WED", "from_period": 9, "to_period": 10}]}                 # BR-17's alternative
    r2 = client.post("/api/bookings/suggest", headers=club, json=taken).json()["data"]
    assert all(o["kind"] == "alternative" or o["day"] != "WED" or o["start_period"] != 9 for o in r2["options"])
    assert len(client.get("/api/bookings", headers=admin).json()["data"]["submitted"]) == before
