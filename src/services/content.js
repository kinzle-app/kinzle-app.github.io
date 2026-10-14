// Načítání hádanek. Teď jsou zabalené přímo v aplikaci (content/<jazyk>/puzzles/*.json).
// Ve fázi 3 se tady přidá stahování z webu přes content/manifest.json, zbytek hry se nezmění.
import { validatePuzzle } from '../game/puzzle.js';
import { t } from './i18n.js';

const files = import.meta.glob('/content/*/puzzles/*.json', { eager: true, import: 'default' });
// Návrhy ke schválení jen ve vývojové verzi (npm run dev), aby je šlo vyzkoušet; do nasazené hry se nedostanou
const drafts = import.meta.env.DEV ? import.meta.glob('/content/*/drafts/*.json', { eager: true, import: 'default' }) : {};

// Poškozená hádanka se přeskočí, hra kvůli ní nespadne
const puzzles = [...Object.values(files), ...Object.values(drafts)].filter((p) => {
  const errors = validatePuzzle(p);
  if (errors.length) console.warn(`Hádanka ${p?.id} přeskočena:`, errors);
  return errors.length === 0;
});

export function listPuzzles(lang) {
  return puzzles.filter((p) => p.language === lang).sort((a, b) => a.id.localeCompare(b.id));
}

// Název hádanky v seznamu a v liště: návrh podle id, jinak pořadí v seznamu
export function puzzleLabel(puzzle) {
  if (puzzle.status === 'draft') return t('home.draft', { id: puzzle.id });
  return t('home.puzzle', { n: listPuzzles(puzzle.language).filter((p) => p.status !== 'draft').indexOf(puzzle) + 1 });
}

// Rozpis denních hádanek a schválené hádanky pro výběr denní hádanky
const schedules = Object.fromEntries(Object.entries(
  import.meta.glob('/content/*/daily.json', { eager: true, import: 'default' })
).map(([path, data]) => [path.split('/')[2], data]));

export function dailySchedule(lang) {
  return schedules[lang] || {};
}

export function approvedById() {
  return new Map(puzzles.filter((p) => p.status === 'approved').map((p) => [p.id, p]));
}

export function getPuzzle(id) {
  return puzzles.find((p) => p.id === id) || null;
}
