# Decisions log

| Decision | Value |
| --- | --- |
| Stack | Next.js (Vercel) + FastAPI + OR-Tools CP-SAT + Supabase PostgreSQL |
| Auth | Own JWT (HS256) + bcrypt; five seeded demo users (two Admins so approvals can be tested) |
| Database | Workspace stored as one JSON document per workspace plus `users` and `audit` tables; reset is one transaction |
| Source of truth for validity | Unmodified official `validator.py`, imported and run inside the app on every save and approval |
| Runtime LLM | Optional (Anthropic API). Off by default; the deterministic parser is the primary path |
| Backend host | Needs at least 1-2 dedicated vCPUs and always on (CP-SAT); free tiers are too slow or sleep |
| Team name | LocusCIT |
| Lab ownership | The dataset has no department for a room, so it is fixed in `app/permissions.py` from who teaches in each lab (ELEC-LAB is shared by ECE and EE) |
| Class-moving bookings | Only an institute-level request can move classes (official rule B2), only for Week 7, only after an Admin other than the requester approves it; the moves are shown first and checked again at approval. They are kept apart from `schedule.json` because the export may only name dataset requests |
| Admin scheduling directly | An Admin booking an ordinary event is an administrative action and is booked at once; what moves classes waits for a second Admin |
| Priority order | Admin can reorder the event categories (exams and classes stay first). The judges' validator reads the order from the dataset, so restore the official order before exporting |
| Timetable visibility | Every role can read any group, teacher or room timetable; only requests and approvals are private
| Several acceptable windows | A request is placed in the free slot that takes the fewest options from the requests still to be decided (ties: requested room, then earliest). A second pass lets a request move within its own windows so a later one fits. Priority order is never changed, so nobody ends up worse off |
| Alternatives | An alternative also avoids the last free slot of a later request |
| Move offers | Voluntary and optional, between two app bookings. The holder's approved booking is untouched until the holder agrees and a different approver approves the other request; a no, a timeout (default 5 min) or a stale offer changes nothing and never cancels anyone |
| Export | Only `approved`, `alternative_offered`, `rejected` are written; any other internal status resolves to a rejection with a reason |

## Conflicts between requests that are not confirmed yet (booking engine review)
Reviewed against the eleven rules in the brief. The batch engine (official order: category, then earlier submission; only
slots inside the requested windows are ever approved; alternatives outside them are `alternative_offered`; nothing else is
`rejected`, always with a reason) was already correct and is unchanged. Three defects were found in the live approval flow
around it and fixed:

1. **Pending requests held no slot.** Two requests waiting for an approver could both be shown as approvable for the same
   room and time, so approving the lower-priority one first left the higher-priority one blocked. Now every request that is
   not confirmed (waiting for an approver, or an alternative waiting for its requester) is decided again together, in the
   official order, on top of what is confirmed (`reconcile_pending`). The higher-priority or earlier request keeps the slot;
   the other is moved to another slot inside its own windows, else offered an alternative outside them (requester must accept),
   else rejected with the reason. It runs after every submit, decision, cancellation, answer to an alternative, manual event and
   timetable change. A manual event cannot take a slot held by an earlier or higher-priority waiting request.
2. **Approving an alternative failed with a server error**: the official check treated the out-of-window slot as an
   approval. It now checks it as `alternative_offered`, so the approver can send the offer and the requester accepts or declines.
3. **Answering an alternative was unchecked and ambiguous.** Accepting now re-checks the slot against the live state and the
   official validator; declining closes the request as `REJECTED` with the reason "declined the alternative", keeps the declined
   slot on the record, and is never revived by recalculation.

Confirmed (`APPROVED`) bookings are never changed by recalculation. The only route to a confirmed slot is the existing move
offer, which the holder must accept and an approver must approve. An offered alternative whose slot is lost to a higher-priority
request goes back to an approver (`PENDING_APPROVAL`) with a "Recalculated" reason instead of changing silently. An approver who
opened a request before it was recalculated gets `409 STALE_PROPOSAL` rather than approving a different slot than they saw.
Exports are untouched: statuses stay `approved`, `alternative_offered`, `rejected`, and bookings made in the app are not exported.
