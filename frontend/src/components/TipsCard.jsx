export default function TipsCard({ tips }) {
  if (!tips || tips.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm animate-pop">
      <div className="px-5 py-3 border-b border-amber-100">
        <h2 className="text-sm font-semibold text-amber-900">
          Pacing tips for this plan
        </h2>
      </div>
      <ul className="px-5 py-3 space-y-2 text-sm text-amber-900">
        {tips.map((t, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden>•</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
