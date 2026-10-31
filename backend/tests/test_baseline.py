import importlib.util, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
SP = ROOT / "starter_pack"


def _validator():
    spec = importlib.util.spec_from_file_location("official_validator", SP / "validator.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_baseline_has_zero_hard_violations():
    from app.core.dataset import load_dataset
    from app.solver.baseline import solve_timetable
    from app.solver.export import timetable_export
    data = load_dataset(SP / "data" / "cit_public.json")
    status, assign = solve_timetable(data, time_limit=60)
    assert assign is not None, status
    sched = timetable_export("test", data["dataset_id"], assign)
    rep = _validator().run(data, sched)
    assert len(assign) == len(data["sessions"])
    # exams are scheduled separately; only teaching rules are checked here
    teaching = {k: v for k, v in rep["hard_by_rule"].items() if not k.startswith("E")}
    assert not teaching, teaching
