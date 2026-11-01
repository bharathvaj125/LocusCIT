import pytest


def post(client, h, path, body=None):
    return client.post(path, json=body or {}, headers=h)


def new_user(client, admin, **over):
    body = {"username": "newperson", "full_name": "New Person", "role": "club", "organisation_id": "org-coding-club", **over}
    return post(client, admin, "/api/admin/users", body)


@pytest.fixture(autouse=True)
def clean(client, admin):
    client.post("/api/admin/reset", headers=admin)       # also removes accounts and organisations added by earlier tests
    yield


def test_only_admins_manage_accounts(client, admin, coordinator, faculty, club):
    for h in (coordinator, faculty, club):
        assert client.get("/api/admin/users", headers=h).status_code == 403
        assert client.get("/api/admin/organisations", headers=h).status_code == 403
        assert new_user(client, h).status_code == 403
    assert client.get("/api/admin/users").status_code == 401
    users = client.get("/api/admin/users", headers=admin).json()["data"]["users"]
    assert {"admin", "coordinator", "faculty", "club"} <= {u["username"] for u in users}
    assert all("hash" not in str(u).lower() for u in users)                # hashes never leave the server


def test_created_account_gets_a_one_time_password_and_must_change_it(client, admin):
    r = new_user(client, admin)
    assert r.status_code == 200, r.text
    d = r.json()["data"]
    assert d["user"]["organisation"] == "Coding Club" and d["user"]["must_change_password"] and len(d["temporary_password"]) >= 12
    assert "temporary_password" not in client.get("/api/admin/users/newperson", headers=admin).json()["data"]
    tok = client.post("/api/auth/login", json={"username": "newperson", "password": d["temporary_password"]}).json()["data"]
    h = {"Authorization": "Bearer " + tok["token"]}
    assert tok["user"]["must_change_password"] is True
    blocked = client.get("/api/dashboard", headers=h)
    assert blocked.status_code == 403 and blocked.json()["errors"][0]["code"] == "PASSWORD_CHANGE_REQUIRED"
    assert client.get("/api/auth/me", headers=h).status_code == 200
    weak = client.post("/api/auth/change-password", json={"current_password": d["temporary_password"], "new_password": "short"}, headers=h)
    assert weak.status_code == 422
    wrong = client.post("/api/auth/change-password", json={"current_password": "nope", "new_password": "Better-pass-9"}, headers=h)
    assert wrong.status_code == 403
    ok = client.post("/api/auth/change-password", json={"current_password": d["temporary_password"], "new_password": "Better-pass-9"}, headers=h)
    assert ok.status_code == 200
    assert client.get("/api/dashboard", headers=h).status_code == 200
    assert client.post("/api/auth/login", json={"username": "newperson", "password": d["temporary_password"]}).status_code == 401


def test_role_rules(client, admin):
    assert new_user(client, admin, username="x").status_code == 422                                  # too short
    assert new_user(client, admin, username="Has Space").status_code == 422
    assert new_user(client, admin, username="club").status_code == 409                               # taken
    assert new_user(client, admin, role="club", organisation_id=None).status_code == 422             # club needs an organisation
    assert new_user(client, admin, role="club", organisation_id="org-cse-department").status_code == 422   # not a club
    assert new_user(client, admin, role="club", organisation_id="org-nope").status_code == 422
    assert new_user(client, admin, role="faculty", organisation_id=None).status_code == 422          # needs a faculty link
    assert new_user(client, admin, role="faculty", organisation_id=None, faculty_id="F99").status_code == 422
    assert new_user(client, admin, role="faculty", organisation_id=None, faculty_id="F06").status_code == 422   # already linked to 'faculty'
    assert new_user(client, admin, role="department_coordinator", organisation_id=None).status_code == 422     # needs a department
    assert new_user(client, admin, role="department_coordinator", organisation_id=None, department="XYZ").status_code == 422
    assert new_user(client, admin, role="club", faculty_id="F11").status_code == 422                 # only faculty accounts link to faculty
    assert new_user(client, admin, email="not-an-email").status_code == 422
    f = new_user(client, admin, username="drnew", role="faculty", organisation_id=None, faculty_id="F11")
    assert f.status_code == 200 and f.json()["data"]["user"]["department"]                           # department follows the faculty record
    c = new_user(client, admin, username="ececo", role="department_coordinator", organisation_id=None, department="ECE")
    assert c.status_code == 200 and c.json()["data"]["user"]["department"] == "ECE"
    assert new_user(client, admin, username="deputy", role="admin", organisation_id=None).status_code == 200


def test_new_accounts_work_with_the_rest_of_the_app(client, admin):
    pw = new_user(client, admin, username="codingrep").json()["data"]["temporary_password"]
    tok = client.post("/api/auth/login", json={"username": "codingrep", "password": pw}).json()["data"]["token"]
    h = {"Authorization": "Bearer " + tok}
    client.post("/api/auth/change-password", json={"current_password": pw, "new_password": "Better-pass-9"}, headers=h)
    rows = client.get("/api/bookings", headers=h).json()["data"]["requests"]
    assert rows and {r["request"]["requester"] for r in rows} == {"Coding Club"}          # sees its own club's requests only
    assert client.post("/api/schedules/generate", headers=h).status_code == 403


def test_deactivated_accounts_are_locked_out_at_once(client, admin):
    pw = new_user(client, admin).json()["data"]["temporary_password"]
    tok = client.post("/api/auth/login", json={"username": "newperson", "password": pw}).json()["data"]["token"]
    h = {"Authorization": "Bearer " + tok}
    r = client.patch("/api/admin/users/newperson", json={"is_active": False}, headers=admin)
    assert r.status_code == 200 and r.json()["data"]["is_active"] is False
    assert client.get("/api/auth/me", headers=h).status_code == 401                          # the token stopped working
    assert client.post("/api/auth/login", json={"username": "newperson", "password": pw}).status_code == 403
    assert client.patch("/api/admin/users/newperson", json={"is_active": True}, headers=admin).status_code == 200
    assert client.post("/api/auth/login", json={"username": "newperson", "password": pw}).status_code == 200


def test_admins_cannot_lock_themselves_out_or_remove_the_last_admin(client, admin):
    assert client.patch("/api/admin/users/admin", json={"is_active": False}, headers=admin).status_code == 409
    assert client.patch("/api/admin/users/admin", json={"role": "faculty"}, headers=admin).status_code == 409
    assert client.patch("/api/admin/users/admin2", json={"is_active": False}, headers=admin).status_code == 200      # another Admin remains
    assert client.patch("/api/admin/users/admin", json={"is_active": False}, headers=admin).status_code == 409        # now the only active Admin
    assert client.patch("/api/admin/users/admin2", json={"is_active": True}, headers=admin).status_code == 200


def test_editing_an_account_keeps_the_links_consistent(client, admin):
    new_user(client, admin, username="mover")
    r = client.patch("/api/admin/users/mover", json={"organisation_id": "org-quiz-club", "full_name": "Moved Person", "email": "m@cit.edu"}, headers=admin)
    d = r.json()["data"]
    assert r.status_code == 200 and d["organisation"] == "Quiz Club" and d["full_name"] == "Moved Person" and d["email"] == "m@cit.edu"
    assert client.patch("/api/admin/users/mover", json={"role": "department_coordinator", "department": "CSE"}, headers=admin).json()["data"]["organisation"] is None
    assert client.patch("/api/admin/users/mover", json={"role": "faculty"}, headers=admin).status_code == 422       # needs a faculty link
    assert client.patch("/api/admin/users/ghost", json={"full_name": "Nobody"}, headers=admin).status_code == 404


def test_password_reset_is_one_time_and_forces_a_change(client, admin):
    pw = new_user(client, admin).json()["data"]["temporary_password"]
    r = post(client, admin, "/api/admin/users/newperson/reset-password")
    new = r.json()["data"]["temporary_password"]
    assert new != pw and client.post("/api/auth/login", json={"username": "newperson", "password": pw}).status_code == 401
    assert client.post("/api/auth/login", json={"username": "newperson", "password": new}).json()["data"]["user"]["must_change_password"] is True
    assert post(client, admin, "/api/admin/users/ghost/reset-password").status_code == 404
    assert post(client, admin, "/api/admin/users/newperson/reset-password", {"password": "abc"}).status_code == 422


def test_organisations_lifecycle(client, admin):
    orgs = client.get("/api/admin/organisations", headers=admin).json()["data"]
    names = {o["name"]: o for o in orgs["organisations"]}
    assert names["Dramatics Society"]["type"] == "club" and names["Dramatics Society"]["members"] == 1
    assert names["CSE Department"]["type"] == "department" and names["Office of the Dean of Academics"]["type"] == "institute"
    r = post(client, admin, "/api/admin/organisations", {"name": "Chess Club", "type": "club", "description": "Boards and clocks"})
    assert r.status_code == 200
    oid = r.json()["data"]["id"]
    assert post(client, admin, "/api/admin/organisations", {"name": "chess club", "type": "club"}).status_code == 409
    assert post(client, admin, "/api/admin/organisations", {"name": "Odd", "type": "gang"}).status_code == 422
    assert post(client, admin, "/api/admin/organisations", {"name": "Dept thing", "type": "department", "department": "XYZ"}).status_code == 422
    new_user(client, admin, username="chessrep", organisation_id=oid)
    assert client.patch(f"/api/admin/organisations/{oid}", json={"name": "Chess Society"}, headers=admin).status_code == 200
    assert client.get("/api/admin/users/chessrep", headers=admin).json()["data"]["organisation"] == "Chess Society"     # members follow the rename
    assert client.patch(f"/api/admin/organisations/{oid}", json={"type": "department"}, headers=admin).status_code == 409   # a club rep belongs to it
    assert client.delete(f"/api/admin/organisations/{oid}", headers=admin).status_code == 409                                 # has a member
    assert post(client, admin, f"/api/admin/organisations/{oid}/status", {"status": "archived"}).json()["data"]["status"] == "archived"
    assert new_user(client, admin, username="late", organisation_id=oid).status_code == 422                                 # archived: no new members
    assert oid not in [o["id"] for o in client.get("/api/organisations", headers=admin).json()["data"]["organisations"]]
    post(client, admin, f"/api/admin/organisations/{oid}/status", {"status": "active"})
    lone = post(client, admin, "/api/admin/organisations", {"name": "Short Lived", "type": "club"}).json()["data"]["id"]
    assert client.delete(f"/api/admin/organisations/{lone}", headers=admin).status_code == 200
    assert client.delete("/api/admin/organisations/org-ghost", headers=admin).status_code == 404
    assert client.delete("/api/admin/organisations/org-dramatics-society", headers=admin).status_code == 409                 # member and requests


def test_every_signed_in_role_can_read_the_organisation_names_only(client, club):
    r = client.get("/api/organisations", headers=club)
    assert r.status_code == 200 and all(set(o) == {"id", "name", "type", "department"} for o in r.json()["data"]["organisations"])


def test_admin_reset_restores_the_demo_accounts_and_removes_added_ones(client, admin):
    new_user(client, admin)
    post(client, admin, "/api/admin/organisations", {"name": "Temp Club", "type": "club"})
    client.patch("/api/admin/organisations/org-dramatics-society", json={"name": "Renamed"}, headers=admin)
    post(client, admin, "/api/admin/users/club/reset-password", {"password": "Changed-pass-1"})
    assert client.post("/api/auth/login", json={"username": "club", "password": "Club@123"}).status_code == 401
    assert client.post("/api/admin/reset", headers=admin).status_code == 200
    users = {u["username"] for u in client.get("/api/admin/users", headers=admin).json()["data"]["users"]}
    orgs = {o["name"] for o in client.get("/api/admin/organisations", headers=admin).json()["data"]["organisations"]}
    assert "newperson" not in users and "Temp Club" not in orgs and "Dramatics Society" in orgs and "Renamed" not in orgs
    assert client.post("/api/auth/login", json={"username": "club", "password": "Club@123"}).status_code == 200
    assert client.get("/api/auth/me", headers=admin).status_code == 200                       # the Admin who pressed reset stays signed in


def test_no_second_admin_is_seeded_by_default(client, monkeypatch):
    from app import auth
    monkeypatch.delenv("SEED_SECOND_ADMIN")
    auth.seed_users()
    assert client.post("/api/auth/login", json={"username": "admin2", "password": "Admin@123"}).status_code == 401
    monkeypatch.setenv("SEED_SECOND_ADMIN", "true")
    auth.seed_users()
    assert client.post("/api/auth/login", json={"username": "admin2", "password": "Admin@123"}).status_code == 200


def test_every_stored_value_fits_its_column_so_postgres_accepts_it(client, admin):
    """SQLite ignores VARCHAR lengths, Postgres (the live database) refuses longer values: check them against the table definition."""
    from app import db
    new_user(client, admin, username="u" * 32, full_name="N" * 120)
    with db.engine.begin() as c:
        for table in (db.organisations, db.users):
            for row in c.execute(table.select()).mappings():
                for col in table.columns:
                    limit = getattr(col.type, "length", None)
                    v = row[col.name]
                    if limit and isinstance(v, str):
                        assert len(v) <= limit, f"{table.name}.{col.name} = {v!r} is longer than {limit}"
