# API contract v1 (implemented by the backend)

Base URL `NEXT_PUBLIC_API_BASE_URL`, routes under `/api`. Interactive docs: `GET /docs`.
Auth: `POST /api/auth/login` returns a token; send `Authorization: Bearer <token>`.
Roles: `admin`, `department_coordinator`, `faculty`, `club`. The backend enforces roles; hiding a button is not security.

## Envelope
Success: `{"success": true, "data": {...}, "errors": []}`.
Failure: `{"success": false, "data": null, "errors": [{"code","message","details","rule_ids","related_entity_ids"}]}`.
Codes: INVALID_INPUT (400/404/409/422), UNAUTHORIZED (401), FORBIDDEN (403), CONSTRAINT_VIOLATION,
SOLVER_INFEASIBLE, SOLVER_TIMEOUT, STALE_PROPOSAL (409), STALE_REVISION (409).
A solver timeout is never reported as "impossible".
Optional header `If-Match: <revision>` on writes: a stale value returns 409 `STALE_REVISION`. After a reset, refresh.

## Long jobs
`POST /schedules/generate` returns 202 `{job_id}`. Poll `GET /jobs/{id}` until `status` is `DONE`
(`phase: "optimising"` means a valid timetable is already available), or one of
`INFEASIBLE`, `UNKNOWN`, `FAILED_VALIDATION`, `ERROR`, `STALE`.
`POST /disruptions/propose` and faculty requests return `{proposal_id}`; poll the proposal until it leaves `COMPUTING`.

## Routes
| Route | Who | Notes |
| --- | --- | --- |
| `GET /health` | public | version, dataset id, revision |
| `POST /auth/login`, `GET /auth/me` | public / any | token, role, faculty_id, department, org |
| `GET /dashboard` | any | counts, hard and soft totals, exam coverage, booking score, pending approvals, utilisation (role-scoped) |
| `GET /rooms` | any | rooms with features and utilisation |
| `GET /reference` | any | names and attributes from the active dataset: rooms, faculty, groups, courses, sessions, calendar |
| `GET /examples/sample-disruption` | admin | the starter pack's practice change file |
| `GET /audit` | admin | latest audit events (logins, generations, approvals, resets) |
| `GET /schedules?view=group` or `faculty` or `room`, `&id=` | any (scoped) | admin: all; coordinator: own department; faculty: own timetable and groups they teach; club: rooms only |
| `POST /schedules/generate?time_limit=` | admin | background job |
| `GET /jobs/{id}` | admin | |
| `POST /exams/generate`, `GET /exams?group=` | admin / any | 41 exams, multi-room |
| `POST /bookings/evaluate-batch` | admin | decides all 25 Spectra requests; returns score and session overrides |
| `GET /bookings` | any (scoped) | dataset requests with decisions, plus `submitted` bookings |
| `POST /bookings/parse` | any | `{text}` returns an editable draft with `assumptions`, `ambiguous_fields`, `follow_up`, `security_flags` |
| `POST /bookings/submit` | any | structured draft; role and category come from the token, never from the body |
| `POST /bookings/{id}/decision` | approver | `{action: approve, reject or offer_alternative, reason?}`; never your own request |
| `POST /bookings/{id}/respond` | requester | `{accept: bool}` for an offered alternative |
| `POST /bookings/{id}/cancel` | requester / admin | |
| `POST /events/manual` | any | room and time chosen manually; same hard rules; invalid gives 422 with `rule_ids` and no change |
| `POST /disruptions/propose` | admin | body is the change file; nothing changes until approval |
| `GET /proposals`, `GET /proposals/{id}` | admin | moved sessions with old and new slot and reason, `moved_count`, `proven_minimum` |
| `POST /proposals/{id}/approve`, `/reject` | admin | approve is blocked for the requester (403) and for stale proposals (409) |
| `GET /faculty/my-sessions` | faculty / coordinator | |
| `POST /faculty/change-request` | faculty / coordinator | `{text}` or `{kind, session_id, avoid_slots, allow_slots, days, periods}`; may answer `NEEDS_INFO` |
| `GET /faculty/change-requests` and `/{id}` | requester / admin | |
| `GET /explain/session/{id}`, `GET /explain/booking/{id}` | any (booking: own only) | facts and rule ids |
| `GET /exports/schedule`, `GET /exports/schedule-after` | admin | official schema, re-validated before returning |
| `POST /admin/reset` | admin | restores demo data, keeps accounts, bumps `revision` |
| `POST /admin/dataset/import` | admin | validates structure and that every session has a legal slot |

## Shapes
Assignment: `{session_id, day, start_period, end_period, room_id, ...}`. Days MON-FRI, periods 1-9 teaching,
10-13 events, `end_period` inclusive. Official export shape: see `starter_pack/README.md`.

Proposal: `{proposal_id, type, status, moved: [{session_id, old: {day, start_period, room_id}, new: {...}, reason}],
moved_count, lower_bound, proven_minimum, message, diagnostics}`.
`status` is one of COMPUTING, PENDING, APPROVED, REJECTED, INFEASIBLE, UNKNOWN, STALE, INVALID, ERROR.
