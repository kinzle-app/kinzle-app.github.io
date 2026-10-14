// Čas hry. Den hádanky se řídí časem Europe/Prague.
// (Ve fázi 4 se při připojení použije čas serveru, aby nevadily špatně nastavené hodiny v telefonu.)
import { pragueDate, isValidDate, TIME_ZONE } from '../game/calendar.js';
import { isDebug } from './debug.js';

// Části data a času v Praze
function pragueParts(at) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(at).map((p) => [p.type, Number(p.value)]));
}

// Okamžik (ms) pro datum a čas v Praze
function pragueMs(date, hour, minute) {
  const [y, m, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const p = pragueParts(new Date(guess));
  const shift = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - guess; // posun Prahy proti UTC
  return guess - shift;
}

// Ve vývojové verzi a v testovacím režimu jde posunout hodiny adresou ?datum=2026-10-19&cas=23:59.
// Hodiny pak běží dál od nastaveného okamžiku (jde tak vyzkoušet i půlnoc).
const params = new URLSearchParams(location.search);
const allowed = import.meta.env.DEV || isDebug();
const date = allowed && isValidDate(params.get('datum')) ? params.get('datum') : null;
const time = allowed && /^([01]\d|2[0-3]):[0-5]\d$/.test(params.get('cas') || '') ? params.get('cas').split(':').map(Number) : null;
const offset = date || time ? (() => {
  const real = pragueParts(new Date());
  const [hour, minute] = time || [real.hour, real.minute];
  return pragueMs(date || pragueDate(new Date()), hour, minute) - Date.now();
})() : 0;

export function now() {
  return new Date(Date.now() + offset);
}

export function today() {
  return pragueDate(now());
}

// true, když jsou hodiny posunuté (testovací režim to ukazuje)
export function isShifted() {
  return offset !== 0;
}

// Kolik milisekund zbývá do půlnoci v Praze
export function msToNextDay(at = now()) {
  const parts = pragueParts(at);
  const elapsed = (parts.hour * 3600 + parts.minute * 60 + parts.second) * 1000 + at.getMilliseconds();
  return 86400000 - elapsed;
}
