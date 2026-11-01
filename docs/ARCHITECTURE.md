# Architecture

Locus is a web app (Next.js) in front of one API (FastAPI). All scheduling logic lives in the API; the browser only shows state and sends requests.
The same diagram as a picture: [`architecture.svg`](architecture.svg).

## 1. System overview

```mermaid
flowchart LR
  subgraph Browser["Browser - Next.js 15 on Vercel"]
    UI["Pages: Overview, Timetable, Exams, Venues, Assistant,<br/>Approvals, Changes, Exports, Users, Organisations"]
    CTX["AppProvider: reference data + 15 s dashboard poll"]
  end
  subgraph API["FastAPI on Render"]
    AUTH["auth.py + permissions.py<br/>JWT, roles read from the database"]
    ROUTES["api*.py<br/>campus, bookings, negotiation,<br/>repair, admin, explain, faculty"]
    ENGINE["Booking engine (solver/bookings.py)<br/>priority, role caps, displacement, reconcile"]
    NLP["nlp.py<br/>English and Hinglish parser"]
    AI["ai.py (optional)<br/>LLM suggestion, off by default"]
    SOLVER["OR-Tools CP-SAT<br/>generate, exams, repair"]
    VALID["Official validator.py (unmodified)<br/>final gate on every export"]
  end
  DB[("PostgreSQL on Supabase<br/>SQLite when DATABASE_URL is unset")]

  UI -- "HTTPS + JWT" --> AUTH
  CTX --> ROUTES
  AUTH --> ROUTES
  ROUTES --> ENGINE
  ROUTES --> SOLVER
  ROUTES --> NLP
  NLP -. "only if AI_ENABLED" .-> AI
  SOLVER --> VALID
  ENGINE --> VALID
  ROUTES --> DB
```

Validity is always decided by code. The optional LLM only suggests field values for a draft that the user can edit and that the rules check afterwards.

## 2. Request lifecycle: a venue booking

```mermaid
sequenceDiagram
  actor R as Requester (club / faculty / coordinator)
  participant W as Web app
  participant A as API
  participant E as Booking engine
  actor P as Approver (Admin, or coordinator for own labs)
  R->>W: "seminar hall kal shaam 6 baje, 100 log, mic"
  W->>A: POST /api/bookings/parse
  A-->>W: editable draft (what was understood, what is still missing)
  R->>W: Check the rules and submit
  W->>A: POST /api/bookings/submit
  A->>E: decide against Week 7 state (priority order, capacity, needs, 08:00-22:00)
  E-->>A: proposal (room + time) or alternative or rejection with reason
  A-->>W: PENDING_APPROVAL, with the exact reason
  P->>W: Approvals
  W->>A: POST /api/bookings/{id}/decision (expect = what the approver saw)
  A->>E: re-check, apply, re-decide every other unconfirmed request
  A-->>W: CONFIRMED (a stale view gets a 409 and must refresh)
```

* The requester can never decide their own request.
* A confirmed booking is never taken away silently. To free a slot the requester asks the holder to move (negotiation); the holder agrees, and an approver applies both changes together.
* A request outside the requested window is an *alternative offer*: it needs the requester's acceptance. Declining ends it as rejected.

## 3. Request lifecycle: a timetable change

```mermaid
sequenceDiagram
  actor A1 as Admin (proposer)
  participant W as Web app
  participant API as API
  participant S as CP-SAT repair
  participant V as Official validator
  actor A2 as Admin (reviews and approves)
  A1->>W: upload change file / sample / form
  W->>API: POST /api/disruptions/propose
  API->>S: minimise moved sessions (hard rules kept, soft penalty kept)
  S-->>API: new timetable + proof of the minimum
  API->>V: validate against the dataset, baseline and change
  V-->>API: hard 0, soft, sessions moved
  API-->>W: before/after of every moved session. Nothing applied yet.
  A2->>W: Approve and apply
  W->>API: POST /api/proposals/{id}/approve
  API->>V: re-check on the live timetable
  API-->>W: applied; schedule_after.json is exportable
```

## 4. What is stored

| Table | Content |
| --- | --- |
| `users` | accounts: hashed password, role, link to faculty / department / club, active flag, must-change-password flag |
| `organisations` | the clubs, departments and institute offices that requests are made for |
| `workspace` | one versioned JSON document: current timetable, exam schedule, applied changes, booking requests and decisions, negotiations, notifications, and the timetable as it was before the first applied change (served as `schedule.json`) |
| `audit` | who did what and when |

## 5. Modules

| Layer | Path | Responsibility |
| --- | --- | --- |
| API | `backend/app/main.py`, `api*.py` | routes, request validation, role checks |
| Security | `auth.py`, `permissions.py`, `accounts.py` | login, JWT, role rules, temporary passwords |
| Solvers | `solver/generate.py`, `exams.py`, `repair.py`, `soft.py` | CP-SAT models for the timetable, exams and minimal-change repair |
| Booking | `solver/bookings.py`, `api_bookings.py`, `api_negotiation.py` | priority rules, conflicts, move offers |
| Language | `nlp.py`, `ai.py` | English/Hinglish parsing; optional LLM assist |
| Data | `core/dataset.py`, `core/official.py`, `db.py`, `state.py` | dataset loading, the official validator bridge, persistence |
| Web | `frontend/components/*`, `frontend/lib/*` | one folder per page, shared API client and app context |

## 6. Deployment

```mermaid
flowchart LR
  GH["GitHub: main"] -->|"auto build"| V["Vercel: locus-cit.vercel.app"]
  GH2["GitHub: feature/backend"] -->|"Docker build"| R["Render: locuscit.onrender.com"]
  V -- "NEXT_PUBLIC_API_BASE_URL" --> R
  R --> S[("Supabase PostgreSQL")]
```

Settings are listed in [`.env.example`](../.env.example); the deployment steps are in [DEPLOY.md](DEPLOY.md).
