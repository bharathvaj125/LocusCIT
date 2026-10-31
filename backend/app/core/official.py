"""Load the unmodified official validator by file path (never edited)."""
import importlib.util
from pathlib import Path

_PATH = Path(__file__).resolve().parents[3] / "starter_pack" / "validator.py"
_mod = None


def official_validator():
    global _mod
    if _mod is None:
        spec = importlib.util.spec_from_file_location("official_validator", _PATH)
        _mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(_mod)
    return _mod
