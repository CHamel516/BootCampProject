import { useState } from "react";
import { colorFor } from "../colors.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ProgressBar({ done, total, palette }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`${palette?.dot || "bg-brand-500"} h-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">
        {done} of {total}
      </span>
    </div>
  );
}

export default function TodoList({
  tasks,
  goals,
  onToggle,
  onUpdate,
  onDelete,
  onCreate,
}) {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({ title: "", startTime: "", endTime: "" });

  const goalIndex = new Map(goals.map((g, i) => [g._id, i]));

  function startEdit(t) {
    setEditingId(t._id);
    setEdit({
      title: t.title,
      startTime: t.startTime || "",
      endTime: t.endTime || "",
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    const patch = { title: edit.title };
    if (edit.startTime) patch.startTime = edit.startTime;
    if (edit.endTime) patch.endTime = edit.endTime;
    await onUpdate(editingId, patch);
    setEditingId(null);
  }

  async function addPlain(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onCreate({ title: newTitle.trim() });
    setNewTitle("");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3">
        <h2 className="text-lg font-semibold text-slate-800">To-Do</h2>
        <p className="text-xs text-slate-500">
          Learning sessions and anything else on your plate.
        </p>
      </div>

      {goals.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-100 space-y-2 bg-slate-50/50">
          {goals.map((g, i) => {
            const palette = colorFor(i);
            const goalTasks = tasks.filter((t) => t.goalId === g._id);
            const done = goalTasks.filter((t) => t.completed).length;
            return (
              <div
                key={g._id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${palette.dot}`} />
                  <span className="font-medium text-slate-700 truncate">
                    {g.title}
                  </span>
                </div>
                <ProgressBar
                  done={done}
                  total={goalTasks.length}
                  palette={palette}
                />
              </div>
            );
          })}
        </div>
      )}

      <ul className="divide-y divide-slate-100">
        {tasks.length === 0 && (
          <li className="px-5 py-6 text-sm text-slate-400 italic">
            No tasks yet — add one below, or plan a goal above.
          </li>
        )}
        {tasks.map((t) => {
          const goal = t.goalId ? goals.find((g) => g._id === t.goalId) : null;
          const palette = goal ? colorFor(goalIndex.get(goal._id)) : null;
          const isEditing = editingId === t._id;
          return (
            <li key={t._id} className="px-5 py-2.5">
              {isEditing ? (
                <form onSubmit={saveEdit} className="flex flex-wrap gap-2 items-center">
                  <input
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm min-w-[160px]"
                    value={edit.title}
                    onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                  />
                  {t.dayOfWeek != null && (
                    <>
                      <input
                        type="time"
                        className="border border-slate-300 rounded px-2 py-1 text-sm"
                        value={edit.startTime}
                        onChange={(e) =>
                          setEdit({ ...edit, startTime: e.target.value })
                        }
                      />
                      <input
                        type="time"
                        className="border border-slate-300 rounded px-2 py-1 text-sm"
                        value={edit.endTime}
                        onChange={(e) =>
                          setEdit({ ...edit, endTime: e.target.value })
                        }
                      />
                    </>
                  )}
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-100"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                  <button className="text-xs px-3 py-1 rounded bg-brand-600 text-white hover:bg-brand-700">
                    Save
                  </button>
                </form>
              ) : (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => onToggle(t)}
                    className="mt-1 h-4 w-4 accent-brand-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {palette && (
                        <span
                          className={`inline-flex items-center text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${palette.chip}`}
                        >
                          {goal.title}
                        </span>
                      )}
                      <span
                        className={`text-sm text-slate-800 ${t.completed ? "line-through text-slate-400" : ""}`}
                      >
                        {t.title}
                      </span>
                    </div>
                    {t.dayOfWeek != null && t.startTime && t.endTime && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {DAYS[t.dayOfWeek]} · {t.startTime}–{t.endTime}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      className="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-100"
                      onClick={() => startEdit(t)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded text-rose-600 hover:bg-rose-50"
                      onClick={() => onDelete(t._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={addPlain} className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
        <input
          placeholder="Add a quick to-do (not tied to a goal)"
          className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button className="text-sm px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-800">
          Add
        </button>
      </form>
    </div>
  );
}
