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
| Admin scheduling directly | An Admin's booking that meets every rule (Schedule page or Assistant) is applied at once, with the reason recorded; one that would move classes or needs an alternative is suggested to the Admin, who accepts it to apply it |
| Priority order | Admin can reorder the event categories (exams and classes stay first). The judges' validator reads the order from the dataset, so restore the official order before exporting |
| Timetable visibility | Every role can read any group, teacher or room timetable; only requests and approvals are private
| Several acceptable windows | A request is placed in the free slot that takes the fewest options from the requests still to be decided (ties: requested room, then earliest). A second pass lets a request move within its own windows so a later one fits. Priority order is never changed, so nobody ends up worse off |
| Alternatives | An alternative also avoids the last free slot of a later request |
| Move offers | Voluntary and optional, between two app bookings. The holder's approved booking is untouched until the holder agrees and a different approver approves the other request; a no, a timeout (default 5 min) or a stale offer changes nothing and never cancels anyone |
| Export | Only `approved`, `alternative_offered`, `rejected` are written; any other internal status resolves to a rejection with a reason |

## Accounts, organisations and the second Admin
* Accounts and organisations live in the existing database (`users`, `organisations`); the `users` table gained columns through a small start-up migration, because the project has no migration tool.
* The sign-in identity stays the username. Roles keep being read from the database on every request, so deactivating or demoting someone takes effect immediately.
* No second Admin is seeded any more. The rule "nobody approves their own request" is unchanged, so an Admin who needs a change approved creates a second Admin under Users. Tests and local scripts that need one set `SEED_SECOND_ADMIN=true`. The old demo `admin2` row is removed at start-up when that is not set.
* Created and reset passwords are random, shown once and must be changed at first sign-in (the API refuses everything else until then).
* Reset Demo Data also restores the seeded accounts (with their demo passwords) and organisations and deletes those an Admin added, so a judge always starts clean.

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

## Fast generation: a saved best timetable as the starting point
**Problem.** Solving from scratch needs about 25 CPU seconds on a laptop (a valid but poor timetable, soft penalty 478, in ~4 s; the optimiser needs ~20 s more to reach 3, the proven minimum). The free Render instance has a fraction of one CPU, so the same work took about three minutes.
**Decision.** `backend/app/solver/known_timetable.json` holds a validator-clean timetable (soft penalty 3) for the official dataset, with a fingerprint of that dataset. *Generate* uses it as the starting point only if the fingerprint matches exactly, all 189 sessions are present, and the official validator reports no hard violation; the optimiser then runs from it and confirms nothing better exists (about 4 s of CPU instead of 25). If the dataset differs (an import, an edit), the file is stale, or the validator disagrees, the timetable is solved from scratch as before. `WARM_START=false` always solves from scratch. The Overview page says when a saved timetable was the starting point.
**Why it is honest.** The file is trusted for nothing: the same validator gate runs on every generation, and it was itself produced by the app (`exports/schedule.json`). Regenerate it with `backend/scripts/make_known_timetable.py`.

## The Admin reviews their own changes (replaces the second-Admin rule)
A second Admin made the demo hard to run and the approval message was unclear. Now: a timetable change is proposed with the fewest moves; the page lists every moved session with the reason (the room or teacher that broke it, or the class it makes room for); the Admin presses *Approve and apply* after the timetable is re-checked. An Admin's own booking that meets every rule is applied at once; one that would move classes is suggested first, with a reason for every move, and applied when the Admin accepts. Faculty, coordinators and club representatives still never decide their own request.

## Organisation members
The organiser's dataset names each club and office but gives no member counts. Seeded organisations now carry a members figure: our own placeholder sizes for clubs and offices, and the real student numbers for departments (CSE 155, ECE 135, EE 115, ME 115, CE 95). It is editable under Organisations. *Logins* is the number of accounts that can sign in for the organisation.
