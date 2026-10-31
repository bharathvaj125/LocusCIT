# API contract v1 (DRAFT - both owners must agree before breaking changes)

Base URL: `NEXT_PUBLIC_API_BASE_URL`, all routes prefixed `/api`. JSON only.
Auth: `Authorization: Bearer <token>` from `POST /api/auth/login`. The backend enforces roles; never trust role, requester or approver sent by the client.

## Envelope
```json
{ "success": true, "data": { }, "errors": [] }
```
Errors: `success: false`, `errors: [{code, message, details, rule_ids, related_entity_ids}]`.
Codes: INVALID_INPUT, UNAUTHORIZED, FORBIDDEN, DATASET_MISMATCH, CONSTRAINT_VIOLATION,
SOLVER_INFEASIBLE, SOLVER_TIMEOUT, AI_UNAVAILABLE, STALE_PROPOSAL, STALE_REVISION.
Never return HTTP 200 for a failed solve. A timeout (UNKNOWN) is not INFEASIBLE.

State-changing calls send the current workspace `revision` (JSON field or `If-Match`); stale -> HTTP 409.

## Roles
`admin`, `department_coordinator`, `faculty`, `club`.

## Routes
| Method / route | Purpose | Who |
| --- | --- | --- |
| GET /api/health | liveness + version | public |
| POST /api/auth/login | `{username,password}` -> token, role, display name | public |
| POST /api/admin/dataset/import | upload dataset JSON | admin |
| POST /api/schedules/generate | generate baseline; 202 + job_id if long | admin |
| GET /api/jobs/{id} | solver job status | admin |
| GET /api/schedules?view=group\|faculty\|room&id=... | filtered timetable | authenticated, scoped |
| GET /api/rooms | rooms, features, utilisation | authenticated |
| POST /api/exams/generate | generate exam schedule | admin |
| GET /api/exams | exam schedule | authenticated |
| GET /api/bookings | requests + decisions | authenticated, role-scoped |
| POST /api/bookings/parse | English/Hinglish text -> editable draft (AI optional) | authenticated |
| POST /api/bookings/submit | structured booking, deterministic checks | club/dept/faculty/admin |
| POST /api/bookings/{id}/decision | approve / reject / offer alternative | approver, not requester |
| POST /api/bookings/evaluate-batch | evaluate all Spectra requests by priority | admin |
| POST /api/disruptions/propose | upload change file -> pending repair, no mutation | admin |
| GET /api/proposals/{id} | moved sessions (old/new), moved count, validation | relevant role |
| POST /api/proposals/{id}/approve | atomic apply (no self-approval) | admin |
| POST /api/proposals/{id}/reject | reject proposal | admin |
| POST /api/faculty/change-request | NL or structured change request | faculty |
| GET /api/dashboard | counters, approvals, conflicts, utilisation | authenticated |
| GET /api/exports/schedule | official-schema schedule.json | admin |
| GET /api/exports/schedule-after | post-disruption schedule_after.json | admin |
| POST /api/admin/reset | restore clean demo state, keep demo logins | admin |

## Schedule data shape (assignments)
```json
{"session_id": "MA101-AB-L1", "day": "MON", "start_period": 2, "room_id": "LH-1"}
```
Days `MON..FRI`; periods 1-9 teaching, 10-13 events; `end_period` is inclusive for bookings.
Official export shape: see `starter_pack/README.md` (`team, dataset_id, sessions, fest_week, exams`).

## Proposal (disruption / faculty change)
`{proposal_id, status: pending|approved|rejected, base_schedule_version, moved_count, changes: [{session_id, old:{day,start_period,room_id}, new:{...}, reason}], hard_validation_result, diagnostics}`

Field-level response schemas will be added by the backend owner as each endpoint lands.
