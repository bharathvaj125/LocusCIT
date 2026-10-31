# Test report

Dataset `cit-public-v1`. Numbers below come from the app and were checked with the **unmodified** official `validator.py`.
`exports/schedule.json` and `exports/schedule_after.json` were downloaded from the **deployed** backend
(https://locuscit.onrender.com, Render free instance, Singapore) after a reset, generate, exams, booking evaluation and the
sample disruption approved by a second Admin.

| Check | Result (deployed) |
| --- | --- |
| Sessions scheduled | 189 / 189 |
| Hard violations (timetable, exams, Week 7) | 0 |
| Soft penalty S1-S6 | 3 (S4 = 3; solver status OPTIMAL) |
| Exams scheduled | 41 / 41, exam soft penalty 0 |
| Spectra booking score | 67.0 of 70 (22 approved, 1 alternative, 2 rejected); 0 priority inversions; no class displaced |
| Unreachable booking points | BR-09 wants 1,200 seats (largest venue 800); BR-17's window ends past P13 |
| Sample disruption: sessions moved | 12 (equals the proven lower bound for this timetable) |
| Sample disruption: hard violations | 0 |
| Self-approval | blocked (403); second Admin approves (200) |
| Automated backend tests | 84 passing (`python -m pytest -q tests`, about 2 min) |
| Spectra decisions after the flexible-slot change | identical on the deployed timetable: 0 hard violations, booking score 67/70, 0 priority inversions |

## Timings on the free Render instance (about 0.1 CPU, 512 MB)
| Step | Wall time |
| --- | --- |
| Valid timetable available | about 20-30 s |
| Optimal timetable (soft penalty 3) | about 190-240 s |
| Exams (optimal) | 3-4 s |
| Booking decisions | 1-3 s |
| Disruption repair | 2-15 s |
| Peak memory (local, one worker) | about 370 MB |

The solver was tuned for small hosts (presolve off, optimiser limited to the 6 best-fitting rooms per slot, one worker).
The free instance sleeps after 15 minutes idle; the first request then takes about a minute (use an uptime pinger).

## Flexible allocation and move offers (tests/test_flexible_allocation.py, tests/test_negotiation.py)
Two flexible requests both placed; a flexible request steps aside for a fixed one; a swap pass frees a slot without
lowering anyone; an alternative never takes a later request's last slot; higher priority and earlier submission win;
role cap holds; cancelled never approved; approved bookings are never silently overwritten; offers: accept needs a fresh
check and an approver, decline and timeout keep the holder, a stolen slot blocks the swap, one holder cannot be offered
twice, cancelling closes the offer, nobody approves their own request, internal statuses never reach the export.

## Change files (rescheduling), judge-style
`backend/scripts/stress_change_files.py` resets the app, generates a timetable, applies a change file, tries to approve it as
the proposer (refused with 403), approves it as the second Admin, exports `schedule_after.json` and runs the official
`validator.py --disruption <file> --baseline schedule.json`. Results on the optimised timetable (soft penalty 3):

| Case | Sessions moved | Fewest possible | Hard violations after |
| --- | --- | --- | --- |
| Official sample file | 9 | 9 (proven) | 0 |
| Two teachers unavailable, partial days | 3 | 3 (proven) | 0 |
| Big lecture hall closed all week | 3 | 3 (proven) | 0 |
| Lab closed all week | 2 | 2 (proven) | 0 |
| Add a teacher and a new session | 0 | 0 | 0 |
| New session pinned to a slot | 0 | 0 | 0 |
| Remove three sessions | 0 | 0 | 0 |
| Combination (teacher, room, add, remove) | 6 | 6 (proven) | 0 |
| Four rooms closed on one day | 8 | 8 (proven) | 0 |
| Teacher unavailable four days | no timetable exists | n/a | nothing proposed, reason shown |
| Extra fields and no reason | 0 | 0 | 0 |

`schedule.json` stayed the baseline after every approval, and the booking score stayed 67/70 with no priority inversions.

## Still to measure
Several simultaneous judges, and the frontend flows end to end.
