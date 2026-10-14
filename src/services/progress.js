// Uložený postup hráče (historie her). Logika je v src/game/progress.js.
import { load, save } from './storage.js';
import { normalizeProgress, addEntry, seeds } from '../game/progress.js';

const KEY = 'progress';

export function getProgress() {
  return normalizeProgress(load(KEY, null));
}

// Uloží dohranou hru a vrátí, kolik nových semínek přibylo do váčku
export function recordGame(entry) {
  const before = getProgress();
  const after = addEntry(before, entry);
  save(KEY, after);
  return seeds(after).length - seeds(before).length;
}

export function replaceProgress(progress) {
  save(KEY, progress);
}
