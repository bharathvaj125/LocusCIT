"""JWT auth with four demo roles. Roles are always read from the verified token / users table."""
import os
import time
from collections import defaultdict

import bcrypt
import jwt
from fastapi import APIRouter, Depends, Header
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
    ("admin", "Admin@123", "admin", "Dean's Office (Admin)", None, None, "Office of the Dean of Academics"),
    ("admin2", "Admin@123", "admin", "Deputy Dean (second Admin)", None, None, "Office of the Dean of Academics"),
    ("coordinator", "Coord@123", "department_coordinator", "CSE Department Coordinator", "CSE", None, "CSE Department"),
    ("faculty", "Faculty@123", "faculty", "Dr. Arjun Mehta (Faculty)", "CSE", "F06", None),
    ("club", "Club@123", "club", "Dramatics Society (Club rep)", None, None, "Dramatics Society"),
]

router = APIRouter(prefix="/api")
_fails = defaultdict(list)


def hash_pw(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=10)).decode()


def seed_users(force=False):
    with db.engine.begin() as c:
        have = {r[0] for r in c.execute(select(db.users.c.username))}
        for u, pw, role, name, dept, fid, org in DEMO_USERS:
            if u in have and not force:
                continue
            if u in have:
                c.execute(db.users.delete().where(db.users.c.username == u))
            c.execute(db.users.insert().values(username=u, password_hash=hash_pw(pw), role=role,
                                               display_name=name, department=dept, faculty_id=fid, org=org))


def err(status, code, message):
    return JSONResponse(status_code=status, content={"success": False, "data": None, "errors": [
        {"code": code, "message": message, "details": None, "rule_ids": [], "related_entity_ids": []}]})


class AuthError(Exception):
    def __init__(self, status, code, message):
        self.status, self.code, self.message = status, code, message


def current_user(authorization: str | None = Header(default=None)):
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
    return {k: row[k] for k in ("username", "role", "display_name", "department", "faculty_id", "org")}


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
    token = jwt.encode({"sub": row["username"], "role": row["role"], "exp": int(now) + TTL}, SECRET, algorithm=ALGO)
    user = {k: row[k] for k in ("username", "role", "display_name", "department", "faculty_id", "org")}
    db.log(row["username"], "login")
    return {"success": True, "data": {"token": token, "user": user, "expires_in": TTL}, "errors": []}


@router.get("/auth/me")
def me(user=Depends(current_user)):
    return {"success": True, "data": user, "errors": []}
