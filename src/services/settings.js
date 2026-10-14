// Nastavení hráče. Klíč a výchozí stůl musí odpovídat skriptu v index.html,
// který nastavuje stůl ještě před prvním vykreslením.
import { load, save } from './storage.js';

const KEY = 'settings';
export const TABLES = ['evening', 'day', 'auto']; // Večerní / Denní / Podle telefonu

export const FONT_SIZES = ['normal', 'large', 'xlarge'];

const defaults = {
  lang: null,            // null = zvolí se podle prohlížeče
  table: 'evening',
  sound: true,
  vibration: true,
  reduceMotion: false,   // omezení animací navíc k systémovému nastavení
  colorblind: false,     // symboly skupin i na kostičkách s nápovědou
  fontSize: 'normal',
  onboarded: false       // úvodní návod už viděl
};

export function getSettings() {
  return { ...defaults, ...load(KEY, {}) };
}

export function updateSettings(changes) {
  const next = { ...getSettings(), ...changes };
  save(KEY, next);
  return next;
}
