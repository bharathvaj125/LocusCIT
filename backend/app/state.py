"""In-memory workspace state (temporary; replaced by Postgres persistence)."""
import threading
from pathlib import Path

from .core.dataset import load_dataset

SEED = Path(__file__).resolve().parents[2] / "starter_pack" / "data" / "cit_public.json"
TEAM = "LocusCIT"


class Workspace:
    def __init__(self):
        self.lock = threading.Lock()
        self.revision = 1
        self.dataset = load_dataset(SEED)
        self.schedule = None          # sid -> (day, start, room)
        self.schedule_meta = {}
        self.bookings = None          # {'decisions': [...], 'overrides': [...]}
        self.exams = None             # list of exam assignments
        self.jobs = {}


WS = Workspace()
