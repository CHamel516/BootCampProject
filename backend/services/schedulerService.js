import { timeToMinutes, minutesToTime } from "../utils/time.js";

const AWAKE_START = 8 * 60;
const AWAKE_END = 22 * 60;
const BUFFER = 15;
const MAX_HOURS_PER_WEEK = 7;
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_WINDOWS = {
  morning: [8 * 60, 12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening: [17 * 60, 22 * 60],
  any: [8 * 60, 22 * 60],
};

function freeSlotsForDay(dayIndex, commitments) {
  const busy = commitments
    .filter((c) => c.dayOfWeek === dayIndex)
    .map((c) => ({
      start: Math.max(0, timeToMinutes(c.startTime) - BUFFER),
      end: timeToMinutes(c.endTime) + BUFFER,
    }))
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const b of busy) {
    const last = merged[merged.length - 1];
    if (last && last.end >= b.start) {
      last.end = Math.max(last.end, b.end);
    } else {
      merged.push({ ...b });
    }
  }

  const free = [];
  let cursor = AWAKE_START;
  for (const b of merged) {
    if (b.start > cursor) {
      free.push({ start: cursor, end: Math.min(b.start, AWAKE_END) });
    }
    cursor = Math.max(cursor, b.end);
    if (cursor >= AWAKE_END) break;
  }
  if (cursor < AWAKE_END) free.push({ start: cursor, end: AWAKE_END });

  return free.filter((f) => f.end - f.start >= 0);
}

function candidatesForDay(dayIndex, freeSlots, sessionMinutes, preferredTime) {
  const [wStart, wEnd] = TIME_WINDOWS[preferredTime] || TIME_WINDOWS.any;
  const out = [];
  for (const slot of freeSlots) {
    if (slot.end - slot.start < sessionMinutes) continue;

    const preferredStart = Math.max(slot.start, wStart);
    let start;
    if (preferredStart + sessionMinutes <= Math.min(slot.end, wEnd)) {
      start = preferredStart;
    } else {
      start = slot.start;
    }
    const end = start + sessionMinutes;
    if (end > slot.end) continue;

    const overlap = Math.max(0, Math.min(end, wEnd) - Math.max(start, wStart));
    const score = overlap / sessionMinutes;
    out.push({ dayOfWeek: dayIndex, start, end, score });
  }
  return out;
}

function pickSessions(dayCandidates, desired) {
  const picked = [];
  const sortedByBestScore = [...dayCandidates].sort((a, b) => {
    const aSunday = a.day === 0 ? 1 : 0;
    const bSunday = b.day === 0 ? 1 : 0;
    if (aSunday !== bSunday) return aSunday - bSunday;
    return b.sessions[0].score - a.sessions[0].score;
  });

  for (const dc of sortedByBestScore) {
    if (picked.length >= desired) break;
    picked.push({ ...dc.sessions[0] });
  }

  if (picked.length < desired) {
    for (const dc of sortedByBestScore) {
      if (picked.length >= desired) break;
      for (const s of dc.sessions.slice(1)) {
        const conflict = picked
          .filter((p) => p.dayOfWeek === dc.day)
          .some((p) => !(s.end <= p.start || s.start >= p.end));
        if (!conflict) {
          picked.push({ ...s });
          if (picked.length >= desired) break;
        }
      }
    }
  }

  return picked;
}

function buildTips({
  originalHours,
  cappedHours,
  desired,
  scheduled,
  preferredTime,
  sessionMinutes,
}) {
  const tips = [];

  if (originalHours > MAX_HOURS_PER_WEEK) {
    tips.push(
      `Capped your plan at ${MAX_HOURS_PER_WEEK} hrs/week (you asked for ${originalHours}) to protect against early burnout. Increase after a couple of weeks.`
    );
  }

  if (scheduled.length < desired) {
    const shorter = Math.max(20, Math.floor(sessionMinutes / 2));
    tips.push(
      `Only ${scheduled.length} of ${desired} sessions fit — try shorter ${shorter}-min sessions or lower your hours/week.`
    );
  }

  const daysUsed = new Set(scheduled.map((s) => s.dayOfWeek));
  const restDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => !daysUsed.has(d));
  if (scheduled.length > 0 && restDays.length) {
    const names = restDays.map((d) => DAY_NAMES[d]);
    tips.push(
      `${names.slice(0, 3).join(", ")} left free as rest — consistency beats cramming.`
    );
  }

  if (preferredTime !== "any" && scheduled.length > 0) {
    const [ws, we] = TIME_WINDOWS[preferredTime];
    const inWindow = scheduled.filter((s) => {
      const sMin = timeToMinutes(s.startTime);
      const eMin = timeToMinutes(s.endTime);
      return sMin >= ws && eMin <= we;
    }).length;
    if (inWindow === scheduled.length) {
      tips.push(
        `All sessions land in your preferred ${preferredTime} window — nice.`
      );
    }
  }

  if (sessionMinutes >= 45 && scheduled.length >= 3 && tips.length < 4) {
    const short = Math.max(20, Math.floor(sessionMinutes * 0.6));
    tips.push(
      `Start with ${short} min for week 1; increase to ${sessionMinutes} min after week 2 once the habit sticks.`
    );
  }

  return tips.slice(0, 4);
}

export function planSessions({ goal, commitments }) {
  const originalHours = goal.hoursPerWeek;
  const hoursPerWeek = Math.min(originalHours, MAX_HOURS_PER_WEEK);
  const sessionMinutes = goal.sessionMinutes || 45;
  const preferredTime = goal.preferredTime || "any";
  const desired = Math.max(1, Math.ceil((hoursPerWeek * 60) / sessionMinutes));

  const dayCandidates = [];
  for (let d = 0; d < 7; d++) {
    const free = freeSlotsForDay(d, commitments);
    const candidates = candidatesForDay(d, free, sessionMinutes, preferredTime);
    if (candidates.length) {
      candidates.sort((a, b) => b.score - a.score || a.start - b.start);
      dayCandidates.push({ day: d, sessions: candidates });
    }
  }

  const picked = pickSessions(dayCandidates, desired).sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || a.start - b.start
  );

  const scheduled = picked.map((p) => ({
    dayOfWeek: p.dayOfWeek,
    startTime: minutesToTime(p.start),
    endTime: minutesToTime(p.end),
  }));

  const tips = buildTips({
    originalHours,
    cappedHours: hoursPerWeek,
    desired,
    scheduled,
    preferredTime,
    sessionMinutes,
  });

  return { scheduled, tips };
}
