const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value) {
  return typeof value === "string" && TIME_RE.test(value);
}

export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
