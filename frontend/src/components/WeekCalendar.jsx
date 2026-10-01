import { useEffect, useState } from "react";
import { colorFor } from "../colors.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_END = 22;
const DEFAULT_HOUR_START = 7;
const ROW_PX = 44;

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function computeHourStart(commitments, tasks) {
  let earliest = DEFAULT_HOUR_START * 60;
  for (const c of commitments) {
    earliest = Math.min(earliest, timeToMinutes(c.startTime));
  }
  for (const t of tasks) {
    if (t.startTime) earliest = Math.min(earliest, timeToMinutes(t.startTime));
  }
  const earliestHour = Math.floor(earliest / 60);
  return Math.min(DEFAULT_HOUR_START, earliestHour - 1);
}

function useNowMinutes() {
  const [now, setNow] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function WeekCalendar({ commitments, tasks, goals, onToggleTask }) {
  const hourStart = computeHourStart(commitments, tasks);
  const hours = HOUR_END - hourStart;
  const nowMinutes = useNowMinutes();
  const today = new Date().getDay();

  const goalIndexById = new Map(goals.map((g, i) => [g._id, i]));

  function blockStyle(startTime, endTime) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const top = ((start - hourStart * 60) / 60) * ROW_PX;
    const height = ((end - start) / 60) * ROW_PX;
    return {
      top: `${Math.max(0, top)}px`,
      height: `${Math.max(16, height)}px`,
    };
  }

  const nowTop =
    nowMinutes >= hourStart * 60 && nowMinutes <= HOUR_END * 60
      ? ((nowMinutes - hourStart * 60) / 60) * ROW_PX
      : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">My Week</h2>
        <div className="text-xs text-slate-500">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-300 mr-1 align-middle" />
          commitments
          <span className="inline-block w-3 h-3 rounded-sm bg-indigo-500 ml-3 mr-1 align-middle" />
          learning sessions
        </div>
      </div>

      <div className="flex overflow-x-auto">
        <div className="flex-shrink-0 w-14 border-r border-slate-100 pt-9">
          {Array.from({ length: hours }, (_, i) => (
            <div
              key={i}
              className="h-11 text-[11px] text-slate-400 px-2 flex items-start justify-end pt-1"
            >
              {String(hourStart + i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 min-w-[640px]">
          {DAYS.map((label, dayIndex) => {
            const isToday = dayIndex === today;
            const dayCommitments = commitments.filter(
              (c) => c.dayOfWeek === dayIndex
            );
            const daySessions = tasks.filter(
              (t) =>
                t.dayOfWeek === dayIndex &&
                t.startTime &&
                t.endTime &&
                t.goalId
            );
            return (
              <div
                key={dayIndex}
                className={`border-r border-slate-100 last:border-r-0 ${
                  isToday ? "bg-brand-50/60" : ""
                }`}
              >
                <div
                  className={`h-9 flex items-center justify-center text-sm font-medium border-b border-slate-100 ${
                    isToday
                      ? "bg-brand-100 text-brand-800"
                      : "text-slate-600 bg-slate-50"
                  }`}
                >
                  {label}
                </div>
                <div
                  className="relative"
                  style={{ height: `${hours * ROW_PX}px` }}
                >
                  {Array.from({ length: hours }, (_, i) => (
                    <div
                      key={i}
                      className="border-b border-slate-100"
                      style={{ height: `${ROW_PX}px` }}
                    />
                  ))}

                  {dayCommitments.map((c) => {
                    const durationMin =
                      timeToMinutes(c.endTime) - timeToMinutes(c.startTime);
                    const compact = durationMin < 60;
                    const tooltip = `${c.title} · ${c.startTime}–${c.endTime}`;
                    return (
                      <div
                        key={c._id}
                        className="absolute left-1 right-1 rounded-md border bg-slate-200/80 border-slate-300 text-slate-700 overflow-hidden"
                        style={blockStyle(c.startTime, c.endTime)}
                        title={tooltip}
                      >
                        {compact ? (
                          <div className="px-1.5 py-0.5 text-[10px] leading-tight truncate">
                            <span className="font-medium">{c.title}</span>{" "}
                            <span className="opacity-70">
                              {c.startTime}–{c.endTime}
                            </span>
                          </div>
                        ) : (
                          <div className="px-2 py-1 text-[11px]">
                            <div className="font-medium truncate">{c.title}</div>
                            <div className="opacity-70">
                              {c.startTime}–{c.endTime}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {daySessions.map((t) => {
                    const idx = goalIndexById.get(t.goalId);
                    const palette = colorFor(idx) || colorFor(0);
                    const goal = goals.find((g) => g._id === t.goalId);
                    const durationMin =
                      timeToMinutes(t.endTime) - timeToMinutes(t.startTime);
                    const compact = durationMin < 60;
                    const title = goal?.title || "Session";
                    const tooltip = `${title} · ${t.startTime}–${t.endTime}`;
                    return (
                      <div
                        key={t._id}
                        className={`absolute left-1 right-1 rounded-md border text-white overflow-hidden shadow-sm animate-pop ${palette.block} ${
                          t.completed ? "opacity-60 line-through" : ""
                        }`}
                        style={blockStyle(t.startTime, t.endTime)}
                        title={tooltip}
                      >
                        {compact ? (
                          <div className="px-1.5 py-0.5 text-[10px] leading-tight flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={t.completed}
                              onChange={() => onToggleTask(t)}
                              className="accent-white"
                            />
                            <span className="truncate">
                              <span className="font-medium">{title}</span>{" "}
                              <span className="opacity-80">
                                {t.startTime}–{t.endTime}
                              </span>
                            </span>
                          </div>
                        ) : (
                          <div className="px-2 py-1 text-[11px] flex items-start gap-1">
                            <input
                              type="checkbox"
                              checked={t.completed}
                              onChange={() => onToggleTask(t)}
                              className="mt-0.5 accent-white"
                            />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{title}</div>
                              <div className="opacity-80">
                                {t.startTime}–{t.endTime}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isToday && nowTop !== null && (
                    <div
                      className="absolute left-0 right-0 pointer-events-none z-10"
                      style={{ top: `${nowTop}px` }}
                      aria-label="Current time"
                    >
                      <div className="h-0.5 bg-rose-500" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
