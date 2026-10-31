import json
import pathlib

from app.state import Workspace, WS

SP = pathlib.Path(__file__).resolve().parents[2] / "starter_pack"


def test_login_and_unauthenticated_access(client):
    assert client.post("/api/auth/login", json={"username": "admin", "password": "wrong"}).status_code == 401
    for url in ("/api/dashboard", "/api/rooms", "/api/schedules?view=room&id=AUD", "/api/exams", "/api/bookings"):
        assert client.get(url).status_code == 401, url
    assert client.get("/api/dashboard", headers={"Authorization": "Bearer garbage"}).status_code == 401
    assert client.get("/api/health").status_code == 200


def test_roles_cannot_use_admin_actions(client, coordinator, faculty, club):
    for h in (coordinator, faculty, club):
        for method, url in (("post", "/api/schedules/generate"), ("post", "/api/exams/generate"),
                            ("post", "/api/admin/reset"), ("post", "/api/bookings/evaluate-batch"),
                            ("get", "/api/exports/schedule"), ("get", "/api/exports/schedule-after"),
                            ("post", "/api/disruptions/propose"), ("post", "/api/admin/dataset/import")):
            r = getattr(client, method)(url, headers=h, **({"json": {}} if method == "post" else {}))
            assert r.status_code == 403, (url, r.status_code)


def test_role_cannot_be_elevated_by_the_client(client, club):
    # a role sent in the body or headers is ignored; only the verified token counts
    r = client.post("/api/admin/reset", headers={**club, "X-Role": "admin"}, json={"role": "admin"})
    assert r.status_code == 403


def test_campus_timetables_are_readable_by_every_role_but_not_editable(client, admin, faculty, coordinator, club):
    me = client.get("/api/auth/me", headers=faculty).json()["data"]
    assert me["role"] == "faculty" and me["faculty_id"] == "F06"
    # read-only campus timetables: any group, teacher or room is open to every role (problem statement section 4)
    for who in (faculty, coordinator, club):
        for url in ("/api/schedules?view=faculty&id=F06", "/api/schedules?view=faculty&id=F07",
                    "/api/schedules?view=group&id=Y1-A", "/api/schedules?view=room&id=AUD", "/api/schedules"):
            assert client.get(url, headers=who).status_code != 403, url
    # ... but changing anything is still Admin only
    for who in (faculty, coordinator, club):
        assert client.post("/api/schedules/generate?time_limit=0", headers=who).status_code == 403


def test_bookings_are_role_scoped(client, admin, club):
    allr = client.get("/api/bookings", headers=admin).json()["data"]["requests"]
    mine = client.get("/api/bookings", headers=club).json()["data"]["requests"]
    assert len(allr) == 25 and 0 < len(mine) < len(allr)
    assert all(x["request"]["requester"] == "Dramatics Society" for x in mine)


def test_reset_keeps_accounts_and_import_validates(client, admin, club):
    r = client.post("/api/admin/reset", headers=admin).json()["data"]
    assert r["status"] == "reset" and r["seed_dataset_id"] == "cit-public-v1"
    assert client.get("/api/dashboard", headers=admin).json()["data"]["sessions_scheduled"] == 0
    assert client.get("/api/auth/me", headers=club).status_code == 200     # accounts survive a reset
    # stale clients get 409 instead of silently overwriting
    stale = client.post("/api/admin/reset", headers={**admin, "If-Match": "1"})
    assert stale.status_code == 409 and stale.json()["errors"][0]["code"] == "STALE_REVISION"
    assert client.post("/api/admin/dataset/import", headers=admin, json={"dataset_id": "x"}).status_code == 422
    data = json.loads((SP / "data" / "cit_public.json").read_text(encoding="utf-8"))
    data["sessions"][0]["faculty_id"] = "NOPE"
    assert client.post("/api/admin/dataset/import", headers=admin, json=data).status_code == 422
    data = json.loads((SP / "data" / "cit_public.json").read_text(encoding="utf-8"))
    ok = client.post("/api/admin/dataset/import", headers=admin, json=data).json()["data"]
    assert ok["counts"]["sessions"] == 189


def test_state_survives_restart(client, admin):
    client.post("/api/admin/reset", headers=admin)
    WS.save()
    fresh = Workspace()
    assert fresh.load() and fresh.revision == WS.revision
    assert fresh.dataset["dataset_id"] == WS.dataset["dataset_id"]


def test_reference_sample_and_audit(client, admin, club):
    r = client.get("/api/reference", headers=club).json()["data"]
    assert len(r["rooms"]) == 27 and len(r["faculty"]) == 40 and len(r["sessions"]) == 189
    assert all("name" in f for f in r["faculty"])
    assert client.get("/api/reference").status_code == 401
    s = client.get("/api/examples/sample-disruption", headers=admin).json()["data"]
    assert s["changes"] and s["changes"][0]["type"] == "faculty_unavailable"
    assert client.get("/api/examples/sample-disruption", headers=club).status_code == 403
    ev = client.get("/api/audit", headers=admin).json()["data"]["events"]
    assert ev and {"at", "actor", "action"} <= set(ev[0])
    assert client.get("/api/audit", headers=club).status_code == 403
