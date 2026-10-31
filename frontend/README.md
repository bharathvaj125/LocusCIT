# Locus: frontend

Web app for the Chilika Institute of Technology (CIT) scheduling platform. Next.js 15 (App Router), TypeScript,
Tailwind CSS 4 and Framer Motion. Every screen reads and writes through the backend REST API
(`docs/API_CONTRACT.md`); there is no mock or bundled data, so what you see is what the server computed and validated.
Design language and Figma link: `docs/DESIGN.md`.

## Screens
- **Sign in**: real JWT login with one-click demo accounts.
- **Overview**: the Admin pipeline (generate timetable, schedule exams, decide Spectra requests) with live progress, validator seal, metrics and what needs attention.
- **Timetable**: by student group, faculty or room; hover traces a course, click explains why it is placed there.
- **Midsem exams**: exam-week calendar with rooms and seat math.
- **Venues and Spectra**: decisions with reasons and a Week 7 venue board; manual event scheduling.
- **Approvals**: decide bookings (never your own), follow your own requests and change requests.
- **Changes**: upload a change file, review the minimal repair as before/after, approve as a second Admin.
- **Assistant**: English/Hinglish booking drafts; faculty can ask to move a class.
- **Exports**: `schedule.json` and `schedule_after.json`, re-validated by the server.
- **Ctrl K** opens a palette to jump anywhere.

## Run locally
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000. The backend URL comes from `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`);
set it in `.env.local` or in the Vercel project, for example `https://locuscit.onrender.com`.
The backend must list this site's URL in its `CORS_ORIGINS`.

## Build and lint
```bash
npm run lint
npm run build
```
