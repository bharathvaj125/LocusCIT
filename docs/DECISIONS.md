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
| Several acceptable windows | A request is placed in the free slot that takes the fewest options from the requests still to be decided (ties: requested room, then earliest). A second pass lets a request move within its own windows so a later one fits. Priority order is never changed, so nobody ends up worse off |
| Alternatives | An alternative also avoids the last free slot of a later request |
| Move offers | Voluntary and optional, between two app bookings. The holder's approved booking is untouched until the holder agrees and a different approver approves the other request; a no, a timeout (default 5 min) or a stale offer changes nothing and never cancels anyone |
| Export | Only `approved`, `alternative_offered`, `rejected` are written; any other internal status resolves to a rejection with a reason |
