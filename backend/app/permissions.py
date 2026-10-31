"""Who may do what with a booking request (problem statement, section 4). Every booking permission lives here.

* Admin: decides any request except their own; the only role that can approve a booking that moves classes.
* Department coordinator: decides requests for the labs their own department owns, never their own request and never
  one that moves classes.
* Faculty and club representatives: no approval authority at all.

Lab ownership is not part of the dataset, so it is stated here, from who teaches in each lab.
"""
from . import db

LAB_OWNERS = {
    "CS-LAB-1": ["CSE"], "CS-LAB-2": ["CSE"],
    "ELEC-LAB-1": ["ECE", "EE"], "ELEC-LAB-2": ["ECE", "EE"],
    "PHY-LAB": ["PH"], "MECH-WS": ["ME"], "CIVIL-LAB": ["CE"],
}


def lab_owners(room_id):
    return LAB_OWNERS.get(room_id, [])


def room_slot(sub):
    """The room this request would hold: the proposed placement, else the room it asked for."""
    p = sub.get("placement")
    return (p or {}).get("room_id") or (sub.get("request") or {}).get("requested_room")


def routing(sub):
    """Who can decide this request, in words and as data, independent of who is asking."""
    moves = sub.get("overrides") or []
    owners = lab_owners(room_slot(sub))
    if moves:
        return {"approver": "admin", "departments": [],
                "why": f"It moves {len(moves)} class(es) in Week 7, so only an Admin can approve it."}
    if owners:
        return {"approver": "coordinator_or_admin", "departments": owners,
                "why": f"{room_slot(sub)} is a lab of {' / '.join(owners)}: its department coordinator or an Admin can approve."}
    return {"approver": "admin", "departments": [], "why": "An Admin approves venue bookings."}


def check_decision(user, sub):
    """None if `user` may decide `sub` right now, else the plain-language reason they may not."""
    if user["username"] == sub["requester_username"]:
        return "You cannot approve or reject your own request; another approver has to decide it."
    role = user["role"]
    r = routing(sub)
    if role == "admin":
        return None
    if role == "department_coordinator":
        if sub.get("overrides"):
            return "This booking moves classes, so only an Admin can approve it."
        if user["department"] and user["department"] in r["departments"]:
            return None
        if r["departments"]:
            return (f"{room_slot(sub)} belongs to {' / '.join(r['departments'])}; a {user['department']} coordinator "
                    "can only decide bookings of their own department's labs.")
        return "Coordinators can only decide bookings of their own department's labs; this one needs an Admin."
    return "Your role has no authority to approve or reject booking requests."


def deny(user, sub, message):
    """Record an unauthorised attempt, then hand the message back for the 403."""
    db.log(user["username"], "approval_denied", f"{sub['id']}: {message}")
    return message


def can_see(user, sub):
    """Requests are private to their owner, the approvers who may decide them, and Admin."""
    if user["role"] == "admin" or sub["requester_username"] == user["username"]:
        return True
    if user["role"] == "department_coordinator":
        return bool(user["department"]) and (sub.get("department") == user["department"]
                                              or user["department"] in lab_owners(room_slot(sub)))
    return False


def view_for(user, sub, public):
    """The request as `user` should see it: routing, whether they may decide it, and why not."""
    out = dict(public)
    blocked = check_decision(user, sub) if sub["status"] == "PENDING_APPROVAL" else "Already decided."
    out["routing"] = routing(sub)
    out["can_decide"] = blocked is None
    out["decide_blocked_reason"] = blocked
    return out
