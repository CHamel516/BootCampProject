import { useState } from "react";

const emptyDraft = {
  title: "",
  hoursPerWeek: 3,
  sessionMinutes: 45,
  preferredTime: "evening",
};

export default function GoalForm({ onCreateAndPlan }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onCreateAndPlan({
        ...draft,
        hoursPerWeek: Number(draft.hoursPerWeek),
        sessionMinutes: Number(draft.sessionMinutes),
      });
      setDraft(emptyDraft);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white shadow-sm">
      <div className="px-5 py-3 border-b border-brand-100">
        <h2 className="text-lg font-semibold text-slate-800">Start Something New</h2>
        <p className="text-xs text-slate-500">Learn without burning out — we'll fit it into your week.</p>
      </div>
      <form onSubmit={submit} className="px-5 py-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            What do you want to learn?
          </label>
          <input
            required
            placeholder="e.g. Learn Spanish"
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Hours per week
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
              value={draft.hoursPerWeek}
              onChange={(e) => setDraft({ ...draft, hoursPerWeek: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Session length (min)
            </label>
            <input
              type="number"
              min="5"
              className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
              value={draft.sessionMinutes}
              onChange={(e) => setDraft({ ...draft, sessionMinutes: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Preferred time
          </label>
          <select
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
            value={draft.preferredTime}
            onChange={(e) => setDraft({ ...draft, preferredTime: e.target.value })}
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="any">Any time</option>
          </select>
        </div>
        {error && <div className="text-xs text-rose-600">{error}</div>}
        <button
          disabled={busy}
          className="w-full py-2 rounded bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50 transition"
        >
          {busy ? "Planning..." : "Plan My Week"}
        </button>
      </form>
    </div>
  );
}
