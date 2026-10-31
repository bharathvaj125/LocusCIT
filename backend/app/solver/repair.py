"""Minimal-move repair after a permanent disruption.

Strategy (each step only accepted if the model is feasible):
  1. Keep every untouched session where it is; only sessions the disruption directly breaks
     (plus new sessions) are free.  Moved count == directly-broken count is a proven minimum.
  2. Otherwise widen the free set to sessions that compete for the contested slots, minimising moves.
  3. Finally let every session move (full model), minimising moves, then soft cost.
"""
import time
from collections import defaultdict

from ..core.official import official_validator
from .baseline import solve_timetable
from .candidates import Eligibility, build_candidates

BIG = 10000


class ChangeFileError(ValueError):
    pass


def validate_changes(data, changes):
    """Reject malformed change files before touching any state."""
    if not isinstance(changes, dict) or not isinstance(changes.get("changes"), list):
        raise ChangeFileError("Change file must be an object with a 'changes' list")
    if changes.get("dataset") not in (None, data["dataset_id"]):
        raise ChangeFileError(f"Change file is for dataset {changes['dataset']}, loaded dataset is {data['dataset_id']}")
    fac = {f["id"] for f in data["faculty"]}
    rooms = {r["id"] for r in data["rooms"]}
    groups = {g["id"] for g in data["student_groups"]}
    sess = {s["id"] for s in data["sessions"]}
    days = set(data["calendar"]["days"])
    added_fac, added_sess = set(), set()
    for i, ch in enumerate(changes["changes"]):
        t = ch.get("type")
        where = f"change #{i + 1} ({t})"
        if t == "faculty_unavailable":
            if ch.get("faculty_id") not in fac | added_fac:
                raise ChangeFileError(f"{where}: unknown faculty {ch.get('faculty_id')}")
        elif t == "room_unavailable":
            if ch.get("room_id") not in rooms:
                raise ChangeFileError(f"{where}: unknown room {ch.get('room_id')}")
        elif t == "add_faculty":
            fid = (ch.get("faculty") or {}).get("id")
            if not fid or fid in fac | added_fac:
                raise ChangeFileError(f"{where}: faculty id missing or already exists ({fid})")
            added_fac.add(fid)
            ch["faculty"].setdefault("unavailable", [])
            ch["faculty"].setdefault("preferences", [])
        elif t == "add_session":
            s = ch.get("session") or {}
            need = ["id", "course_id", "kind", "groups", "faculty_id", "size", "duration", "room_types"]
            miss = [k for k in need if k not in s]
            if miss:
                raise ChangeFileError(f"{where}: session is missing {miss}")
            if s["id"] in sess | added_sess:
                raise ChangeFileError(f"{where}: session id {s['id']} already exists")
            if s["faculty_id"] not in fac | added_fac:
                raise ChangeFileError(f"{where}: unknown faculty {s['faculty_id']}")
            bad = [g for g in s["groups"] if g not in groups]
            if bad:
                raise ChangeFileError(f"{where}: unknown groups {bad}")
            added_sess.add(s["id"])
            s.setdefault("needs_accessible", False)
            s.setdefault("basket_slot", None)
            s.setdefault("fixed_slot", None)
        elif t == "remove_session":
            if ch.get("session_id") not in sess | added_sess:
                raise ChangeFileError(f"{where}: unknown session {ch.get('session_id')}")
        else:
            raise ChangeFileError(f"{where}: unsupported change type '{t}'")
        if t in ("faculty_unavailable", "room_unavailable"):
            if not set(ch.get("days", [])) <= days or not ch.get("days"):
                raise ChangeFileError(f"{where}: invalid days {ch.get('days')}")
            if not ch.get("periods"):
                raise ChangeFileError(f"{where}: periods missing")


def apply_changes(data, changes):
    validate_changes(data, changes)
    return official_validator().apply_disruption(data, changes)


def soft_cost(el, s, cand):
    """Cheap per-placement soft cost (S1, S5, S6) used only as a tie-breaker."""
    day, st, rid = cand
    per = range(st, st + s["duration"])
    cost = 0
    for pref in el.fac[s["faculty_id"]].get("preferences", []):
        if pref.get("type") == "avoid" and day in pref.get("days", el.days):
            cost += 2 * sum(1 for p in per if p in pref["periods"])
    r = el.rooms[rid]
    if r["capacity"] and s["size"] / r["capacity"] < 0.4:
        cost += 1
    if 9 in per:
        cost += 1
    return cost


def diagnose_session(data, s):
    """Plain-language reasons a session has no (or few) legal placements."""
    el = Eligibility(data)
    reasons = []
    rooms = [r for r in data["rooms"] if r["type"] in s["room_types"]]
    if not rooms:
        reasons.append(f"no room of type {s['room_types']} exists")
        return reasons
    big = [r for r in rooms if r["capacity"] >= s["size"]]
    if not big:
        reasons.append(f"no {s['room_types']} room seats {s['size']} (largest {max(r['capacity'] for r in rooms)})")
        return reasons
    if s.get("needs_accessible") and not any(r["accessible"] for r in big):
        reasons.append("needs an accessible room but no suitable room is accessible")
    starts = el.starts_for(s)
    if not starts:
        reasons.append("no legal start period (lunch / lab start rules)")
    free_days = [d for d in el.days if not any((d, p) in el.fac_un[s["faculty_id"]]
                                               for st in starts for p in range(st, st + s["duration"]))]
    if not free_days:
        reasons.append(f"faculty {s['faculty_id']} is unavailable in every legal slot")
    return reasons or ["every otherwise-legal slot is blocked by faculty or room unavailability"]


def _soft_objective(el, sessions, free, base, cands):
    """BIG per moved baseline session, plus the exact soft penalty as tie-breaker."""
    from .soft import soft_objective

    def objective(m, x, ctx):
        moved = []
        for sid in free:
            if sid not in base:
                continue
            v = x.get((sid, tuple(base[sid])))
            if v is not None:
                moved.append(BIG * (1 - v))
        return sum(moved) + soft_objective(m, x, ctx)
    return objective


def _neighbours(free, cands, base, sessions, k):
    """Baseline sessions competing for the k least-contested candidate slots of the free sessions."""
    occ_room, occ_fac, occ_grp = defaultdict(set), defaultdict(set), defaultdict(set)
    for sid, (d, st, r) in base.items():
        s = sessions.get(sid)
        if not s:
            continue
        for p in range(st, st + s["duration"]):
            occ_room[r, d, p].add(sid)
            occ_fac[s["faculty_id"], d, p].add(sid)
            for g in s["groups"]:
                occ_grp[g, d, p].add(sid)
    out = set()
    for sid in free:
        s = sessions[sid]
        scored = []
        for (d, st, r) in cands[sid]:
            hit = set()
            for p in range(st, st + s["duration"]):
                hit |= occ_room.get((r, d, p), set())
                hit |= occ_fac.get((s["faculty_id"], d, p), set())
                for g in s["groups"]:
                    hit |= occ_grp.get((g, d, p), set())
            hit.discard(sid)
            scored.append((len(hit), hit))
        scored.sort(key=lambda t: t[0])
        for _, hit in scored[:k]:
            out |= {h for h in hit if not sessions[h].get("basket_slot")}
    return out


def repair(data_after, baseline, time_limit=60.0, workers=8, seed=1, restrict=None):
    """Return a result dict.  `baseline`: sid -> (day, start, room) before the disruption.

    restrict: optional {session_id: predicate(candidate) -> bool} limiting where those sessions may go
    (used for "move my class off Monday morning" requests; nothing else about the dataset changes).
    """
    t0 = time.time()
    sessions = {s["id"]: s for s in data_after["sessions"]}
    el = Eligibility(data_after)
    base = {sid: tuple(v) for sid, v in baseline.items() if sid in sessions}
    removed = sorted(set(baseline) - set(sessions))
    new = sorted(set(sessions) - set(base))

    try:
        cands = build_candidates(data_after)
    except ValueError:
        empty = []
        for s in data_after["sessions"]:
            try:
                tmp = dict(data_after, sessions=[s])
                build_candidates(tmp)
            except ValueError:
                empty.append({"session_id": s["id"], "reasons": diagnose_session(data_after, s)})
        return {"status": "INFEASIBLE", "assignment": None, "diagnostics": empty,
                "message": "Some sessions have no legal placement after the change", "moved": [],
                "new_sessions": new, "removed_sessions": removed}

    for sid, pred in (restrict or {}).items():
        cands[sid] = [c for c in cands[sid] if pred(c)]
        if not cands[sid]:
            return {"status": "INFEASIBLE", "assignment": None, "moved": [], "new_sessions": new,
                    "removed_sessions": removed,
                    "diagnostics": [{"session_id": sid, "reasons": [
                        "no legal slot is left once your restrictions are applied (faculty/room availability and "
                        "the lab and lunch rules already remove many slots)"]}],
                    "message": f"{sid} has no legal slot that satisfies the restrictions"}

    invalid = sorted(sid for sid, c in base.items() if c not in set(cands[sid]))
    lower_bound = len(invalid)
    free = set(invalid) | set(new)
    best, level_used = None, None

    def attempt(free_set, limit, level):
        nonlocal best, level_used
        fixed = {sid: base[sid] for sid in base if sid not in free_set}
        obj = _soft_objective(el, sessions, free_set, base, cands)
        status, assign = solve_timetable(data_after, time_limit=limit, workers=workers, seed=seed,
                                         candidates=cands, fixed=fixed, objective=obj,
                                         hint=base)
        if assign is None:
            return status
        moved = sum(1 for sid in base if assign[sid] != base[sid])
        if best is None or moved < best[0]:
            best = (moved, assign, status)
            level_used = level
        return status

    remaining = lambda: max(5.0, time_limit - (time.time() - t0))
    s0 = attempt(free, min(20.0, remaining()), "directly-affected")
    proven = best is not None and best[0] == lower_bound
    status_seen = s0
    if best is None:
        for k, label in ((8, "nearby"), (40, "wider")):
            if time.time() - t0 > time_limit:
                break
            free2 = free | _neighbours(free, cands, base, sessions, k)
            status_seen = attempt(free2, min(30.0, remaining()), label)
            if best is not None:
                break
    if best is None or not proven:
        if time.time() - t0 < time_limit:
            st = attempt(set(sessions), remaining(), "full")
            status_seen = st
            if best is not None and st == "OPTIMAL":
                proven = True

    if best is None:
        kind = "INFEASIBLE" if status_seen == "INFEASIBLE" else "UNKNOWN"
        diag = [{"session_id": sid, "reasons": diagnose_session(data_after, sessions[sid])}
                for sid in sorted(free)][:10]
        msg = ("No timetable satisfies all hard constraints after this change"
               if kind == "INFEASIBLE" else "The solver ran out of time before finding or ruling out a repair")
        return {"status": kind, "assignment": None, "diagnostics": diag, "message": msg,
                "moved": [], "new_sessions": new, "removed_sessions": removed,
                "seconds": round(time.time() - t0, 1)}

    moved_count, assign, st = best
    moved = []
    for sid in sorted(base):
        if assign[sid] != base[sid]:
            moved.append({"session_id": sid, "old": _slot(base[sid]), "new": _slot(assign[sid]),
                          "reason": _reason(data_after, sessions[sid], base[sid], sid in invalid)})
    return {"status": "OK", "assignment": assign, "moved": moved, "moved_count": moved_count,
            "directly_affected": invalid, "new_sessions": new, "removed_sessions": removed,
            "proven_minimum": bool(proven), "lower_bound": lower_bound, "strategy": level_used,
            "solver_status": st, "seconds": round(time.time() - t0, 1)}


def _slot(c):
    return {"day": c[0], "start_period": c[1], "room_id": c[2]}


def _reason(data, s, old, directly):
    day, st, rid = old
    per = range(st, st + s["duration"])
    if directly:
        el = Eligibility(data)
        if any((day, p) in el.fac_un[s["faculty_id"]] for p in per):
            return f"Faculty {s['faculty_id']} is now unavailable on {day}"
        if any((day, p) in el.room_un[rid] for p in per):
            return f"Room {rid} is no longer available on {day}"
        return "Its previous slot is no longer legal after the change"
    return "Moved to free a room or time slot needed by another changed session"
