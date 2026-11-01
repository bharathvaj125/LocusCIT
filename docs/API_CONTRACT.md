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
| `POST /bookings/{id}/decision` | approver | `{action: approve, reject or offer_alternative, reason?, expect?}`; never your own request. `expect` is the `{room_id, day, start_period}` the approver was looking at: if the request was recalculated since, the answer is `409 STALE_PROPOSAL` and nothing changes. Approving a proposal that is outside the requested windows yields `ALTERNATIVE_OFFERED`, never `APPROVED` |
| `POST /bookings/{id}/respond` | requester | `{accept: bool}` for an offered alternative. Accept re-checks the slot and the official validator (`409` if it was lost, status `NEEDS_REVIEW`); decline closes the request as `REJECTED` and keeps `declined_alternative`. Requests still unconfirmed are recalculated in official priority order after every change (`recalculated_at`, reason starts "Recalculated") |
| `POST /bookings/{id}/cancel` | requester / admin | |
| `POST /bookings/suggest` | any | dry run of a draft: `{outcome, reason, options: [{room_id, day, start_period, end_period, kind: inside_window or alternative}], message}`; changes nothing |
| `GET /bookings/{id}/negotiation-options` | requester / admin | whether a voluntary move offer is possible for a request that only got an alternative or a rejection |
| `POST /bookings/{id}/negotiate` | requester | `{deadline_seconds?}` (default `NEGOTIATION_SECONDS`, 300). Creates an offer; the holder's booking is not touched |
| `GET /negotiations` | party / admin | offers with `status`, `seconds_left`, `can_respond`, `can_withdraw` |
| `POST /negotiations/{id}/respond` | the holder only | `{accept: bool}`; accept re-validates both bookings, then waits for an approver |
| `POST /negotiations/{id}/withdraw` | requester / admin | |
| `GET /campus/overview` | any | shared, read-only: counts, events per day, approved events (no pending requests, reasons or private details) |
| `GET /campus/availability?day&start&end&min_capacity` | any | which event rooms are free for that time and what holds the others |
| `GET /admin/priority-order`, `PUT /admin/priority-order` | admin | `{order: [...]}` or `{reset: true}`; exams and regular classes stay first; Spectra decisions are re-checked |
| `POST /events/manual` | any | room and time chosen manually; same hard rules; invalid gives 422 with `rule_ids` and no change |
| `POST /disruptions/propose` | admin | body is the change file; nothing changes until approval |
| `GET /proposals`, `GET /proposals/{id}` | admin | moved sessions with old and new slot and reason, `moved_count`, `proven_minimum` |
| `POST /proposals/{id}/approve`, `/reject` | admin | approve is blocked for the requester (403) and for stale proposals (409) |
| `GET /faculty/my-sessions` | faculty / coordinator | |
| `POST /faculty/change-request` | faculty / coordinator | `{text}` or `{kind, session_id, avoid_slots, allow_slots, days, periods}`; may answer `NEEDS_INFO`. Text can ask to **move** a class, **mark leave**, or add an **extra** session (`understood.intent` = `move` / `unavailable` / `extra`; an extra carries `understood.extra_session`). Every outcome is a PENDING proposal for an Admin; the proposal lists `moved` and, for extras, `added` (`{session_id, new:{day,start_period,room_id}}`) |
| `GET /faculty/change-requests` and `/{id}` | requester / admin | |
| `GET /schedules/week7?view=group\|faculty\|room&id=` | any signed-in role (read-only) | Spectra-week picture for one group, teacher or room: `classes` (after Week 7 overrides; moved ones have `week7_override`, `displaced_by`, `regular`), `events` (approved bookings and offered alternatives, P1-P13, with `status`, `category`, `reason`) and, for rooms, `closures`. Midsem exams (Week 8) are not included; `GET /exams` serves them. `GET /schedules` is unchanged |
| `GET /explain/session/{id}`, `GET /explain/booking/{id}` | any (booking: own only) | facts and rule ids |
| `GET /exports/schedule`, `GET /exports/schedule-after` | admin | official schema, re-validated before returning |
| `POST /admin/reset` | admin | restores demo data, keeps accounts, bumps `revision` |
| `POST /admin/dataset/import` | admin | validates structure and that every session has a legal slot |

## Accounts and organisations (Admin only unless noted)
| Endpoint | Notes |
| --- | --- |
| `GET /admin/users?role=&status=&q=` | accounts (no password data). `GET /admin/users/meta` lists roles, departments, faculty (with who they are linked to) and active organisations for the forms |
| `POST /admin/users` | `{username, full_name, role, email?, department?, faculty_id?, organisation_id?, password?}`. Faculty need `faculty_id` (one account per faculty member), coordinators a `department`, club representatives a club `organisation_id`. Answers with `temporary_password` once; `must_change_password` is set |
| `PATCH /admin/users/{username}` | edit name, email, role, links, `is_active`. An Admin cannot deactivate or demote themselves, nor the last active Admin |
| `POST /admin/users/{username}/reset-password` | new one-time temporary password |
| `GET /admin/organisations`, `POST`, `PATCH /{id}`, `POST /{id}/status` (`active`/`archived`), `DELETE /{id}` | types `club`, `department`, `institute`; delete only without members or requests, otherwise archive |
| `GET /organisations` | any signed-in role: id, name, type of active organisations |
| `POST /auth/change-password` | `{current_password, new_password}` (8+ characters, a letter and a digit). While `must_change_password` is true every other endpoint answers `403 PASSWORD_CHANGE_REQUIRED` |

A deactivated account gets `403` at sign-in and `401` on any existing token. `POST /admin/reset` also restores the demo accounts and organisations.

## Who may decide a booking (`POST /bookings/{id}/decision`)
Permissions are checked in the backend (`app/permissions.py`) at the moment of the decision, from the stored request and the
verified token, never from anything the client sends.

| Request | Who can decide | Anyone else |
| --- | --- | --- |
| Booking of a lab owned by a department (CS-LAB-1/2 CSE, ELEC-LAB-1/2 ECE and EE, PHY-LAB PH, MECH-WS ME, CIVIL-LAB CE) | that department's coordinator, or an Admin | 403 |
| Booking that moves classes in Week 7 (institute-level requests only) | an Admin other than the requester; a coordinator alone is never enough | 403 |
| Any other venue booking | an Admin other than the requester | 403 |
| Anyone's own request | nobody: 403 `You cannot approve or reject your own request` | |
| Cancelled, rejected or already decided request | 409 | |

A refused attempt is recorded in the audit log (`approval_denied`). Every request in the list carries `routing`
(who can decide it and why), `can_decide` and `decide_blocked_reason` for the signed-in user, and `affected_classes`
(old and new slot of every class it would move). An Admin who schedules an ordinary event through `POST /events/manual` is
booked at once (an administrative action); an event that would move classes, and anything booked by another role, stays
`PENDING_APPROVAL` until someone else approves it. Timetables (`GET /schedules`) are readable by every role.

## Move offers (optional, never exported)
Offer status: `awaiting_response`, `accepted`, `declined`, `expired`, `withdrawn`, `failed_revalidation`. While an offer is
open the requester's booking shows `PENDING_NEGOTIATION`; the holder's approved booking is unchanged. Approving the
requester (normal `/bookings/{id}/decision`, by someone else) applies both changes in one step after a fresh check, or
changes nothing. These states exist only inside the app: `schedule.json` carries `approved`, `alternative_offered` and
`rejected` only.

## Shapes
Assignment: `{session_id, day, start_period, end_period, room_id, ...}`. Days MON-FRI, periods 1-9 teaching,
10-13 events, `end_period` inclusive. Official export shape: see `starter_pack/README.md`.

Proposal: `{proposal_id, type, status, moved: [{session_id, old: {day, start_period, room_id}, new: {...}, reason}],
moved_count, lower_bound, proven_minimum, message, diagnostics}`.
`status` is one of COMPUTING, PENDING, APPROVED, REJECTED, INFEASIBLE, UNKNOWN, STALE, INVALID, ERROR.
