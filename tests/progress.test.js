import { describe, it, expect } from 'vitest';
import {
  emptyProgress, normalizeProgress, createEntry, addEntry, dailyEntry, seeds, stats, createBackup, readBackup
} from '../src/game/progress.js';
import { dailyFor } from '../src/game/daily.js';
import { createGame, toggleWord, clearSelection, submit } from '../src/game/engine.js';

const puzzle = (id, size = 3) => ({
  id, language: 'cs', size, level: 1, status: 'approved', author: 'a', createdAt: '2026-10-14',
  groups: Array.from({ length: size }, (_, g) => ({
    title: `S${g}`, difficulty: g + 1, words: [0, 1, 2, 3].map((w) => `${id}-${g}-${w}`), explanation: '-'
  }))
});

function play(p, { mistakes = 0, solve = p.size } = {}) {
  const game = createGame(p);
  const pick = (words) => { clearSelection(game); words.forEach((w) => toggleWord(game, w)); submit(game); };
  for (let m = 0; m < mistakes; m++) pick([p.groups[0].words[0], p.groups[1].words[m], p.groups[1].words[(m + 1) % 4], p.groups[2].words[m]]);
  for (let g = 0; g < solve; g++) pick(p.groups[g].words);
  return game;
}

const entry = (p, opts = {}, meta = {}) =>
  createEntry(play(p, opts), { mode: 'daily', date: '2026-10-19', seconds: 60, score: 100, ...meta });

describe('historie a váček', () => {
  it('záznam obsahuje vyřešené skupiny i se slovy', () => {
    const e = entry(puzzle('cs-0001'));
    expect(e).toMatchObject({ puzzleId: 'cs-0001', won: true, mistakes: 0, hints: 0 });
    expect(e.solved).toHaveLength(3);
    expect(e.attempts.map((x) => x.result)).toEqual(['correct', 'correct', 'correct']);
    expect(e.solved[0].words).toEqual(['cs-0001-0-0', 'cs-0001-0-1', 'cs-0001-0-2', 'cs-0001-0-3']);
  });

  it('každá vyřešená skupina = semínko, čistá hra = vzácné', () => {
    let p = addEntry(emptyProgress(), entry(puzzle('cs-0001')));
    p = addEntry(p, entry(puzzle('cs-0002'), { mistakes: 1 }));
    const s = seeds(p);
    expect(s).toHaveLength(6);
    expect(s.filter((x) => x.rare)).toHaveLength(3);
  });

  it('stejná skupina se do váčku nepřidá dvakrát, ale může zvzácnět', () => {
    let p = addEntry(emptyProgress(), entry(puzzle('cs-0001'), { mistakes: 1 }));
    p = addEntry(p, entry(puzzle('cs-0001'), {}, { mode: 'free' }));
    const s = seeds(p);
    expect(s).toHaveLength(3);
    expect(s.every((x) => x.rare)).toBe(true);
  });

  it('i prohraná hra dá semínka za vyřešené skupiny', () => {
    const e = createEntry(play(puzzle('cs-0003'), { mistakes: 4, solve: 0 }), { mode: 'free', date: 'x', seconds: 1, score: 0 });
    expect(e.won).toBe(false);
    const g = play(puzzle('cs-0004'), { solve: 1 });
    expect(seeds(addEntry(emptyProgress(), createEntry(g, { mode: 'free', date: 'x', seconds: 1, score: 0 })))).toHaveLength(1);
  });

  it('najde dnešní denní výsledek', () => {
    const p = addEntry(emptyProgress(), entry(puzzle('cs-0001')));
    expect(dailyEntry(p, '2026-10-19')).not.toBe(null);
    expect(dailyEntry(p, '2026-10-20')).toBe(null);
  });

  it('u jazyka s úrovněmi se denní hraje jednou za každou úroveň', () => {
    const e = createEntry(play(puzzle('en-0001')), { mode: 'daily', date: '2026-10-19', seconds: 1, score: 0, tier: 'hard' });
    const p = addEntry(emptyProgress(), e);
    expect(e.tier).toBe('hard');
    expect(dailyEntry(p, '2026-10-19', 'hard')).not.toBe(null);
    expect(dailyEntry(p, '2026-10-19', 'easy')).toBe(null);
    expect(dailyEntry(p, '2026-10-19')).toBe(null);
  });

  it('statistiky', () => {
    let p = addEntry(emptyProgress(), entry(puzzle('cs-0001'), {}, { score: 120, seconds: 100 }));
    p = addEntry(p, entry(puzzle('cs-0002'), { mistakes: 2 }, { score: 80, seconds: 200, mode: 'archive' }));
    p = addEntry(p, entry(puzzle('cs-0003'), {}, { score: 0, seconds: 5, mode: 'free' })); // trénink se nepočítá
    expect(stats(p)).toMatchObject({ played: 2, won: 2, winRate: 100, averageSeconds: 150, bestScore: 120, dailies: 1, mistakes: [1, 0, 1, 0, 0] });
  });
});

describe('poškozená data a záloha', () => {
  it('neznámá nebo rozbitá data → prázdný postup', () => {
    expect(normalizeProgress(null)).toEqual(emptyProgress());
    expect(normalizeProgress({ version: 99, history: [] })).toEqual(emptyProgress());
    expect(normalizeProgress('nesmysl')).toEqual(emptyProgress());
  });

  it('rozbitý záznam se zahodí, ostatní zůstanou', () => {
    const good = entry(puzzle('cs-0001'));
    const p = normalizeProgress({ version: 1, history: [good, { puzzleId: 5 }, null] });
    expect(p.history).toEqual([good]);
  });

  it('záloha se dá přečíst zpět', () => {
    const p = addEntry(emptyProgress(), entry(puzzle('cs-0001')));
    const backup = JSON.parse(JSON.stringify(createBackup(p, { lang: 'cs' })));
    expect(readBackup(backup)).toEqual({ progress: p, settings: { lang: 'cs' } });
  });

  it('cizí soubor není záloha', () => {
    expect(readBackup({ foo: 1 })).toBe(null);
    expect(readBackup({ app: 'kinzle', progress: { version: 1, history: [{ rozbite: true }] } })).toBe(null);
  });
});

describe('denní hádanka', () => {
  const p4 = [1, 2, 3, 4, 5].map((n) => puzzle(`cs-000${n}`, 4));
  const p5 = puzzle('cs-0099', 5);
  const byId = new Map([...p4, p5].map((p) => [p.id, p]));
  const schedule = { '2026-10-19': 'cs-0001', '2026-10-20': 'cs-0002', '2026-10-21': 'cs-0003', '2026-10-24': 'cs-0099' };

  it('podle rozpisu s pořadovým číslem od prvního dne', () => {
    expect(dailyFor('2026-10-19', schedule, byId)).toEqual({ puzzle: p4[0], number: 1, rerun: false });
    expect(dailyFor('2026-10-24', schedule, byId)).toMatchObject({ number: 6, rerun: false });
  });

  it('před začátkem rozpisu ukáže, kdy začne', () => {
    expect(dailyFor('2026-10-18', schedule, byId)).toEqual({ upcoming: '2026-10-19' });
  });

  it('když rozpis dojde: repríza starší hádanky, pro všechny stejná', () => {
    const a = dailyFor('2026-10-22', schedule, byId);
    expect(a).toMatchObject({ number: 4, rerun: true });
    expect(['cs-0001', 'cs-0002', 'cs-0003']).toContain(a.puzzle.id); // čtvrtek: velikost 4×4
    expect(dailyFor('2026-10-22', schedule, byId)).toEqual(a);
  });

  it('o víkendu má repríza přednost ve velikosti 5×4', () => {
    expect(dailyFor('2026-10-31', schedule, byId).puzzle.id).toBe('cs-0099');
  });
});
