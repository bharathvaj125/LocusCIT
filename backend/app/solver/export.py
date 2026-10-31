"""Build the official schedule.json shape."""

def timetable_export(team, dataset_id, assign, fest_week=None, exams=None):
    out = {
        "team": team,
        "dataset_id": dataset_id,
        "sessions": [
            {"session_id": sid, "day": d, "start_period": st, "room_id": r}
            for sid, (d, st, r) in sorted(assign.items())
        ],
    }
    if fest_week is not None:
        out["fest_week"] = fest_week
    if exams is not None:
        out["exams"] = exams
    return out
