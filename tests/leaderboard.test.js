import { describe, it, expect } from 'vitest';
import { dailyToSend, pathToSend, pathBadge } from '../src/game/leaderboard.js';

const entry = (puzzleId, mode, date, extra = {}) =>
  ({ puzzleId, mode, date, won: true, score: 100, seconds: 60, mistakes: 0, hints: 0, solved: [], ...extra });

describe('denní výsledky do žebříčku', () => {
  it('za den jedna Lehká a jedna Těžká (vždy ta dohraná první), jen daný jazyk a jen denní', () => {
    const history = [
      entry('cs-0002', 'daily', '2026-10-25', { tier: 'hard', finishedAt: '2026-10-25T10:00:00Z' }),
      entry('cs-0001', 'daily', '2026-10-25', { tier: 'easy', finishedAt: '2026-10-25T08:00:00Z' }),
      entry('cs-0003', 'daily', '2026-10-25', { tier: 'easy', finishedAt: '2026-10-25T09:00:00Z' }),
      entry('en-0001', 'daily', '2026-10-25'),
      entry('cs-0004', 'archive', '2026-10-25')
    ];
    expect(dailyToSend(history, 'cs', ['2026-10-24', '2026-10-25'], []).map((x) => [x.key, x.entry.puzzleId]))
      .toEqual([['cs:2026-10-25:easy', 'cs-0001'], ['cs:2026-10-25:hard', 'cs-0002']]);
  });

  it('záznam bez verze patří k výchozí; už odeslaný se znovu neposílá', () => {
    const history = [entry('cs-0001', 'daily', '2026-10-25'), entry('cs-0002', 'daily', '2026-10-25', { tier: 'hard' })];
    expect(dailyToSend(history, 'cs', ['2026-10-25'], ['cs:2026-10-25:easy'], 'easy').map((x) => x.key)).toEqual(['cs:2026-10-25:hard']);
  });
});

describe('Cesta do žebříčku', () => {
  it('za úroveň nejlepší vyhraný výsledek, jen když je lepší než odeslaný', () => {
    const history = [
      entry('cs-0006', 'path', '2026-10-20', { score: 120 }),
      entry('cs-0006', 'path', '2026-10-25', { score: 150 }),
      entry('cs-0007', 'path', '2026-10-25', { score: 300, won: false }),
      entry('cs-0008', 'path', '2026-10-24', { score: 90 }),
      entry('cs-0009', 'free', '2026-10-25', { score: 0 })
    ];
    expect(pathToSend(history, 'cs', {})).toEqual([
      { puzzleId: 'cs-0006', score: 150, date: '2026-10-25' },
      { puzzleId: 'cs-0008', score: 90, date: '2026-10-24' }
    ]);
    expect(pathToSend(history, 'cs', { 'cs-0006': 150, 'cs-0008': 80 })).toEqual([{ puzzleId: 'cs-0008', score: 90, date: '2026-10-24' }]);
  });
});

describe('odznak Cesty', () => {
  it('nejvyšší dohraná úroveň a součet hvězd', () => {
    const state = { chapters: [
      { levels: [{ number: 1, state: 'done', stars: 3 }, { number: 2, state: 'skipped', stars: 0 }, { number: 3, state: 'done', stars: 2 }] },
      { levels: [{ number: 4, state: 'current', stars: 0 }] }
    ] };
    expect(pathBadge(state)).toEqual({ level: 3, stars: 5 });
    expect(pathBadge(null)).toEqual({ level: 0, stars: 0 });
  });
});
