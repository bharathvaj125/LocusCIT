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
