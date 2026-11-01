"""Admin-managed user accounts and organisations. Everything is stored in the existing database (users, organisations);
nothing here lives in memory only. Public sign-up does not exist: an Admin creates every account.

Rules enforced here (the web screens only mirror them):
  * username is the sign-in identity: 3-32 characters of a-z 0-9 . _ - and unique
  * faculty accounts are linked to exactly one faculty record of the loaded dataset, and the department follows it
  * coordinators belong to a department; club representatives belong to one active club organisation
  * a deactivated account cannot sign in and its existing tokens stop working at once
  * an Admin cannot deactivate or demote themselves, and the last active Admin can never be removed
  * created and reset passwords are random, shown once, stored only as a bcrypt hash, and must be changed at first sign-in
  * Admin Reset Demo Data also restores the seeded accounts and organisations and removes the ones an Admin added
"""
import re
import secrets
import time
import uuid

from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select

from . import auth, db
from .api import fail, ok
from .auth import ROLES, current_user, hash_pw, require
from .core.dataset import load_dataset
from .state import SEED, WS

router = APIRouter(prefix="/api")
ORG_TYPES = {"club": "Student club", "department": "Department organisation", "institute": "Institute organisation"}
ROLE_ORG_TYPE = {"club": "club", "department_coordinator": "department"}
ROLE_LABEL = {"admin": "Admin", "department_coordinator": "Department coordinator", "faculty": "Faculty", "club": "Club representative"}
USERNAME = re.compile(r"^[a-z0-9][a-z0-9._-]{2,31}$")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_PW_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"


def gen_password():
    while True:
        p = "".join(secrets.choice(_PW_ALPHABET) for _ in range(12))
        if re.search(r"[a-z]", p) and re.search(r"[A-Z]", p) and re.search(r"\d", p):
            return p


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:60] or "org"


def _now():
    return time.time()


# ------------------------------------------------------------------------------------------------ organisations
# The organiser's dataset names the clubs and offices that make requests but gives no member counts, so these sizes are our own
# placeholders for the demo (an Admin can change any of them under Organisations). Departments use the real student numbers.
CLUB_MEMBERS = {"Astronomy Club": 45, "Coding Club": 120, "Dance Club": 60, "Dramatics Society": 55, "E-Cell": 90, "Gaming Society": 70,
                "Literary Society": 40, "Music Club": 65, "Photography Club": 50, "Quiz Club": 35, "Robotics Club": 80}
OFFICE_MEMBERS = {"Spectra Core Team": 30, "Training and Placement Cell": 12, "Office of the Dean of Academics": 8}
DEPT_OF = {"CSE Department": "CSE", "ECE Department": "ECE", "EE Department": "EE", "ME Department": "ME", "Civil Engineering Department": "CE"}


def default_members(name, otype, ds):
    if name in DEPT_OF:
        return sum(g["size"] for g in ds["student_groups"] if g["department"] == DEPT_OF[name])
    if name in CLUB_MEMBERS:
        return CLUB_MEMBERS[name]
    if name in OFFICE_MEMBERS:
        return OFFICE_MEMBERS[name]
    return {"club": 40, "department": 0, "institute": 10}.get(otype, 0)


def seed_organisations():
    """Create the organisations behind the demo data: every club, department and institute body that appears as a
    requester in the dataset, plus the two that the demo accounts belong to. Existing rows are left alone."""
    ds = load_dataset(SEED)
    wanted = {"Office of the Dean of Academics": ("institute", None), "CSE Department": ("department", "CSE")}
    for r in ds["booking_requests"]:
        t = {"club": "club", "department_coordinator": "department", "admin": "institute"}.get(r["role"])
        if t and r["requester"] not in wanted:
            wanted[r["requester"]] = (t, None)
    with db.engine.begin() as c:
        have = {x[0] for x in c.execute(select(db.organisations.c.name))}
        for name, (t, dept) in wanted.items():
            if name in have:
                continue
            slug = slugify(name)
            c.execute(db.organisations.insert().values(
                id=("org-" + slug)[:32], name=name, slug=slug, type=t, department=dept, description="", status="active",
                is_seed=1, created_by=None, created_at=_now(), updated_at=_now(), member_count=default_members(name, t, ds)))
        for r in c.execute(select(db.organisations)).mappings().all():        # organisations created before member counts existed
            if r["member_count"] is None:
                c.execute(db.organisations.update().where(db.organisations.c.id == r["id"]).values(member_count=default_members(r["name"], r["type"], ds) if r["is_seed"] else 0))


def _org_row(c, org_id):
    return c.execute(select(db.organisations).where(db.organisations.c.id == org_id)).mappings().first()


def _members(c, org_id):
    return c.execute(select(func.count()).select_from(db.users).where(db.users.c.organisation_id == org_id)).scalar() or 0


def _requests_by(name):
    n = sum(1 for r in WS.dataset["booking_requests"] if r["requester"] == name)
    return n + sum(1 for s in WS.submissions.values() if s.get("requester") == name)


def org_view(c, row):
    return {"id": row["id"], "name": row["name"], "slug": row["slug"], "type": row["type"], "type_label": ORG_TYPES.get(row["type"], row["type"]),
            "department": row["department"], "description": row["description"] or "", "status": row["status"],
            "is_seed": bool(row["is_seed"]), "created_by": row["created_by"], "created_at": row["created_at"], "updated_at": row["updated_at"],
            "members": row["member_count"] or 0, "accounts": _members(c, row["id"]), "requests": _requests_by(row["name"])}


def departments():
    ds = WS.dataset
    return sorted({f["department"] for f in ds["faculty"] if f["department"] != "ADMIN"} | {g["department"] for g in ds["student_groups"]
                                                                                            if g["department"] != "COMMON"})


class OrgBody(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    type: str
    department: str | None = None
    description: str | None = Field(default=None, max_length=500)
    member_count: int | None = Field(default=None, ge=0, le=100000)


class OrgPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    type: str | None = None
    department: str | None = None
    description: str | None = Field(default=None, max_length=500)
    member_count: int | None = Field(default=None, ge=0, le=100000)


def _check_org(name, otype, dept):
    if otype not in ORG_TYPES:
        return f"Organisation type must be one of: {', '.join(ORG_TYPES)}"
    if otype == "department" and dept and dept not in departments():
        return f"Unknown department {dept}. Choose one of: {', '.join(departments())}"
    return None


@router.get("/organisations")
def organisations_public(user=Depends(current_user)):
    """Read-only list for every signed-in role (names only)."""
    with db.engine.begin() as c:
        rows = c.execute(select(db.organisations).where(db.organisations.c.status == "active").order_by(db.organisations.c.name)).mappings().all()
    return ok({"organisations": [{"id": r["id"], "name": r["name"], "type": r["type"], "department": r["department"]} for r in rows]})


@router.get("/admin/organisations", dependencies=[Depends(require("admin"))])
def organisations_list(type: str | None = None, status: str | None = None, q: str | None = None):
    with db.engine.begin() as c:
        rows = c.execute(select(db.organisations).order_by(db.organisations.c.name)).mappings().all()
        out = [org_view(c, r) for r in rows]
    if type:
        out = [o for o in out if o["type"] == type]
    if status:
        out = [o for o in out if o["status"] == status]
    if q:
        out = [o for o in out if q.lower() in o["name"].lower() or q.lower() in (o["department"] or "").lower()]
    return ok({"organisations": out, "types": [{"id": k, "label": v} for k, v in ORG_TYPES.items()], "departments": departments()})


@router.post("/admin/organisations")
def organisation_create(body: OrgBody, user=Depends(require("admin"))):
    name = re.sub(r"\s+", " ", body.name).strip()
    bad = _check_org(name, body.type, body.department)
    if bad:
        return fail(422, "INVALID_INPUT", bad)
    slug = slugify(name)
    with db.engine.begin() as c:
        if c.execute(select(db.organisations.c.id).where(or_(func.lower(db.organisations.c.name) == name.lower(), db.organisations.c.slug == slug))).first():
            return fail(409, "INVALID_INPUT", f"An organisation called '{name}' already exists")
        oid = "org-" + uuid.uuid4().hex[:8]
        c.execute(db.organisations.insert().values(id=oid, name=name, slug=slug, type=body.type, department=body.department if body.type == "department" else None,
                                                   description=(body.description or "").strip(), status="active", is_seed=0, created_by=user["username"],
                                                   created_at=_now(), updated_at=_now(), member_count=body.member_count or 0))
        row = _org_row(c, oid)
        out = org_view(c, row)
    db.log(user["username"], "organisation_create", f"{oid} {name}")
    return ok(out)


@router.patch("/admin/organisations/{oid}")
def organisation_update(oid: str, body: OrgPatch, user=Depends(require("admin"))):
    with db.engine.begin() as c:
        row = _org_row(c, oid)
        if not row:
            return fail(404, "INVALID_INPUT", "Unknown organisation")
        name = re.sub(r"\s+", " ", body.name).strip() if body.name else row["name"]
        otype = body.type or row["type"]
        dept = body.department if body.department is not None else row["department"]
        bad = _check_org(name, otype, dept)
        if bad:
            return fail(422, "INVALID_INPUT", bad)
        members = c.execute(select(db.users).where(db.users.c.organisation_id == oid)).mappings().all()
        if otype != row["type"]:
            clash = [m["username"] for m in members if ROLE_ORG_TYPE.get(m["role"]) and ROLE_ORG_TYPE[m["role"]] != otype]
            if clash:
                return fail(409, "INVALID_INPUT", f"Cannot change the type: {', '.join(clash)} belong to it and need a {ORG_TYPES[ROLE_ORG_TYPE[members[0]['role']]]}" if members else "Type change not allowed")
        if name != row["name"] and c.execute(select(db.organisations.c.id).where(func.lower(db.organisations.c.name) == name.lower(), db.organisations.c.id != oid)).first():
            return fail(409, "INVALID_INPUT", f"An organisation called '{name}' already exists")
        c.execute(db.organisations.update().where(db.organisations.c.id == oid).values(
            name=name, slug=slugify(name), type=otype, department=dept if otype == "department" else None,
            description=(body.description if body.description is not None else row["description"]) or "", updated_at=_now(),
            member_count=body.member_count if body.member_count is not None else row["member_count"]))
        if name != row["name"]:        # members sign requests with the organisation name
            c.execute(db.users.update().where(db.users.c.organisation_id == oid).values(org=name, updated_at=_now()))
        out = org_view(c, _org_row(c, oid))
    db.log(user["username"], "organisation_update", f"{oid} {name}")
    return ok(out)


@router.post("/admin/organisations/{oid}/status")
def organisation_status(oid: str, status: str = Body(..., embed=True), user=Depends(require("admin"))):
    if status not in ("active", "archived"):
        return fail(422, "INVALID_INPUT", "status must be active or archived")
    with db.engine.begin() as c:
        row = _org_row(c, oid)
        if not row:
            return fail(404, "INVALID_INPUT", "Unknown organisation")
        c.execute(db.organisations.update().where(db.organisations.c.id == oid).values(status=status, updated_at=_now()))
        out = org_view(c, _org_row(c, oid))
    db.log(user["username"], f"organisation_{status}", oid)
    return ok(out)


@router.delete("/admin/organisations/{oid}")
def organisation_delete(oid: str, user=Depends(require("admin"))):
    with db.engine.begin() as c:
        row = _org_row(c, oid)
        if not row:
            return fail(404, "INVALID_INPUT", "Unknown organisation")
        if _members(c, oid):
            return fail(409, "INVALID_INPUT", "It still has members. Move or deactivate them first, or archive the organisation instead.")
        if _requests_by(row["name"]):
            return fail(409, "INVALID_INPUT", "Booking requests were made in its name, so it cannot be deleted. Archive it instead.")
        c.execute(db.organisations.delete().where(db.organisations.c.id == oid))
    db.log(user["username"], "organisation_delete", f"{oid} {row['name']}")
    return ok({"deleted": oid})


# ------------------------------------------------------------------------------------------------------ users
def _faculty(fid):
    return next((f for f in WS.dataset["faculty"] if f["id"] == fid), None)


def user_view(row, org_names=None):
    f = _faculty(row["faculty_id"]) if row["faculty_id"] else None
    return {"username": row["username"], "full_name": row["display_name"], "email": row["email"], "role": row["role"],
            "role_label": ROLE_LABEL.get(row["role"], row["role"]), "department": row["department"], "faculty_id": row["faculty_id"],
            "faculty_name": f["name"] if f else None, "organisation_id": row["organisation_id"], "organisation": row["org"],
            "is_active": bool(row["is_active"] if row["is_active"] is not None else 1), "must_change_password": bool(row["must_change_password"]),
            "is_seed": bool(row["is_seed"]), "created_by": row["created_by"], "created_at": row["created_at"], "updated_at": row["updated_at"]}


class UserBody(BaseModel):
    username: str
    full_name: str = Field(min_length=2, max_length=120)
    role: str
    email: str | None = Field(default=None, max_length=160)
    department: str | None = None
    faculty_id: str | None = None
    organisation_id: str | None = None
    password: str | None = Field(default=None, max_length=128)


class UserPatch(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    role: str | None = None
    email: str | None = Field(default=None, max_length=160)
    department: str | None = None
    faculty_id: str | None = None
    organisation_id: str | None = None
    is_active: bool | None = None


def _resolve(c, role, department, faculty_id, organisation_id, username):
    """Role-specific rules. Returns (department, faculty_id, organisation row or None, error message)."""
    org = _org_row(c, organisation_id) if organisation_id else None
    if organisation_id and not org:
        return None, None, None, "Unknown organisation"
    if org and org["status"] != "active":
        return None, None, None, f"{org['name']} is archived. Restore it first or choose another organisation."
    if role == "faculty":
        if not faculty_id:
            return None, None, None, "A faculty account must be linked to a faculty member of the timetable"
        f = _faculty(faculty_id)
        if not f:
            return None, None, None, f"Unknown faculty member {faculty_id}"
        taken = c.execute(select(db.users.c.username).where(db.users.c.faculty_id == faculty_id, db.users.c.username != username)).first()
        if taken:
            return None, None, None, f"{f['name']} ({faculty_id}) is already linked to the account '{taken[0]}'"
        return f["department"], faculty_id, org, None
    if faculty_id:
        return None, None, None, "Only faculty accounts are linked to a faculty member"
    if role == "department_coordinator":
        if not department or department not in departments():
            return None, None, None, f"A coordinator needs a department. Choose one of: {', '.join(departments())}"
        if org and org["type"] != "department":
            return None, None, None, "A coordinator can only belong to a department organisation"
        return department, None, org, None
    if role == "club":
        if not org:
            return None, None, None, "A club representative must belong to a club. Choose or create the organisation first"
        if org["type"] != "club":
            return None, None, None, f"{org['name']} is not a student club"
        return None, None, org, None
    return None, None, org, None            # admin


def _active_admins(c, excluding=None):
    q = select(func.count()).select_from(db.users).where(db.users.c.role == "admin", db.users.c.is_active == 1)
    if excluding:
        q = q.where(db.users.c.username != excluding)
    return c.execute(q).scalar() or 0


@router.get("/admin/users/meta", dependencies=[Depends(require("admin"))])
def users_meta():
    with db.engine.begin() as c:
        linked = {r[0]: r[1] for r in c.execute(select(db.users.c.faculty_id, db.users.c.username).where(db.users.c.faculty_id.is_not(None)))}
        orgs = c.execute(select(db.organisations).where(db.organisations.c.status == "active").order_by(db.organisations.c.name)).mappings().all()
    return ok({"roles": [{"id": r, "label": ROLE_LABEL[r]} for r in ROLES], "departments": departments(),
               "faculty": [{"id": f["id"], "name": f["name"], "department": f["department"], "linked_to": linked.get(f["id"])} for f in WS.dataset["faculty"]],
               "organisations": [{"id": o["id"], "name": o["name"], "type": o["type"], "department": o["department"]} for o in orgs]})


@router.get("/admin/users", dependencies=[Depends(require("admin"))])
def users_list(role: str | None = None, status: str | None = None, q: str | None = None):
    with db.engine.begin() as c:
        rows = c.execute(select(db.users).order_by(db.users.c.role, db.users.c.username)).mappings().all()
    out = [user_view(r) for r in rows]
    if role:
        out = [u for u in out if u["role"] == role]
    if status:
        out = [u for u in out if (u["is_active"] if status == "active" else not u["is_active"])]
    if q:
        ql = q.lower()
        out = [u for u in out if ql in u["username"].lower() or ql in u["full_name"].lower() or ql in (u["organisation"] or "").lower() or ql in (u["email"] or "").lower()]
    return ok({"users": out, "total": len(rows)})


@router.post("/admin/users")
def user_create(body: UserBody, user=Depends(require("admin"))):
    username = body.username.strip().lower()
    if not USERNAME.match(username):
        return fail(422, "INVALID_INPUT", "The username must be 3 to 32 characters: letters, digits, dot, dash or underscore")
    if body.role not in ROLES:
        return fail(422, "INVALID_INPUT", f"Role must be one of: {', '.join(ROLES)}")
    email = (body.email or "").strip() or None
    if email and not EMAIL.match(email):
        return fail(422, "INVALID_INPUT", "That email address does not look right")
    pw = body.password or gen_password()
    if body.password and (len(pw) < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw)):
        return fail(422, "INVALID_INPUT", "A password needs at least 8 characters, with a letter and a digit")
    with db.engine.begin() as c:
        if c.execute(select(db.users.c.username).where(db.users.c.username == username)).first():
            return fail(409, "INVALID_INPUT", f"The username '{username}' is already taken")
        if email and c.execute(select(db.users.c.username).where(func.lower(db.users.c.email) == email.lower())).first():
            return fail(409, "INVALID_INPUT", "Another account already uses that email address")
        dept, fid, org, err = _resolve(c, body.role, body.department, body.faculty_id, body.organisation_id, username)
        if err:
            return fail(422, "INVALID_INPUT", err)
        c.execute(db.users.insert().values(
            username=username, password_hash=hash_pw(pw), role=body.role, display_name=re.sub(r"\s+", " ", body.full_name).strip(), department=dept,
            faculty_id=fid, org=org["name"] if org else None, organisation_id=org["id"] if org else None, email=email, is_active=1,
            must_change_password=1, is_seed=0, created_by=user["username"], created_at=_now(), updated_at=_now()))
        row = c.execute(select(db.users).where(db.users.c.username == username)).mappings().first()
        out = user_view(row)
    db.log(user["username"], "user_create", f"{username} ({body.role})")
    return ok({"user": out, "temporary_password": pw, "note": "Shown once. The person must change it at first sign-in."})


@router.get("/admin/users/{username}")
def user_get(username: str, user=Depends(require("admin"))):
    with db.engine.begin() as c:
        row = c.execute(select(db.users).where(db.users.c.username == username.lower())).mappings().first()
    if not row:
        return fail(404, "INVALID_INPUT", "Unknown user")
    return ok(user_view(row))


@router.patch("/admin/users/{username}")
def user_update(username: str, body: UserPatch, user=Depends(require("admin"))):
    username = username.lower()
    with db.engine.begin() as c:
        row = c.execute(select(db.users).where(db.users.c.username == username)).mappings().first()
        if not row:
            return fail(404, "INVALID_INPUT", "Unknown user")
        role = body.role or row["role"]
        if role not in ROLES:
            return fail(422, "INVALID_INPUT", f"Role must be one of: {', '.join(ROLES)}")
        active = row["is_active"] if body.is_active is None else int(body.is_active)
        me = username == user["username"]
        if me and (role != row["role"] or not active):
            return fail(409, "INVALID_INPUT", "You cannot change your own role or deactivate your own account. Ask another Admin.")
        if row["role"] == "admin" and (role != "admin" or not active) and row["is_active"] and _active_admins(c, excluding=username) == 0:
            return fail(409, "INVALID_INPUT", "This is the last active Admin. Create or activate another Admin first.")
        email = (body.email.strip() or None) if body.email is not None else row["email"]
        if email and not EMAIL.match(email):
            return fail(422, "INVALID_INPUT", "That email address does not look right")
        if email and email != row["email"] and c.execute(select(db.users.c.username).where(func.lower(db.users.c.email) == email.lower(), db.users.c.username != username)).first():
            return fail(409, "INVALID_INPUT", "Another account already uses that email address")
        # the linked records stay as they are unless the request changes them or the new role needs different ones
        fid = body.faculty_id if body.faculty_id is not None else (row["faculty_id"] if role == "faculty" else None)
        oid = body.organisation_id if body.organisation_id is not None else (row["organisation_id"] if role == row["role"] else None)   # a new role drops the old organisation
        dept = body.department if body.department is not None else (row["department"] if role == "department_coordinator" else None)
        d2, f2, org, err = _resolve(c, role, dept, fid, oid, username)
        if err:
            return fail(422, "INVALID_INPUT", err)
        c.execute(db.users.update().where(db.users.c.username == username).values(
            display_name=re.sub(r"\s+", " ", body.full_name).strip() if body.full_name else row["display_name"], role=role, email=email, department=d2,
            faculty_id=f2, org=org["name"] if org else None, organisation_id=org["id"] if org else None, is_active=active, updated_at=_now()))
        out = user_view(c.execute(select(db.users).where(db.users.c.username == username)).mappings().first())
    db.log(user["username"], "user_update", f"{username} role={role} active={bool(active)}")
    return ok(out)


@router.post("/admin/users/{username}/reset-password")
def user_reset_password(username: str, password: str | None = Body(default=None, embed=True), user=Depends(require("admin"))):
    username = username.lower()
    pw = password or gen_password()
    if password and (len(pw) < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw)):
        return fail(422, "INVALID_INPUT", "A password needs at least 8 characters, with a letter and a digit")
    with db.engine.begin() as c:
        row = c.execute(select(db.users).where(db.users.c.username == username)).mappings().first()
        if not row:
            return fail(404, "INVALID_INPUT", "Unknown user")
        c.execute(db.users.update().where(db.users.c.username == username).values(password_hash=hash_pw(pw), must_change_password=1, updated_at=_now()))
    auth._fails.pop(username, None)
    db.log(user["username"], "user_reset_password", username)
    return ok({"username": username, "temporary_password": pw, "note": "Shown once. The person must change it at first sign-in."})


# ------------------------------------------------------------------------------------------------ reset to seed
def restore_seed():
    """Admin Reset Demo Data: accounts and organisations an Admin added are removed; the seeded ones return to their demo state."""
    with db.engine.begin() as c:
        c.execute(db.users.delete().where(or_(db.users.c.is_seed.is_(None), db.users.c.is_seed != 1)))
        c.execute(db.organisations.delete())         # seeded ones come back below with their original names and status
    seed_organisations()
    auth.seed_users(force=True)
