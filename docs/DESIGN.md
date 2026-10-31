# Design system: Locus

The visual identity comes from the institute's own name. CIT is the *Chilika* Institute of Technology, so the product is
built from warm paper and lagoon water, not a generic dark dashboard.

Figma file (tokens, style guide, Timetable screen): https://www.figma.com/design/VMFR4vqOWP7zQDuTAXWbqc

## Principles
- **Calm under pressure.** Scheduling is stressful; the UI is quiet, spacious and legible. Color carries meaning, not decoration.
- **Trust is visible.** The validator seal ("0 hard violations") is on every screen, and every explanation shows the real rule facts.
- **One idea per screen**, with the next action obvious (Overview pipeline: three steps, in order).
- **Motion explains.** Things slide in where they came from, numbers count up, the timetable blocks settle; all of it
  respects `prefers-reduced-motion`.

## Tokens (`frontend/app/globals.css`)
| Role | Tokens |
| --- | --- |
| Surfaces | `paper` #F4EFE6, `raised` #FBF8F2, `sunk` #EBE4D6 |
| Ink and lines | `ink-900` #0E2230, `ink-600`, `ink-400`, `line`, `line-strong` |
| Primary (lagoon) | `lagoon-900` #0A3D4A, `700`, `500`, `200`, `50` |
| Accent | `sunrise` #E4572E (alerts, the one warm highlight) |
| Departments | CSE lagoon, ECE indigo, EE saffron, ME sunrise, CE mangrove, Common stone, Labs plum |
| Type | Fraunces (display), Manrope (UI), JetBrains Mono (periods and codes) |

## Signature components
- **Rail**: deep-lagoon navigation with a drifting wave, active pill that glides between items.
- **Timetable grid**: one continuous lunch band across all days (not a strip per day), parallel electives stacked in their slot,
  hover traces a course through the week, click opens the "why is it here?" drawer.
- **Exam calendar**: Monday to Saturday by AM/PM, papers colored by department, rooms and seat math in a drawer.
- **Venue board**: room by time for Week 7: classes, events by category, closures hatched, evening periods shaded.
- **Command palette** (Ctrl K): jump to any screen, student group, teacher or room.
- **Validator seal**, **count-up metrics**, **progress ring**, **before/after diff** with animated arrows.

## Accessibility
Visible focus rings, `aria-current` on navigation, dialogs with Escape to close, labels on every form control, status
changes announced through toasts (`aria-live`), and the layout works from 375 px up.
