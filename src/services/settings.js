// Nastavení hráče. Klíč a výchozí stůl musí odpovídat skriptu v index.html,
// který nastavuje stůl ještě před prvním vykreslením.
import { load, save } from './storage.js';

const KEY = 'settings';
export const TABLES = ['evening', 'day', 'auto']; // Večerní / Denní / Podle telefonu

const defaults = { lang: null, table: 'evening' };

export function getSettings() {
  return { ...defaults, ...load(KEY, {}) };
}

export function updateSettings(changes) {
  const next = { ...getSettings(), ...changes };
  save(KEY, next);
  return next;
}
