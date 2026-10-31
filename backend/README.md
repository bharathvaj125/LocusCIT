# backend/ (Owner A)

FastAPI + OR-Tools CP-SAT. Owns scheduling, exams, bookings, disruption repair,
auth/roles, persistence, exports. Run notes will be added here.

## Run locally
```
py -3.13 -m venv .venv && .venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
.venv\Scripts\python -m pytest -q
```
Implemented so far: `GET /api/health`, `POST /api/schedules/generate` (202 + job id),
`GET /api/jobs/{id}`, `GET /api/schedules?view=group|faculty|room&id=...`.
No auth or database yet (in-memory workspace).
