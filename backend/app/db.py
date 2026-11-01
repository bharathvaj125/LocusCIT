"""Persistence: SQLAlchemy Core. DATABASE_URL = Supabase Postgres in production, SQLite file for local dev."""
import json
import os
import threading
import time
from pathlib import Path

from sqlalchemy import Column, Float, Integer, MetaData, String, Table, Text, create_engine, inspect, select, text
from sqlalchemy.pool import NullPool

_default = "sqlite:///" + str(Path(__file__).resolve().parents[1] / "locuscit.db").replace("\\", "/")
URL = os.getenv("DATABASE_URL", _default)
URL = URL.strip()
for _prefix in ("postgres://", "postgresql://"):
    if URL.startswith(_prefix):
        URL = "postgresql+psycopg://" + URL[len(_prefix):]

_kw = {"connect_args": {"check_same_thread": False}} if URL.startswith("sqlite") else {"pool_pre_ping": True, "pool_size": 3, "max_overflow": 2,
                                                                                      "connect_args": {"prepare_threshold": None}}
engine = create_engine(URL, **_kw)
meta = MetaData()

users = Table("users", meta,
              Column("username", String(64), primary_key=True), Column("password_hash", String(100)),
              Column("role", String(32)), Column("display_name", String(120)),
              Column("department", String(32)), Column("faculty_id", String(16)), Column("org", String(120)),
              # account management (added later; existing databases get these columns from migrate())
              Column("email", String(160)), Column("is_active", Integer, default=1), Column("must_change_password", Integer, default=0),
              Column("is_seed", Integer, default=0), Column("organisation_id", String(32)), Column("created_by", String(64)),
              Column("created_at", Float), Column("updated_at", Float))
organisations = Table("organisations", meta,
                      Column("id", String(32), primary_key=True), Column("name", String(120), unique=True),
                      Column("slug", String(80), unique=True), Column("type", String(24)), Column("department", String(32)),
                      Column("description", Text), Column("status", String(16)), Column("is_seed", Integer, default=0),
                      Column("created_by", String(64)), Column("created_at", Float), Column("updated_at", Float))
workspace = Table("workspace", meta,
                  Column("id", String(32), primary_key=True), Column("revision", Integer),
                  Column("data", Text), Column("updated_at", Float))
audit = Table("audit", meta,
              Column("id", Integer, primary_key=True, autoincrement=True), Column("at", Float),
              Column("actor", String(64)), Column("action", String(64)), Column("detail", Text))

_lock = threading.Lock()


_NEW_USER_COLUMNS = {"email": "VARCHAR(160)", "is_active": "INTEGER DEFAULT 1", "must_change_password": "INTEGER DEFAULT 0",
                     "is_seed": "INTEGER DEFAULT 0", "organisation_id": "VARCHAR(32)", "created_by": "VARCHAR(64)",
                     "created_at": "DOUBLE PRECISION" , "updated_at": "DOUBLE PRECISION"}


def migrate():
    """Add the account-management columns to a users table created before they existed (no migration tool is used)."""
    have = {c["name"] for c in inspect(engine).get_columns("users")}
    kind = "REAL" if URL.startswith("sqlite") else "DOUBLE PRECISION"
    with engine.begin() as c:
        for name, ddl in _NEW_USER_COLUMNS.items():
            if name not in have:
                c.execute(text(f"ALTER TABLE users ADD COLUMN {name} {ddl.replace('DOUBLE PRECISION', kind)}"))
        c.execute(text("UPDATE users SET is_active = 1 WHERE is_active IS NULL"))
        c.execute(text("UPDATE users SET must_change_password = 0 WHERE must_change_password IS NULL"))
        c.execute(text("UPDATE users SET is_seed = 0 WHERE is_seed IS NULL"))


def init():
    meta.create_all(engine)
    migrate()


def save_workspace(ws_id, revision, blob):
    with _lock, engine.begin() as c:
        row = c.execute(select(workspace.c.id).where(workspace.c.id == ws_id)).first()
        vals = {"revision": revision, "data": json.dumps(blob), "updated_at": time.time()}
        if row:
            c.execute(workspace.update().where(workspace.c.id == ws_id).values(**vals))
        else:
            c.execute(workspace.insert().values(id=ws_id, **vals))


def load_workspace(ws_id):
    with engine.begin() as c:
        row = c.execute(select(workspace.c.data).where(workspace.c.id == ws_id)).first()
    return json.loads(row[0]) if row else None


def log(actor, action, detail=""):
    try:
        with engine.begin() as c:
            c.execute(audit.insert().values(at=time.time(), actor=actor or "-", action=action, detail=str(detail)[:2000]))
    except Exception:
        pass
