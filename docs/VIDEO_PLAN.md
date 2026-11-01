# Walkthrough video: plan (5:00 maximum)

The problem statement asks for a video of up to 5 minutes, as an **unlisted YouTube link or a Drive link with view access**, that shows:
**(1)** generating the timetable, **(2)** a plain-language request turning into a booking, **(3)** a conflict being blocked, **(4)** the Spectra week booking decisions,
**(5)** a rescheduling with its changes and approval, and **(6)** the dashboard. The plan below covers each one, in this order, with a time budget that adds up to 4:45.

Not having the video is a disqualification, so record it even if it is not perfect. One continuous screen recording with your voice is enough; no editing apart from cutting the waiting time.

## A. Before you press record (do this once, about 15 minutes)
1. **Wake the server.** Open https://locuscit.onrender.com/api/health until it answers (the free host sleeps after 15 idle minutes). Keep the live site open in a tab so it stays awake.
2. **Use the live link, not localhost.** The judges see the live site, so the video should too: https://locus-cit.vercel.app. Browser zoom 110-125 % so text is readable at 720p; hide bookmarks; close other tabs and notifications.
3. **Sign in as `admin1` and press *Reset demo data*** (Overview, "Start over"). This clears any change left over from earlier testing, so the first export is the original.
4. **Nothing else to set up.** One Admin account is enough: the Admin reviews and approves their own changes.
5. **Do not pre-generate anything.** Segments 1 and 4 need the empty workspace so the audience sees it being built. (If you need a second take, press *Reset demo data* again.)
6. **Have these ready to paste** (a text file on the desktop):
   * Request A (works): `seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye`
   * Request B (blocked, too many people): `auditorium friday 6pm for 2 hours, 1200 people`
   * Request C (blocked, a class is in that room): `LH-1 Monday 10 am for 1 hour, 60 people` (if it is accepted on your day, use the Venues grid, find a class cell and book that exact slot)
   * The change file: you will use the button *Load the sample disruption*, nothing to paste.
7. **Do one full dry run** with a stopwatch. The only part that takes long is the solver (1-2 minutes): plan to cut or speed it up in the edit (see segment 1).
8. Record with any screen recorder (Windows: `Win+G` Game Bar, or OBS). 1080p, microphone on, one take per segment is fine; join them afterwards.

## B. Script with timings

| Time | Segment | What is on screen | What you say (short) |
| --- | --- | --- | --- |
| 0:00-0:15 | **Intro** | Intro animation, then the sign-in page | "This is Locus, the scheduling and venue system for the Chilika Institute of Technology. Four roles, one validated timetable. I'll show the whole flow in five minutes." |
| 0:15-1:15 | **1. Generate the timetable** | Sign in as `admin1` (one-click button). Overview: press *Generate the timetable*. While it runs: the progress text. When the first valid timetable appears, open *Timetable*, pick a group, click a class | "The Admin generates the timetable. A valid one appears first and then keeps improving. It satisfies all hard rules; the official validator checks it before it is saved. Click a class: *why is it here?* shows the rule facts." *(Cut the waiting: show the start, jump to the finished state.)* |
| 1:15-1:35 | Exams | *Exams*: press *Schedule midsem exams* if not done, show the calendar, type `LH-1` in the search box | "41 midsem exams, no student with two exams in a slot, seat counts per room." |
| 1:35-2:15 | **2. Plain-language request becomes a booking** | Sign out, sign in as `club1`. *Assistant*: paste Request A, show what the app understood (editable draft), press *Check the rules and submit* | "A club representative types a request in Hinglish. The app reads day, time, people and equipment, and shows the draft to edit. The rules are checked in code, and it goes to an approver as pending, with the exact reason." |
| 2:15-2:45 | **3. A conflict is blocked** | Still `club1`. Paste Request B, then Request C. Show the explanation under the button | "An impossible request is never silently accepted: here 1200 people exceed every room, and here a class already holds the room. Each refusal says the rule that caused it and offers the nearest alternative." |
| 2:45-3:25 | **4. Spectra week booking decisions** | Sign out, sign in as `admin1`. *Approvals*: approve Request A. Then *Venues & Spectra*: *Decisions* tab (priority order, who got what and why) and the *Venue board* (Week 7 grid) | "Requests are decided by priority: exams, then regular classes, institute events, guest lectures, department events, and clubs last. The Admin approves, never their own request. The Venue board shows Week 7 with events and moved classes." |
| 3:25-4:25 | **5. Rescheduling with changes and approval** | *Changes*: press *Load the sample disruption*, read the plain-language summary, press *Propose a repair*. Show before/after of the moved sessions and the "proven minimum" note. Scroll the list of moved sessions (each has its reason), then press *Approve and apply* | "A room closes and a teacher is unavailable. The solver moves the fewest sessions and proves it cannot do with fewer. Nothing changes until the Admin has seen every move and its reason and approves; then the timetable is re-checked and applied." |
| 4:25-4:45 | **6. Dashboard and exports** | *Overview* dashboard: the validator seal (0 hard violations), campus at a glance, *Is a room free?*. Then *Exports*: both files and the validator's result | "The dashboard shows validity, the numbers, and free rooms. *Exports* gives `schedule.json` and `schedule_after.json`, checked by the official validator: zero hard violations." |
| 4:45-5:00 | **Close** | Repository README | "Everything is in the public repository: README, architecture, AI use, third-party list and the two export files. Thank you." |

## C. Tips so it looks sure of itself
* **Say what the rule is, not just what you click.** Judges score correctness, rescheduling, optimisation, AI use, booking decisions, usability and design: use those words once each.
* **Show the AI honestly.** In segment 2 say: "the parser is rule-based and works without any key; an optional model call can suggest fields, but code decides validity." That matches `AI_USAGE.md`.
* **Keep the cursor slow** and let each result stay on screen for two seconds.
* **If a step fails on camera**, stop, press *Reset demo data*, redo from step A3. Do not explain the failure in the video.
* **If the page says it is waking up**, wait; it retries by itself.
* Keep the file under the time: if it runs long, shorten segment 1 (waiting) and the Exams stop, never segments 2-6.

## D. After recording
1. Upload to YouTube as **Unlisted**, or to Drive and set *Anyone with the link: Viewer*. Open the link in a private window to confirm it plays without signing in.
2. Replace `_TBD_` on the `Video:` line at the top of `README.md` with the link, commit and push.
3. Re-open the README on GitHub and click the link once more.
