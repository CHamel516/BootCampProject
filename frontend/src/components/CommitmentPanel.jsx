import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyDraft = {
  title: "",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "10:00",
};

export default function CommitmentPanel({
  commitments,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState(emptyDraft);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitNew(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onCreate({
        ...draft,
        dayOfWeek: Number(draft.dayOfWeek),
      });
      setDraft(emptyDraft);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(c) {
    setEditingId(c._id);
    setEdit({
      title: c.title,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
    });
    setError("");
  }

  async function saveEdit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await onUpdate(editingId, { ...edit, dayOfWeek: Number(edit.dayOfWeek) });
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3">
        <h2 className="text-lg font-semibold text-slate-800">My Schedule</h2>
        <p className="text-xs text-slate-500">Classes, work, gym — anything that blocks your week.</p>
      </div>

      <ul className="divide-y divide-slate-100">
        {commitments.length === 0 && (
          <li className="px-5 py-6 text-sm text-slate-400 italic">
            No commitments yet — add one below to see it on your week.
          </li>
        )}
        {commitments.map((c) =>
          editingId === c._id ? (
            <li key={c._id} className="px-5 py-3">
              <form onSubmit={saveEdit} className="grid grid-cols-6 gap-2 items-end">
                <input
                  className="col-span-6 border border-slate-300 rounded px-2 py-1 text-sm"
                  value={edit.title}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
                <select
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-sm"
                  value={edit.dayOfWeek}
                  onChange={(e) => setEdit({ ...edit, dayOfWeek: e.target.value })}
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-sm"
                  value={edit.startTime}
                  onChange={(e) => setEdit({ ...edit, startTime: e.target.value })}
                />
                <input
                  type="time"
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-sm"
                  value={edit.endTime}
                  onChange={(e) => setEdit({ ...edit, endTime: e.target.value })}
                />
                <div className="col-span-6 flex gap-2 justify-end">
                  <button
                    type="button"
                    className="text-xs px-3 py-1 rounded text-slate-600 hover:bg-slate-100"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={busy}
                    className="text-xs px-3 py-1 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </form>
            </li>
          ) : (
            <li
              key={c._id}
              className="px-5 py-2.5 flex items-center justify-between text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-800 truncate">
                  {c.title}
                </div>
                <div className="text-xs text-slate-500">
                  {DAYS[c.dayOfWeek]} · {c.startTime}–{c.endTime}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  className="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-100"
                  onClick={() => startEdit(c)}
                >
                  Edit
                </button>
                <button
                  className="text-xs px-2 py-1 rounded text-rose-600 hover:bg-rose-50"
                  onClick={() => onDelete(c._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          )
        )}
      </ul>

      <form onSubmit={submitNew} className="px-5 py-4 border-t border-slate-100 grid grid-cols-6 gap-2 items-end bg-slate-50/50">
        <input
          placeholder="Add a commitment (e.g. CS101)"
          className="col-span-6 border border-slate-300 rounded px-2 py-1.5 text-sm"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          required
        />
        <select
          className="col-span-2 border border-slate-300 rounded px-2 py-1.5 text-sm"
          value={draft.dayOfWeek}
          onChange={(e) => setDraft({ ...draft, dayOfWeek: e.target.value })}
        >
          {DAYS.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="time"
          className="col-span-2 border border-slate-300 rounded px-2 py-1.5 text-sm"
          value={draft.startTime}
          onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
        />
        <input
          type="time"
          className="col-span-2 border border-slate-300 rounded px-2 py-1.5 text-sm"
          value={draft.endTime}
          onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
        />
        <div className="col-span-6 flex justify-between items-center">
          {error && <span className="text-xs text-rose-600">{error}</span>}
          <button
            disabled={busy}
            className="ml-auto text-sm px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
