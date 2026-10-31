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
        self.schedule_version = 0     # bumps only when the active timetable changes
        self.baseline = None          # timetable before the first approved disruption
        self.proposals = {}
        self.applied = []
        self.exams = None             # list of exam assignments
        self.jobs = {}


WS = Workspace()
