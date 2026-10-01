# Kickstart — 60-second demo script

**Before you start:** `npm run seed` then `npm run dev`. Open `http://localhost:5173`. Have the MongoDB Atlas tab open in a second window on the `kickstart.tasks` collection.

**One-line pitch (say while loading):**
> "Kickstart helps you start learning something new without burning out — it looks at your real week and plans realistic practice sessions around it."

---

### Beat 1 · The honest week (0:00 – 0:08)
**Say:** "Here's a typical student week — classes Mon/Wed/Fri, work Tue/Thu afternoons, gym three nights."
**Do:** Point at the gray commitment blocks on the calendar.

### Beat 2 · Add a goal (0:08 – 0:20)
**Say:** "I want to learn Spanish, three hours a week, in the evenings."
**Do:** In the "Start Something New" card, type `Learn Spanish`, hours `3`, preferred time `Evening`.

### Beat 3 · Plan My Week (0:20 – 0:30)
**Say:** "One click — the planner finds the free gaps around everything else."
**Do:** Click **Plan My Week**. Sessions pop onto the calendar; tips appear in the amber card.
**Say:** "It left Fri/Sat/Sun as rest days, hit my preferred evening window, and even suggested starting shorter in week one."

### Beat 4 · Progress + edit (0:30 – 0:42)
**Say:** "Every session is also a to-do."
**Do:** Check off one Spanish session — the progress bar jumps from `0 of 4` to `1 of 4`.
**Do:** Click **Edit** on another session, change the time 5 minutes later, Save. Calendar updates.

### Beat 5 · Delete and re-plan (0:42 – 0:52)
**Say:** "If my week changes, the plan should too."
**Do:** Delete the Tuesday Work commitment from "My Schedule". Click **Plan My Week** again — sessions reshuffle to use the new free afternoon.

### Beat 6 · Real data (0:52 – 1:00)
**Say:** "And it's all real data — this is MongoDB Atlas, same documents the UI is reading."
**Do:** Flash the Atlas tab showing the `tasks` collection with the matching session docs.

---

### Backup lines if something breaks
- Calendar empty? → "Let me reseed real quick" → run `npm run seed` in another terminal.
- Mongo won't connect? → Atlas → Network Access → check IP allowlist.
- Preferred-time window missed? → "The scheduler scores slots by preferred-window overlap; here the only free evening slots were already used."

### What to NOT demo
- No login (intentional — this is a single-user prototype).
- Don't resize the window during the demo — the calendar column widths shift.
