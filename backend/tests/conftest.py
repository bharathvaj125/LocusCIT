import os
import tempfile
import time

import pytest

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(_tmp, "test.db").replace("\\", "/")
os.environ["JWT_SECRET"] = "test-secret"

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def login(client, username, password):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["data"]["token"]}


@pytest.fixture(scope="session")
def admin(client):
    return login(client, "admin", "Admin@123")


@pytest.fixture(scope="session")
def admin2(client):
    return login(client, "admin2", "Admin@123")


@pytest.fixture(scope="session")
def coordinator(client):
    return login(client, "coordinator", "Coord@123")


@pytest.fixture(scope="session")
def faculty(client):
    return login(client, "faculty", "Faculty@123")


@pytest.fixture(scope="session")
def club(client):
    return login(client, "club", "Club@123")


def wait(client, headers, url, busy=("RUNNING", "COMPUTING")):
    while True:
        j = client.get(url, headers=headers).json()["data"]
        if j["status"] not in busy:
            return j
        time.sleep(1.5)
