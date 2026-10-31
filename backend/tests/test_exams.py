import importlib.util, pathlib
from app.core.dataset import load_dataset
from app.solver.exams import solve_exams
from app.solver.export import timetable_export

SP = pathlib.Path(__file__).resolve().parents[2] / "starter_pack"


def test_exams_pass_official_validator():
    data = load_dataset(SP / "data" / "cit_public.json")
    status, out = solve_exams(data, time_limit=30)
    assert out is not None and len(out) == 41, status
    spec = importlib.util.spec_from_file_location("v", SP / "validator.py")
    v = importlib.util.module_from_spec(spec); spec.loader.exec_module(v)
    ctx = v.Ctx(data)
    viol, pen = v.check_exams(ctx, out)
    assert viol == [], viol[:5]
    print("exam_soft_penalty", pen)
