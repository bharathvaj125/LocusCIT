# LOCUS CIT // Frontend

Web app for the Chilika Institute of Technology (CIT) scheduling platform. Next.js 15 (App Router) + TypeScript +
Tailwind CSS. Every screen reads and writes through the backend REST API (`docs/API_CONTRACT.md`); there is no mock or
bundled data, so what you see is what the server computed and validated.

## Screens
- **Sign in**: real JWT login; one-click buttons for the demo accounts listed in the root README.
- **Status bar (Admin)**: 1. generate timetable, 2. schedule exams, 3. decide Spectra requests, with live progress.
- **Timetable**: by student group, faculty or room (each role only sees what it may); parallel electives shown side by
  side; click a class to see why it is scheduled there; Week 7 events per room.
- **Midsem exams**: MON-SAT AM/PM, rooms per exam with half-capacity seats.
- **Spectra bookings**: all requests with decisions, reasons, role caps and an explanation per request; manual event
  scheduling with the same hard rules.
- **Approvals**: decide bookings (never your own), see pending timetable changes, follow your own requests.
- **Disruptions (Admin)**: upload or load the sample change file, review the minimal repair diff, approve as another Admin.
- **AI assistant**: English/Hinglish booking requests become editable drafts; faculty can ask for class changes.
- **Exports (Admin)**: download `schedule.json` and `schedule_after.json` generated and validated by the server.

## Run locally
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000. The backend URL comes from `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`);
set it in `.env.local` or in the Vercel project settings, for example `https://locuscit.onrender.com`.
The backend must list this site's URL in its `CORS_ORIGINS`.

## Build and lint
```bash
npm run lint
npm run build
```
