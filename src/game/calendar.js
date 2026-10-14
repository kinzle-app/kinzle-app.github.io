// Práce s kalendářními dny. Den hádanky se řídí časem Europe/Prague, ne časovým pásmem telefonu.
// Datum se všude předává jako text 'YYYY-MM-DD'.

export const TIME_ZONE = 'Europe/Prague';

// Dnešní datum v Praze (např. '2026-10-14')
export function pragueDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

// Den v týdnu: 0 = neděle, 1 = pondělí … 6 = sobota
export function weekday(date) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function addDays(date, days) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && addDays(date, 0) === date;
}
