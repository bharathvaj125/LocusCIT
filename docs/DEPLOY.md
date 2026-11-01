# Deploying the backend on Render (free plan)

You can use **New > Web Service** (no Blueprint needed).

| Field | Value |
| --- | --- |
| Repository | `bharathvaj125/LocusCIT` |
| Branch | `feature/backend` (use `main` after PR #1 is merged) |
| Language / Runtime | **Docker** |
| Dockerfile Path | `backend/Dockerfile` |
| Docker Build Context | `.` (the repository root: the Dockerfile copies `starter_pack/` too) |
| Instance type | **Free** |
| Health Check Path | `/api/health` |

## Environment variables
| Key | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **pooler** connection string (required: the free disk is wiped on every restart, so SQLite loses data) |
| `JWT_SECRET` | any long random string |
| `CORS_ORIGINS` | `http://localhost:3000,https://<your-frontend>.vercel.app` |
| `AI_ENABLED` | `false` (set `true` and add `LLM_API_KEY` only if you want the optional AI assist) |
| `SOLVER_WORKERS` | `1` (the free instance has a fraction of one CPU) |
| `OPTIMISE_SECONDS` | `300` (wall-clock budget for the optimiser; it is slow on a shared CPU) |

## Free-plan behaviour to expect
* Sleeps after 15 minutes without traffic; the first request then takes about a minute. Keep it awake with a free uptime
  pinger (for example UptimeRobot) calling `https://<service>.onrender.com/api/health` every 5 minutes.
* About 0.1 CPU and 512 MB RAM. Measured locally with one worker: peak memory about 370 MB; generating the timetable needs
  roughly 4 CPU-seconds for a valid one plus about 15 for the optimiser, so allow several minutes of wall time on the free CPU.
  A valid timetable is published first and replaced only by a validator-checked improvement.
* Check the deployment with `GET /api/health` and then sign in as `admin1` (see README).
