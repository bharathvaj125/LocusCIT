# Test report

Dataset `cit-public-v1`. All numbers below were produced by the app and checked with the **unmodified** official `validator.py`
(`backend/scripts/generate_exports.py`, local run on 2026-10-31). Deployed-host timings are still to be measured.

| Check | Result |
| --- | --- |
| Sessions scheduled | 189 / 189 |
| Hard violations (timetable + exams + Week 7) | 0 |
| Soft penalty S1-S6 | 3 (S4 = 3; solver status OPTIMAL for the model) |
| Exams scheduled | 41 / 41, exam soft penalty 0 |
| Spectra booking score | 67.0 of 70 (22 approved, 1 alternative, 2 rejected); 0 priority inversions |
| Unreachable booking points | BR-09 wants 1,200 seats (largest venue 800); BR-17 window ends past P13 |
| Sample disruption: sessions moved | 9 (proven minimum: equals the number of directly broken sessions) |
| Sample disruption: hard violations | 0 |
| Automated backend tests | `python -m pytest -q tests` (parser, security/roles, booking flow, faculty requests, repair, exports) |

## Timings (local laptop, 8 workers)
Feasible timetable about 25 s; optimiser reaches the optimum in roughly 60-90 s. Generation publishes the feasible timetable
first and replaces it only with a validator-checked improvement.

## Still to measure
Deployed URL, cold start, p50/p95 latency, behaviour with several judges at once. Fill in after deployment.
