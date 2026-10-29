// Postup hráče: historie dohraných her a z ní odvozený váček se semínky a statistiky.
// Data mají číslo verze schématu; poškozené nebo neznámé části se při načtení zahodí, hra nespadne.

export const SCHEMA_VERSION = 1;
export const MODES = ['daily', 'archive', 'path', 'free', 'pack', 'custom'];

export function emptyProgress() {
  return { version: SCHEMA_VERSION, history: [], skipped: [], storySeen: [], notebook: { text: '' } };
}

// Kontrola jednoho záznamu historie
function validEntry(e) {
  return e && typeof e === 'object'
    && typeof e.puzzleId === 'string'
    && MODES.includes(e.mode)
    && typeof e.date === 'string'
    && typeof e.won === 'boolean'
    && [e.score, e.seconds, e.mistakes, e.hints].every(Number.isFinite)
    && Array.isArray(e.solved)
    && e.solved.every((g) => g && typeof g.title === 'string' && Array.isArray(g.words) && Number.isInteger(g.difficulty));
}

// Načtení uložených dat: migrace starších verzí, oprava poškozených
export function normalizeProgress(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== SCHEMA_VERSION || !Array.isArray(raw.history)) {
    // zatím existuje jen verze 1; budoucí migrace se přidají sem
    return emptyProgress();
  }
  const strings = (list) => (Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []);
  return {
    version: SCHEMA_VERSION,
    history: raw.history.filter(validEntry),
    skipped: strings(raw.skipped),           // přeskočené úrovně Cesty (id hádanek)
    storySeen: strings(raw.storySeen),       // přečtené části příběhu ('intro:1-1', 'outro:1-1')
    // tip do zápisníku a den, kdy ho hráč uložil (starší tipy datum nemají)
    notebook: {
      text: typeof raw.notebook?.text === 'string' ? raw.notebook.text : '',
      ...(typeof raw.notebook?.savedAt === 'string' && { savedAt: raw.notebook.savedAt })
    }
  };
}

// Záznam dohrané hry. game = stav z engine.js; tier = úroveň jazyka u denní hádanky (jen jazyky s úrovněmi);
// code = kód vlastní hádanky od hráče (z něj jde hádanku znovu otevřít)
export function createEntry(game, { mode, date, seconds, score, tier, code, finishedAt = new Date().toISOString() }) {
  return {
    ...(tier && { tier }),
    ...(code && { code }),
    puzzleId: game.puzzle.id,
    mode,
    date,
    won: game.status === 'won',
    score,
    seconds,
    mistakes: game.mistakes,
    hints: game.hints.length,
    // vyřešené skupiny i s obsahem: váček tak nezávisí na pozdějších úpravách hádanek
    solved: game.solved.map((i) => {
      const g = game.puzzle.groups[i];
      return { title: g.title, words: [...g.words], difficulty: g.difficulty };
    }),
    // pokusy po řadě (slova + výsledek) pro přehled Moje hry; starší záznamy je nemají
    attempts: game.attempts.map((a) => ({ words: [...a.words], result: a.result })),
    finishedAt
  };
}

export function addEntry(progress, entry) {
  return { ...progress, history: [...progress.history, entry] };
}

// Odehraná denní hádanka daného dne (u jazyka s úrovněmi pro danou úroveň).
// Záznamy bez úrovně (z doby před úrovněmi) patří k výchozí úrovni jazyka (fallback).
export function dailyEntry(progress, date, tier = null, fallback = null) {
  return progress.history.find((e) => e.mode === 'daily' && e.date === date && (e.tier || fallback) === tier) || null;
}

// Váček: každá vyřešená skupina je jedno semínko (stejná skupina se nepočítá dvakrát).
// Vzácné semínko: skupina vyřešená aspoň jednou v čisté hře (výhra bez chyby a nápovědy).
// Vlastní hádanky od hráčů se nepočítají (dají se vymyslet libovolně).
export function seeds(progress) {
  const byKey = new Map();
  for (const e of progress.history) {
    if (e.mode === 'custom') continue;
    const clean = e.won && e.mistakes === 0 && e.hints === 0;
    for (const g of e.solved) {
      const key = `${e.puzzleId}#${g.difficulty}`;
      const seed = byKey.get(key);
      if (seed) seed.rare ||= clean;
      else byKey.set(key, { key, puzzleId: e.puzzleId, title: g.title, words: g.words, difficulty: g.difficulty, date: e.date, rare: clean });
    }
  }
  return [...byKey.values()];
}

// Statistiky bez tréninku (Volná hra je bez bodů a bez limitu chyb, zkreslovala by úspěšnost) a bez vlastních hádanek
export function stats(progress) {
  const h = progress.history.filter((e) => e.mode !== 'free' && e.mode !== 'custom');
  const won = h.filter((e) => e.won);
  const mistakes = [0, 1, 2, 3, 4].map((n) => h.filter((e) => e.mistakes === n).length);
  return {
    played: h.length,
    won: won.length,
    winRate: h.length ? Math.round((won.length / h.length) * 100) : 0,
    averageSeconds: won.length ? Math.round(won.reduce((s, e) => s + e.seconds, 0) / won.length) : 0,
    bestScore: h.reduce((best, e) => Math.max(best, e.score), 0),
    dailies: h.filter((e) => e.mode === 'daily').length,
    mistakes
  };
}

// ---------- záloha do souboru ----------
export function createBackup(progress, settings, exportedAt = new Date().toISOString()) {
  return { app: 'kinzle', version: SCHEMA_VERSION, exportedAt, settings, progress };
}

// Vrací { progress, settings } nebo null, když soubor není platná záloha Kinzle
export function readBackup(data) {
  if (!data || data.app !== 'kinzle' || typeof data.progress !== 'object') return null;
  const progress = normalizeProgress(data.progress);
  if (data.progress.history?.length && !progress.history.length) return null;
  return { progress, settings: data.settings && typeof data.settings === 'object' ? data.settings : {} };
}
