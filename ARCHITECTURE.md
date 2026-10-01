# Kickstart — Architecture

**Pitch:** Kickstart turns "I want to learn X" into a realistic weekly plan that fits around your real life — your classes, work, and gym — so you make steady progress without burning out.

## System diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend (Vite)                     │
│   My Week calendar · Start Something New · My Schedule · To-Do   │
└───────────────────────────────┬─────────────────────────────────┘
                                │  fetch /api/*  (Vite proxy)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express Backend (Node.js)                   │
│                                                                  │
│  Routes                                                          │
│    /api/commitments  /api/goals  /api/tasks  /api/goals/:id/plan │
│                                 │                                │
│                                 ▼                                │
│  Services (validation + business logic)                          │
│    commitmentService · goalService · taskService                 │
│    schedulerService (rule-based planner)  → planService          │
│                                 │                                │
│                                 ▼                                │
│  Mongoose Models                                                 │
│    Commitment · Goal · Task                                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                        MongoDB Atlas (cloud)
                        kickstart database
```

## Request flow

1. User interacts with the React UI (e.g. clicks "Plan My Week").
2. Frontend calls `POST /api/goals/:id/plan` via the Vite dev proxy.
3. Express route hands off to `planService.planGoal(id)`.
4. The service loads the goal + commitments, calls the deterministic `schedulerService.planSessions()` to pick session slots, replaces existing tasks for that goal via Mongoose, and returns `{ tasks, tips }`.
5. The route returns JSON. The frontend refreshes its data and the sessions pop onto the calendar.

## Scheduler (deterministic, no AI)

- Awake window 08:00–22:00 with a 15-minute buffer around each commitment.
- Sessions per week = `ceil(hoursPerWeek * 60 / sessionMinutes)`, capped at 7 hrs/week.
- Spreads sessions across different days first; doubles up only when necessary.
- Prefers the goal's preferred time window (morning / afternoon / evening / any).
- Returns 2–4 pacing tips (burnout cap, partial-fit warning, rest days left, preferred-window hit, beginner ramp).

## File layout

```
backend/
  server.js                      app setup + startup
  routes/                        HTTP handlers (thin, pass to services)
    commitments.js  goals.js  tasks.js
  services/                      validation + business logic
    commitmentService.js  goalService.js  taskService.js
    schedulerService.js  planService.js
    schedulerService.test.js     unit tests (node --test)
  models/                        Mongoose schemas
    Commitment.js  Goal.js  Task.js
  middleware/
    errorHandler.js              turns thrown errors into clean JSON
  db/database.js                 single Mongo connection
  utils/
    httpError.js  time.js  validation.js
  scripts/seed.js                `npm run seed`

frontend/
  src/
    App.jsx                      data owner + layout
    api.js                       fetch wrappers
    colors.js                    per-goal color palette
    components/
      WeekCalendar.jsx  CommitmentPanel.jsx
      GoalForm.jsx  TodoList.jsx  TipsCard.jsx
```

## Run it

```
npm install && npm --prefix frontend install
npm run seed       # fills the DB with the demo scenario
npm run dev        # backend on :3000, frontend on :5173
```
