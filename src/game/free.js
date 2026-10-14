// Volná hra: hádanky, které hráč už na Cestě dohrál, a starší denní hádanky.
// Filtr lehké / střední / těžké zatím podle plánované úrovně hádanky (1–5);
// ve fázi 4 ho nahradí skutečná obtížnost z dat hráčů.

export const BUCKETS = ['easy', 'medium', 'hard'];

export function bucketOf(puzzle) {
  return puzzle.level <= 2 ? 'easy' : puzzle.level === 3 ? 'medium' : 'hard';
}

// pathState = actState(…) nebo null, schedule = rozpis denních, byId = schválené hádanky
// Vrací [{ puzzle, source: 'path' | 'daily', level?, date? }], nejnovější denní nahoře, pak Cesta
export function freePuzzles({ pathState, schedule, byId, today }) {
  const seen = new Set();
  const list = [];
  const add = (puzzle, info) => {
    if (!puzzle || seen.has(puzzle.id)) return;
    seen.add(puzzle.id);
    list.push({ puzzle, ...info });
  };
  for (const date of Object.keys(schedule).filter((d) => d < today).sort().reverse()) {
    add(byId.get(schedule[date]), { source: 'daily', date });
  }
  for (const chapter of pathState?.chapters || []) {
    for (const level of chapter.levels) {
      if (level.state === 'done') add(byId.get(level.puzzle), { source: 'path', level: level.index + 1 });
    }
  }
  return list;
}
