import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_CHIP = ["S", "M", "T", "W", "T", "F", "S"];

const QUICK_PICKS = [
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "MWF", days: [1, 3, 5] },
  { label: "TTh", days: [2, 4] },
];

const emptyDraft = {
  title: "",
  daysOfWeek: [],
  startTime: "09:00",
  endTime: "10:00",
};

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function formatDays(days) {
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => DAYS[d])
    .join(", ");
}

function groupCommitments(commitments) {
  const groups = new Map();
  const singles = [];
  for (const c of commitments) {
    if (c.seriesId) {
      const key = String(c.seriesId);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    } else {
      singles.push(c);
    }
  }
  const seriesRows = [...groups.entries()].map(([seriesId, items]) => {
    const sorted = [...items].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    const first = sorted[0];
    return {
      type: "series",
      seriesId,
      title: first.title,
      startTime: first.startTime,
      endTime: first.endTime,
      daysOfWeek: sorted.map((c) => c.dayOfWeek),
      sortKey: first.startTime,
    };
  });
  const singleRows = singles.map((c) => ({
    type: "single",
    _id: c._id,
    title: c.title,
    dayOfWeek: c.dayOfWeek,
    startTime: c.startTime,
    endTime: c.endTime,
    sortKey: c.startTime,
  }));
  return [...seriesRows, ...singleRows].sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey)
  );
}

function DayChipRow({ selected, onToggle }) {
  return (
    <div className="col-span-6 flex gap-1">
      {DAY_CHIP.map((label, i) => {
        const isOn = selected.includes(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onToggle(i)}
            aria-pressed={isOn}
            aria-label={DAYS[i]}
            className={`w-9 h-9 rounded-full text-sm font-medium border transition ${
              isOn
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-brand-400"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function QuickPicks({ onPick, current }) {
  return (
    <div className="col-span-6 flex gap-2 text-xs">
      {QUICK_PICKS.map((p) => {
        const active = arraysEqual(current, p.days);
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => onPick(p.days)}
            className={`px-2 py-1 rounded border transition ${
              active
                ? "bg-brand-100 border-brand-400 text-brand-800"
                : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

export default function CommitmentPanel({
  commitments,
  onCreate,
  onUpdate,
  onDelete,
  onUpdateSeries,
  onDeleteSeries,
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState(null); // { kind: "single"|"series", id, draft }
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = groupCommitments(commitments);

  function toggleDraftDay(d) {
    setDraft((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(d)
        ? prev.daysOfWeek.filter((x) => x !== d)
        : [...prev.daysOfWeek, d],
    }));
  }

  function toggleEditDay(d) {
    setEditing((prev) => ({
      ...prev,
      draft: {
        ...prev.draft,
        daysOfWeek: prev.draft.daysOfWeek.includes(d)
          ? prev.draft.daysOfWeek.filter((x) => x !== d)
          : [...prev.draft.daysOfWeek, d],
      },
    }));
  }

  async function submitNew(e) {
    e.preventDefault();
    setError("");
    if (draft.daysOfWeek.length === 0) {
      setError("Pick at least one day.");
      return;
    }
    setBusy(true);
    try {
      const body =
        draft.daysOfWeek.length === 1
          ? {
              title: draft.title,
              dayOfWeek: draft.daysOfWeek[0],
              startTime: draft.startTime,
              endTime: draft.endTime,
            }
          : {
              title: draft.title,
              daysOfWeek: [...draft.daysOfWeek].sort((a, b) => a - b),
              startTime: draft.startTime,
              endTime: draft.endTime,
            };
      await onCreate(body);
      setDraft(emptyDraft);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEditSingle(row) {
    setEditing({
      kind: "single",
      id: row._id,
      draft: {
        title: row.title,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
      },
    });
    setError("");
  }

  function startEditSeries(row) {
    setEditing({
      kind: "series",
      id: row.seriesId,
      draft: {
        title: row.title,
        daysOfWeek: [...row.daysOfWeek],
        startTime: row.startTime,
        endTime: row.endTime,
      },
    });
    setError("");
  }

  async function saveEdit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editing.kind === "series") {
        if (editing.draft.daysOfWeek.length === 0) {
          setError("Pick at least one day.");
          setBusy(false);
          return;
        }
        await onUpdateSeries(editing.id, {
          title: editing.draft.title,
          daysOfWeek: [...editing.draft.daysOfWeek].sort((a, b) => a - b),
          startTime: editing.draft.startTime,
          endTime: editing.draft.endTime,
        });
      } else {
        await onUpdate(editing.id, {
          title: editing.draft.title,
          dayOfWeek: Number(editing.draft.dayOfWeek),
          startTime: editing.draft.startTime,
          endTime: editing.draft.endTime,
        });
      }
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteSeries(row) {
    const dayList = formatDays(row.daysOfWeek);
    if (
      !window.confirm(
        `Delete all ${row.daysOfWeek.length} occurrences of "${row.title}" (${dayList})?`
      )
    ) {
      return;
    }
    await onDeleteSeries(row.seriesId);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-3">
        <h2 className="text-lg font-semibold text-slate-800">My Schedule</h2>
        <p className="text-xs text-slate-500">
          Classes, work, gym — anything that blocks your week.
        </p>
      </div>

      <ul className="divide-y divide-slate-100">
        {rows.length === 0 && (
          <li className="px-5 py-6 text-sm text-slate-400 italic">
            No commitments yet — add one below to see it on your week.
          </li>
        )}

        {rows.map((row) => {
          const isEditingThis =
            editing &&
            ((row.type === "single" && editing.kind === "single" && editing.id === row._id) ||
              (row.type === "series" && editing.kind === "series" && editing.id === row.seriesId));

          if (isEditingThis && editing.kind === "series") {
            return (
              <li key={`s-${row.seriesId}`} className="px-5 py-3">
                <form onSubmit={saveEdit} className="grid grid-cols-6 gap-2 items-end">
                  <input
                    className="col-span-6 border border-slate-300 rounded px-2 py-1 text-sm"
                    value={editing.draft.title}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, title: e.target.value },
                      })
                    }
                  />
                  <DayChipRow
                    selected={editing.draft.daysOfWeek}
                    onToggle={toggleEditDay}
                  />
                  <input
                    type="time"
                    className="col-span-3 border border-slate-300 rounded px-2 py-1 text-sm"
                    value={editing.draft.startTime}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, startTime: e.target.value },
                      })
                    }
                  />
                  <input
                    type="time"
                    className="col-span-3 border border-slate-300 rounded px-2 py-1 text-sm"
                    value={editing.draft.endTime}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, endTime: e.target.value },
                      })
                    }
                  />
                  <div className="col-span-6 flex justify-between items-center">
                    {error && <span className="text-xs text-rose-600">{error}</span>}
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded text-slate-600 hover:bg-slate-100"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                      <button
                        disabled={busy}
                        className="text-xs px-3 py-1 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                      >
                        Save series
                      </button>
                    </div>
                  </div>
                </form>
              </li>
            );
          }

          if (isEditingThis && editing.kind === "single") {
            return (
              <li key={`c-${row._id}`} className="px-5 py-3">
                <form onSubmit={saveEdit} className="grid grid-cols-6 gap-2 items-end">
                  <input
                    className="col-span-6 border border-slate-300 rounded px-2 py-1 text-sm"
                    value={editing.draft.title}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, title: e.target.value },
                      })
                    }
                  />
                  <select
                    className="col-span-2 border border-slate-300 rounded px-2 py-1 text-sm"
                    value={editing.draft.dayOfWeek}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, dayOfWeek: e.target.value },
                      })
                    }
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
                    value={editing.draft.startTime}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, startTime: e.target.value },
                      })
                    }
                  />
                  <input
                    type="time"
                    className="col-span-2 border border-slate-300 rounded px-2 py-1 text-sm"
                    value={editing.draft.endTime}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        draft: { ...editing.draft, endTime: e.target.value },
                      })
                    }
                  />
                  <div className="col-span-6 flex justify-between items-center">
                    {error && <span className="text-xs text-rose-600">{error}</span>}
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded text-slate-600 hover:bg-slate-100"
                        onClick={() => setEditing(null)}
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
                  </div>
                </form>
              </li>
            );
          }

          if (row.type === "series") {
            return (
              <li
                key={`s-${row.seriesId}`}
                className="px-5 py-2.5 flex items-center justify-between text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-800 truncate">{row.title}</div>
                  <div className="text-xs text-slate-500">
                    {formatDays(row.daysOfWeek)} · {row.startTime}–{row.endTime}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    className="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-100"
                    onClick={() => startEditSeries(row)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs px-2 py-1 rounded text-rose-600 hover:bg-rose-50"
                    onClick={() => confirmDeleteSeries(row)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          }

          return (
            <li
              key={`c-${row._id}`}
              className="px-5 py-2.5 flex items-center justify-between text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-800 truncate">{row.title}</div>
                <div className="text-xs text-slate-500">
                  {DAYS[row.dayOfWeek]} · {row.startTime}–{row.endTime}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  className="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-100"
                  onClick={() => startEditSingle(row)}
                >
                  Edit
                </button>
                <button
                  className="text-xs px-2 py-1 rounded text-rose-600 hover:bg-rose-50"
                  onClick={() => onDelete(row._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={submitNew}
        className="px-5 py-4 border-t border-slate-100 grid grid-cols-6 gap-2 items-end bg-slate-50/50"
      >
        <input
          placeholder="Add a commitment (e.g. CS101)"
          className="col-span-6 border border-slate-300 rounded px-2 py-1.5 text-sm"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          required
        />
        <DayChipRow selected={draft.daysOfWeek} onToggle={toggleDraftDay} />
        <QuickPicks
          current={draft.daysOfWeek}
          onPick={(days) => setDraft({ ...draft, daysOfWeek: days })}
        />
        <input
          type="time"
          className="col-span-3 border border-slate-300 rounded px-2 py-1.5 text-sm"
          value={draft.startTime}
          onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
        />
        <input
          type="time"
          className="col-span-3 border border-slate-300 rounded px-2 py-1.5 text-sm"
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
