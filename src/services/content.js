// Načítání hádanek. Teď jsou zabalené přímo v aplikaci (content/<jazyk>/puzzles/*.json).
// Ve fázi 3 se tady přidá stahování z webu přes content/manifest.json, zbytek hry se nezmění.
import { validatePuzzle } from '../game/puzzle.js';

const files = import.meta.glob('/content/*/puzzles/*.json', { eager: true, import: 'default' });

// Poškozená hádanka se přeskočí, hra kvůli ní nespadne
const puzzles = Object.values(files).filter((p) => {
  const errors = validatePuzzle(p);
  if (errors.length) console.warn(`Hádanka ${p?.id} přeskočena:`, errors);
  return errors.length === 0;
});

export function listPuzzles(lang) {
  return puzzles.filter((p) => p.language === lang).sort((a, b) => a.id.localeCompare(b.id));
}

export function getPuzzle(id) {
  return puzzles.find((p) => p.id === id) || null;
}
