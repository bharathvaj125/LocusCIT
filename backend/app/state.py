"""Single shared workspace (cached in memory, persisted to the database on every change)."""
import copy
import threading
from pathlib import Path

from . import db
from .core.dataset import load_dataset

SEED = Path(__file__).resolve().parents[2] / "starter_pack" / "data" / "cit_public.json"
TEAM = "LocusCIT"
WS_ID = "demo-1"

_PERSIST = ("revision", "dataset", "schedule", "schedule_meta", "bookings", "exams", "schedule_version",
            "baseline", "proposals", "applied", "submissions", "manual_events", "baseline_export", "baseline_dataset")


def _tup(d):
    return {k: tuple(v) for k, v in d.items()} if d else d


class Workspace:
    def __init__(self):
        self.lock = threading.RLock()
        self.jobs = {}
        self._clear(1)

    def _clear(self, revision):
        self.revision = revision
        self.dataset = load_dataset(SEED)
        self.schedule = None            # sid -> (day, start, room)
        self.schedule_meta = {}
        self.bookings = None            # {'decisions': [...], 'overrides': [...]}
        self.exams = None
        self.schedule_version = 0       # bumps only when the active timetable changes
        self.baseline = None            # timetable before the first approved disruption
        self.baseline_export = None     # full schedule.json as it was before the first approved disruption
        self.baseline_dataset = None    # the dataset that baseline export belongs to
        self.proposals = {}
        self.applied = []
        self.submissions = {}           # booking requests submitted through the app
        self.manual_events = {}

    # -- persistence ----------------------------------------------------------------------------
    def save(self):
        with self.lock:
            blob = {k: getattr(self, k) for k in _PERSIST}
            db.save_workspace(WS_ID, self.revision, blob)

    def load(self):
        blob = db.load_workspace(WS_ID)
        if not blob:
            return False
        with self.lock:
            for k in _PERSIST:
                if k in blob:
                    setattr(self, k, blob[k])
            self.schedule = _tup(self.schedule)
            self.baseline = _tup(self.baseline)
            for p in self.proposals.values():
                if p.get("_assignment"):
                    p["_assignment"] = _tup(p["_assignment"])
                if p.get("status") == "COMPUTING":
                    p["status"] = "ERROR"
                    p["message"] = "Server restarted while computing; propose again"
        return True

    def reset(self):
        """Restore the canonical demo state. Demo user accounts live in their own table and are kept."""
        with self.lock:
            self._clear(self.revision + 1)
            self.jobs = {}
            self.save()
            return self.revision

    def replace_dataset(self, data):
        with self.lock:
            rev = self.revision + 1
            self._clear(rev)
            self.dataset = copy.deepcopy(data)
            self.jobs = {}
            self.save()
            return self.revision


WS = Workspace()
