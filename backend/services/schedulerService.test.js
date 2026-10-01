import assert from "node:assert/strict";
import { test } from "node:test";
import { planSessions } from "./schedulerService.js";
import { timeToMinutes } from "../utils/time.js";

const MON = 1;
const TUE = 2;
const WED = 3;
const THU = 4;
const FRI = 5;

function overlaps(a, b) {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime) - 15;
  const bEnd = timeToMinutes(b.endTime) + 15;
  return aStart < bEnd && aEnd > bStart;
}

test("avoids commitments (with 15-min buffer)", () => {
  const commitments = [
    { dayOfWeek: MON, startTime: "09:00", endTime: "10:30" },
    { dayOfWeek: WED, startTime: "13:00", endTime: "16:00" },
    { dayOfWeek: FRI, startTime: "18:00", endTime: "19:00" },
  ];
  const goal = { hoursPerWeek: 3, sessionMinutes: 45, preferredTime: "any" };

  const { scheduled } = planSessions({ goal, commitments });

  assert.ok(scheduled.length > 0, "expected at least one session");
  for (const s of scheduled) {
    for (const c of commitments) {
      if (c.dayOfWeek === s.dayOfWeek) {
        assert.ok(
          !overlaps(s, c),
          `session ${JSON.stringify(s)} overlaps commitment ${JSON.stringify(c)}`
        );
      }
    }
  }
});

test("spreads sessions across different days when possible", () => {
  const commitments = [];
  const goal = { hoursPerWeek: 3, sessionMinutes: 45, preferredTime: "evening" };

  const { scheduled } = planSessions({ goal, commitments });
  const days = new Set(scheduled.map((s) => s.dayOfWeek));
  assert.equal(scheduled.length, 4);
  assert.equal(days.size, 4, "expected 4 sessions on 4 different days");
});

test("returns partial + tip when there is not enough free time", () => {
  const commitments = [];
  for (let d = 0; d < 7; d++) {
    commitments.push({ dayOfWeek: d, startTime: "08:00", endTime: "21:30" });
  }
  const goal = { hoursPerWeek: 5, sessionMinutes: 45, preferredTime: "any" };

  const { scheduled, tips } = planSessions({ goal, commitments });

  assert.ok(scheduled.length < 7, "should be partial");
  const hasFitTip = tips.some((t) => /fit/i.test(t));
  assert.ok(hasFitTip, `expected a 'fit' tip, got: ${JSON.stringify(tips)}`);
});

test("caps hoursPerWeek at 7 and adds burnout tip", () => {
  const commitments = [];
  const goal = { hoursPerWeek: 20, sessionMinutes: 45, preferredTime: "any" };

  const { scheduled, tips } = planSessions({ goal, commitments });
  assert.ok(scheduled.length <= 10, "capped session count");
  const hasCapTip = tips.some((t) => /cap/i.test(t) || /burnout/i.test(t));
  assert.ok(hasCapTip, `expected a cap/burnout tip, got: ${JSON.stringify(tips)}`);
});

test("prefers the goal's preferred time window", () => {
  const commitments = [];
  const goal = { hoursPerWeek: 2, sessionMinutes: 60, preferredTime: "evening" };
  const { scheduled } = planSessions({ goal, commitments });
  const inEvening = scheduled.every((s) => {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    return start >= 17 * 60 && end <= 22 * 60;
  });
  assert.ok(inEvening, `sessions should be in evening: ${JSON.stringify(scheduled)}`);
});
