# LocusCIT - Campus Scheduling and Venue Management

Crunch Week, TechZephyr 4.0 (IIT Bhubaneswar). A role-aware platform for the Chilika Institute of Technology (CIT) that
generates the semester timetable and midsem exams, decides Spectra-week venue bookings by priority, accepts
English/Hinglish booking requests, repairs the timetable after disruptions with the fewest moved sessions, and
applies changes only after an Admin approves. Every schedule is checked by the **official validator** before it is saved.

* Live app: _TBD (frontend)_
* API: https://locuscit.onrender.com (health: `/api/health`, docs: `/docs`)
* Video: _TBD_

## Architecture
```
 Browser (Next.js on Vercel)
        | HTTPS, JWT
        v
 FastAPI backend ---- OR-Tools CP-SAT (timetable, exams, minimal-move repair)
   - auth + roles (no self-approval)
   - deterministic booking engine (priority, role caps, displacement overrides)
   - rule-based English/Hinglish parser
   - optional LLM assist (off by default; never decides validity)
   - official validator.py (unmodified) as the final gate
        |
        v
 PostgreSQL (Supabase): workspace state, users, audit
 (a local SQLite file is used when DATABASE_URL is unset)
```
Validity is always decided by code. The LLM, if enabled, only suggests field values for a draft the user can edit.

## Demo accounts (also available on the deployed site)
| Role | Username | Password | Notes |
| --- | --- | --- | --- |
| Admin | `admin` | `Admin@123` | generate, import, reset, exports, approvals |
| Second Admin | `admin2` | `Admin@123` | approves what `admin` requested (no self-approval) |
| Department coordinator | `coordinator` | `Coord@123` | CSE department |
| Faculty | `faculty` | `Faculty@123` | Dr. Arjun Mehta (F06) |
| Club representative | `club` | `Club@123` | Dramatics Society |

## Layout
| Path | Purpose |
| --- | --- |
| `backend/` | FastAPI API, solvers, parsers, tests (see `backend/README.md`) |
| `frontend/` | Next.js web app |
| `starter_pack/` | Official dataset, `validator.py`, examples (unmodified) |
| `exports/` | `schedule.json`, `schedule_after.json` produced by the app |
| `docs/` | API contract, decisions, test report |

## Run locally
Backend (Python 3.13):
```
cd backend
py -3.13 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --port 8000
```
Open http://localhost:8000/docs. Copy `.env.example` to `.env` to use Supabase and your own `JWT_SECRET`.
Frontend: see `frontend/README.md`; set `NEXT_PUBLIC_API_BASE_URL`.

### Judge walkthrough (about 5 minutes)
1. Sign in as `admin`, press **Reset demo data**, then **Generate** (1-2 minutes; a valid timetable appears first, then improves).
2. Generate exams and evaluate the 25 Spectra requests; read the reason on each decision and open *Explain*.
3. As `club`, type `seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye`, edit the draft and submit.
4. As `admin`, upload `starter_pack/examples/sample_disruption.json` under Disruptions, inspect the moved sessions, then approve as `admin2`.
5. Download `schedule.json` and `schedule_after.json` and run `python starter_pack/validator.py ...`.

## Regenerate the exports
`cd backend && python scripts/generate_exports.py 90` drives the real API, writes `exports/*.json` and runs the validator.

## Known limitations
* One shared demo workspace: a reset by one judge affects others (stale clients get a 409 and must refresh).
* Bookings submitted through the app are checked against the live Week-7 state but are not part of the scored export.
* Solves take 1-2 minutes on a laptop; deploy on a host with at least 1-2 dedicated vCPUs.
* The AI assist needs your own API key; without it the deterministic parser and the manual form are used.
