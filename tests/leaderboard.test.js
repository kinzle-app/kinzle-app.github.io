import { describe, it, expect } from 'vitest';
import { dailyToSend, seedsToSend, pathBadge } from '../src/game/leaderboard.js';

const g = (difficulty) => ({ title: `G${difficulty}`, words: ['a', 'b', 'c', 'd'], difficulty });
const entry = (puzzleId, mode, date, extra = {}) =>
  ({ puzzleId, mode, date, won: true, score: 100, seconds: 60, mistakes: 0, hints: 0, solved: [g(1), g(2)], ...extra });

describe('denní výsledek do žebříčku', () => {
  it('za den jen první dohraná denní hádanka daného jazyka', () => {
    const history = [
      entry('cs-0002', 'daily', '2026-10-25', { tier: 'hard', finishedAt: '2026-10-25T10:00:00Z' }),
      entry('cs-0001', 'daily', '2026-10-25', { tier: 'easy', finishedAt: '2026-10-25T08:00:00Z' }),
      entry('en-0001', 'daily', '2026-10-25'),
      entry('cs-0003', 'archive', '2026-10-25')
    ];
    expect(dailyToSend(history, 'cs', ['2026-10-24', '2026-10-25'], []).map((e) => e.puzzleId)).toEqual(['cs-0001']);
  });

  it('už odeslaný den se znovu neposílá', () => {
    const history = [entry('cs-0001', 'daily', '2026-10-25')];
    expect(dailyToSend(history, 'cs', ['2026-10-25'], ['cs:2026-10-25'])).toEqual([]);
  });
});

describe('semínka do žebříčku', () => {
  it('každá skupina jen jednou, bez tréninku a bez jiného jazyka, bez už odeslaných', () => {
    const history = [
      entry('cs-0001', 'daily', '2026-10-24'),
      entry('cs-0001', 'archive', '2026-10-25'),
      entry('cs-0009', 'free', '2026-10-25'),
      entry('en-0001', 'daily', '2026-10-25')
    ];
    expect(seedsToSend(history, 'cs', [])).toEqual(['cs-0001#1', 'cs-0001#2']);
    expect(seedsToSend(history, 'cs', ['cs-0001#1'])).toEqual(['cs-0001#2']);
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
