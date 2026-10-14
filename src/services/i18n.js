// Překlady. Nový jazyk = nový soubor src/locales/<kód>.json, nic dalšího.
import { typography } from './typography.js';

const files = import.meta.glob('../locales/*.json', { eager: true, import: 'default' });

export const LANGUAGES = Object.keys(files)
  .map((path) => path.match(/([\w-]+)\.json$/)[1])
  .sort();

const messages = Object.fromEntries(
  Object.entries(files).map(([path, data]) => [path.match(/([\w-]+)\.json$/)[1], data])
);

const FALLBACK = 'en';
let current = FALLBACK;

// Jazyk podle prohlížeče (cs-CZ → cs), jinak angličtina
export function detectLanguage(list = navigator.languages || [navigator.language]) {
  for (const tag of list) {
    const code = String(tag).toLowerCase().split('-')[0];
    if (LANGUAGES.includes(code)) return code;
  }
  return FALLBACK;
}

export function setLanguage(lang) {
  current = LANGUAGES.includes(lang) ? lang : FALLBACK;
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}

export function getLanguage() {
  return current;
}

// Text podle klíče, např. t('game.submit') nebo t('game.attemptsLeft', { count: 3 }).
// Množné číslo: hodnota v JSON je objekt { one, few, many, other } a vybírá se přes Intl.PluralRules.
export function t(key, params = {}) {
  const value = lookup(messages[current], key) ?? lookup(messages[FALLBACK], key) ?? key;
  let text = value;
  if (typeof value === 'object') {
    const rule = new Intl.PluralRules(current).select(params.count ?? 0);
    text = value[rule] ?? value.other;
  }
  text = text.replace(/\{(\w+)\}/g, (m, name) =>
    name in params ? format(params[name]) : m
  );
  return typography(text, current);
}

function lookup(obj, key) {
  return key.split('.').reduce((o, part) => (o == null ? undefined : o[part]), obj);
}

function format(value) {
  return typeof value === 'number' ? new Intl.NumberFormat(current).format(value) : String(value);
}
