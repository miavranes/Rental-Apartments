export function toLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayLocal() {
  return toLocalDateStr(new Date());
}

// Dodaje n dana na datum u 'YYYY-MM-DD' formatu i vraca isti format.
// Koristi se da bi check-out uvijek morao biti bar 1 dan poslije check-in-a
// (minimum jedno nocenje, check-in i check-out ne mogu biti isti dan).
export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toLocalDateStr(d);
}