import { colorFor } from "../colors.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_START = 8;
const HOUR_END = 22;
const HOURS = HOUR_END - HOUR_START;
const ROW_PX = 44;

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function blockStyle(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const top = ((start - HOUR_START * 60) / 60) * ROW_PX;
  const height = ((end - start) / 60) * ROW_PX;
  return {
    top: `${Math.max(0, top)}px`,
    height: `${Math.max(16, height)}px`,
  };
}

export default function WeekCalendar({ commitments, tasks, goals, onToggleTask }) {
  const goalIndexById = new Map(goals.map((g, i) => [g._id, i]));

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
          {Array.from({ length: HOURS }, (_, i) => (
            <div
              key={i}
              className="h-11 text-[11px] text-slate-400 px-2 flex items-start justify-end pt-1"
            >
              {String(HOUR_START + i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 min-w-[640px]">
          {DAYS.map((label, dayIndex) => {
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
                className="border-r border-slate-100 last:border-r-0"
              >
                <div className="h-9 flex items-center justify-center text-sm font-medium text-slate-600 border-b border-slate-100 bg-slate-50">
                  {label}
                </div>
                <div
                  className="relative"
                  style={{ height: `${HOURS * ROW_PX}px` }}
                >
                  {Array.from({ length: HOURS }, (_, i) => (
                    <div
                      key={i}
                      className="border-b border-slate-100"
                      style={{ height: `${ROW_PX}px` }}
                    />
                  ))}

                  {dayCommitments.map((c) => (
                    <div
                      key={c._id}
                      className="absolute left-1 right-1 rounded-md border bg-slate-200/80 border-slate-300 text-slate-700 text-[11px] px-2 py-1 overflow-hidden"
                      style={blockStyle(c.startTime, c.endTime)}
                      title={`${c.title} · ${c.startTime}–${c.endTime}`}
                    >
                      <div className="font-medium truncate">{c.title}</div>
                      <div className="opacity-70">
                        {c.startTime}–{c.endTime}
                      </div>
                    </div>
                  ))}

                  {daySessions.map((t) => {
                    const idx = goalIndexById.get(t.goalId);
                    const palette = colorFor(idx) || colorFor(0);
                    const goal = goals.find((g) => g._id === t.goalId);
                    return (
                      <div
                        key={t._id}
                        className={`absolute left-1 right-1 rounded-md border text-white text-[11px] px-2 py-1 overflow-hidden shadow-sm animate-pop ${palette.block} ${
                          t.completed ? "opacity-60 line-through" : ""
                        }`}
                        style={blockStyle(t.startTime, t.endTime)}
                        title={`${goal?.title || "Session"} · ${t.startTime}–${t.endTime}`}
                      >
                        <div className="flex items-start gap-1">
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => onToggleTask(t)}
                            className="mt-0.5 accent-white"
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {goal?.title || "Session"}
                            </div>
                            <div className="opacity-80">
                              {t.startTime}–{t.endTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
