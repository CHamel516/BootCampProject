export const GOAL_PALETTE = [
  { block: "bg-indigo-500/90 border-indigo-600", chip: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  { block: "bg-emerald-500/90 border-emerald-600", chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  { block: "bg-amber-500/90 border-amber-600", chip: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  { block: "bg-rose-500/90 border-rose-600", chip: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
  { block: "bg-cyan-500/90 border-cyan-600", chip: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500" },
  { block: "bg-fuchsia-500/90 border-fuchsia-600", chip: "bg-fuchsia-100 text-fuchsia-700", dot: "bg-fuchsia-500" },
];

export function colorFor(goalIndex) {
  if (goalIndex == null || goalIndex < 0) return null;
  return GOAL_PALETTE[goalIndex % GOAL_PALETTE.length];
}
