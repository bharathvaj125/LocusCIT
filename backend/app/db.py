"""Persistence: SQLAlchemy Core. DATABASE_URL = Supabase Postgres in production, SQLite file for local dev."""
import json
import os
import threading
import time
from pathlib import Path

from sqlalchemy import Column, Float, Integer, MetaData, String, Table, Text, create_engine, select, text
from sqlalchemy.pool import NullPool

_default = "sqlite:///" + str(Path(__file__).resolve().parents[1] / "locuscit.db").replace("\\", "/")
URL = os.getenv("DATABASE_URL", _default)
if URL.startswith("postgresql://"):
    URL = URL.replace("postgresql://", "postgresql+psycopg://", 1)

_kw = {"connect_args": {"check_same_thread": False}} if URL.startswith("sqlite") else {"pool_pre_ping": True, "pool_size": 3, "max_overflow": 2}
engine = create_engine(URL, **_kw)
meta = MetaData()

users = Table("users", meta,
              Column("username", String(64), primary_key=True), Column("password_hash", String(100)),
              Column("role", String(32)), Column("display_name", String(120)),
              Column("department", String(32)), Column("faculty_id", String(16)), Column("org", String(120)))
workspace = Table("workspace", meta,
                  Column("id", String(32), primary_key=True), Column("revision", Integer),
                  Column("data", Text), Column("updated_at", Float))
audit = Table("audit", meta,
              Column("id", Integer, primary_key=True, autoincrement=True), Column("at", Float),
              Column("actor", String(64)), Column("action", String(64)), Column("detail", Text))

_lock = threading.Lock()


def init():
    meta.create_all(engine)


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
