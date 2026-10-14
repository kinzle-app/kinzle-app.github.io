// Čas hry. Den hádanky se řídí časem Europe/Prague.
// (Ve fázi 4 se při připojení použije čas serveru, aby nevadily špatně nastavené hodiny v telefonu.)
import { pragueDate, isValidDate, TIME_ZONE } from '../game/calendar.js';

// Ve vývojové verzi jde den nastavit adresou ?datum=2026-10-19 (zkoušení denních hádanek dopředu)
const override = import.meta.env.DEV && new URLSearchParams(location.search).get('datum');

export function today() {
  return override && isValidDate(override) ? override : pragueDate(new Date());
}

// Kolik milisekund zbývá do půlnoci v Praze
export function msToNextDay(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).map((p) => [p.type, Number(p.value)]));
  const elapsed = (parts.hour * 3600 + parts.minute * 60 + parts.second) * 1000 + now.getMilliseconds();
  return 86400000 - elapsed;
}
