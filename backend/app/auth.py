"""JWT auth with four demo roles. Roles are always read from the verified token / users table."""
import os
import time
from collections import defaultdict

import bcrypt
import jwt
from fastapi import APIRouter, Depends, Header, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select

from . import db

SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGO = "HS256"
TTL = 12 * 3600
ROLES = ("admin", "department_coordinator", "faculty", "club")

DEMO_USERS = [
    # username, password, role, display name, department, faculty_id, org
    ("admin1", "Admin@123", "admin", "Dean's Office (Admin)", None, None, "Office of the Dean of Academics"),
    ("coordinator1", "Coord@123", "department_coordinator", "CSE Department Coordinator", "CSE", None, "CSE Department"),
    ("faculty1", "Faculty@123", "faculty", "Dr. Arjun Mehta (Faculty)", "CSE", "F06", None),
    ("club1", "Club@123", "club", "Dramatics Society (Club representative)", None, None, "Dramatics Society"),
]
# A second Admin is not seeded: an Admin creates one under Users when a different Admin has to approve a change.
# Tests and local scripts that need the extra account set SEED_SECOND_ADMIN=true.
LEGACY_DEMO = ("admin", "coordinator", "faculty", "club")
SECOND_ADMIN = ("admin2", "Admin@123", "admin", "Deputy Dean (second Admin)", None, None, "Office of the Dean of Academics")


def demo_users():
    return DEMO_USERS + ([SECOND_ADMIN] if os.getenv("SEED_SECOND_ADMIN", "").lower() == "true" else [])

router = APIRouter(prefix="/api")
_fails = defaultdict(list)


def hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=10)).decode()


def seed_users(force=False):
    now = time.time()
    with db.engine.begin() as c:
        if os.getenv("SEED_SECOND_ADMIN", "").lower() != "true":
            c.execute(db.users.delete().where(db.users.c.username == SECOND_ADMIN[0]))     # the old demo second Admin is retired
        c.execute(db.users.delete().where(db.users.c.username.in_(LEGACY_DEMO), db.users.c.is_seed == 1))    # the demo accounts used to be admin, faculty, ...
        have = {r[0] for r in c.execute(select(db.users.c.username))}
        orgs = {r[0]: r[1] for r in c.execute(select(db.organisations.c.name, db.organisations.c.id))}
        for u, pw, role, name, dept, fid, org in demo_users():
            if u in have and not force:
                vals = {"is_seed": 1, "organisation_id": orgs.get(org)}
                if u == "club1":      # the demo label used to say "Club rep"; the role is now spelled out everywhere
                    c.execute(db.users.update().where(db.users.c.username == u, db.users.c.display_name == "Dramatics Society (Club rep)").values(display_name=name))
                c.execute(db.users.update().where(db.users.c.username == u).values(**vals))
                continue
            if u in have:
                c.execute(db.users.delete().where(db.users.c.username == u))
            c.execute(db.users.insert().values(username=u, password_hash=hash_pw(pw), role=role, display_name=name, department=dept, faculty_id=fid,
                                               org=org, organisation_id=orgs.get(org), is_active=1, must_change_password=0, is_seed=1,
                                               created_by=None, created_at=now, updated_at=now))


def err(status, code, message):
    return JSONResponse(status_code=status, content={"success": False, "data": None, "errors": [
        {"code": code, "message": message, "details": None, "rule_ids": [], "related_entity_ids": []}]})


class AuthError(Exception):
    def __init__(self, status, code, message):
        self.status, self.code, self.message = status, code, message


ALLOWED_WHILE_PASSWORD_PENDING = ("/api/auth/me", "/api/auth/change-password", "/api/health")
USER_FIELDS = ("username", "role", "display_name", "department", "faculty_id", "org", "email", "organisation_id")


def public_user(row):
    out = {k: row[k] for k in USER_FIELDS}
    out["must_change_password"] = bool(row["must_change_password"])
    return out


def current_user(request: Request, authorization: str | None = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError(401, "UNAUTHORIZED", "Sign in first")
    try:
        claims = jwt.decode(authorization[7:], SECRET, algorithms=[ALGO])
    except jwt.PyJWTError:
        raise AuthError(401, "UNAUTHORIZED", "Session expired or invalid; sign in again")
    with db.engine.begin() as c:
        row = c.execute(select(db.users).where(db.users.c.username == claims.get("sub"))).mappings().first()
    if not row:
        raise AuthError(401, "UNAUTHORIZED", "Unknown user")
    if row["is_active"] == 0:
        raise AuthError(401, "UNAUTHORIZED", "This account has been deactivated. Ask an Admin.")
    if row["must_change_password"] and request.url.path not in ALLOWED_WHILE_PASSWORD_PENDING:
        raise AuthError(403, "PASSWORD_CHANGE_REQUIRED", "Choose a new password before you continue")
    return public_user(row)


def require(*roles):
    def dep(user=Depends(current_user)):
        if roles and user["role"] not in roles:
            raise AuthError(403, "FORBIDDEN", f"This action needs the role: {', '.join(roles)}")
        return user
    return dep


class LoginBody(BaseModel):
    username: str
    password: str


@router.post("/auth/login")
def login(body: LoginBody):
    now = time.time()
    _fails[body.username] = [t for t in _fails[body.username] if now - t < 60]
    if len(_fails[body.username]) >= 8:
        return err(429, "FORBIDDEN", "Too many failed attempts; wait a minute")
    with db.engine.begin() as c:
        row = c.execute(select(db.users).where(db.users.c.username == body.username.strip().lower())).mappings().first()
    if not row or not bcrypt.checkpw(body.password.encode(), row["password_hash"].encode()):
        _fails[body.username].append(now)
        return err(401, "UNAUTHORIZED", "Wrong username or password")
    if row["is_active"] == 0:
        return err(403, "FORBIDDEN", "This account has been deactivated. Ask an Admin.")
    token = jwt.encode({"sub": row["username"], "role": row["role"], "exp": int(now) + TTL}, SECRET, algorithm=ALGO)
    user = public_user(row)
    db.log(row["username"], "login")
    return {"success": True, "data": {"token": token, "user": user, "expires_in": TTL}, "errors": []}


class PasswordBody(BaseModel):
    current_password: str
    new_password: str


@router.post("/auth/change-password")
def change_password(body: PasswordBody, user=Depends(current_user)):
    import re
    with db.engine.begin() as c:
        row = c.execute(select(db.users).where(db.users.c.username == user["username"])).mappings().first()
        if not bcrypt.checkpw(body.current_password.encode(), row["password_hash"].encode()):
            return err(403, "FORBIDDEN", "The current password is not right")
        pw = body.new_password
        if len(pw) < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
            return err(422, "INVALID_INPUT", "A password needs at least 8 characters, with a letter and a digit")
        if pw == body.current_password:
            return err(422, "INVALID_INPUT", "Choose a password you have not used just now")
        c.execute(db.users.update().where(db.users.c.username == user["username"]).values(
            password_hash=hash_pw(pw), must_change_password=0, updated_at=time.time()))
    db.log(user["username"], "password_changed")
    return {"success": True, "data": {"changed": True}, "errors": []}


@router.get("/auth/me")
def me(user=Depends(current_user)):
    return {"success": True, "data": user, "errors": []}
