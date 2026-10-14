// Denní hádanka: číslo (Kinzle #N), hádanka podle rozpisu, nebo repríza, když rozpis došel.
import { weekday } from './calendar.js';
import { RHYTHM } from '../config/rhythm.js';

function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
}

// Jednoduchý stabilní „hash“ textu: stejné datum = stejná repríza pro všechny hráče
function hash(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

// schedule = { 'YYYY-MM-DD': id }, byId = Map(id → hádanka)
// Vrací { upcoming: první datum } před začátkem rozpisu, jinak { puzzle, number, rerun }
export function dailyFor(date, schedule, byId) {
  const dates = Object.keys(schedule).filter((d) => byId.has(schedule[d])).sort();
  if (!dates.length || date < dates[0]) return { upcoming: dates[0] || null };
  const number = daysBetween(dates[0], date) + 1;

  if (schedule[date] && byId.has(schedule[date])) return { puzzle: byId.get(schedule[date]), number, rerun: false };

  // Repríza: starší denní hádanka, deterministicky podle data; přednost má velikost podle rytmu týdne
  const past = dates.filter((d) => d < date).map((d) => byId.get(schedule[d]));
  const fitting = past.filter((p) => p.size === RHYTHM[weekday(date)].size);
  const pool = fitting.length ? fitting : past;
  return { puzzle: pool[hash(date) % pool.length], number, rerun: true };
}
