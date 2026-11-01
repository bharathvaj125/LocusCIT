"""Save a validator-clean, optimal timetable for the official dataset as the solver's warm start.
Usage: python backend/scripts/make_known_timetable.py exports/schedule.json   (a file produced by the app)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from app.core.dataset import load_dataset  # noqa: E402
from app.solver.generate import _check  # noqa: E402
from app.solver.known import FILE, fingerprint  # noqa: E402

ds = load_dataset(ROOT / "starter_pack" / "data" / "cit_public.json")
rows = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
rows = rows["sessions"] if isinstance(rows, dict) else rows
assign = {r["session_id"]: (r["day"], r["start_period"], r["room_id"]) for r in rows}
hard, soft, _ = _check(ds, assign)
assert not hard and len(assign) == len(ds["sessions"]), (hard, len(assign))
FILE.write_text(json.dumps({"fingerprint": fingerprint(ds), "soft_total": soft,
                            "sessions": {k: list(v) for k, v in sorted(assign.items())}}, separators=(",", ":")), encoding="utf-8")
print("saved", FILE, "soft", soft, "sessions", len(assign))
