import { describe, it, expect } from 'vitest';
import { createGame, toggleWord, clearSelection, submit, useHint, canHint } from '../src/game/engine.js';
import { scoreBreakdown, timeBonus } from '../src/game/score.js';
import { createTimer, formatTime } from '../src/game/timer.js';
import { SCORING } from '../src/config/scoring.js';

const puzzle = {
  id: 't', language: 'cs', size: 3, status: 'test', author: 'a', createdAt: '2026-10-14',
  groups: [
    { title: 'Lehká', difficulty: 1, words: ['a1', 'a2', 'a3', 'a4'], explanation: '-' },
    { title: 'Střední', difficulty: 2, words: ['b1', 'b2', 'b3', 'b4'], explanation: '-' },
    { title: 'Těžká', difficulty: 3, words: ['c1', 'c2', 'c3', 'c4'], explanation: '-' }
  ]
};

const pick = (game, words) => {
  clearSelection(game);
  words.forEach((w) => toggleWord(game, w));
  return submit(game);
};
const A = ['a1', 'a2', 'a3', 'a4'];
const B = ['b1', 'b2', 'b3', 'b4'];
const C = ['c1', 'c2', 'c3', 'c4'];

describe('body', () => {
  it('čistá rychlá výhra od nejlehčí: skupiny + čas + čistá hra', () => {
    const g = createGame(puzzle);
    [A, B, C].forEach((w) => pick(g, w));
    const s = scoreBreakdown(g, 0);
    expect(s).toMatchObject({ groupPoints: 60, bravery: 0, time: 50, clean: 25, total: 135 });
  });

  it('odvaha: +10 za každou skupinu vyřešenou dřív než nějaká lehčí', () => {
    const g = createGame(puzzle);
    [C, B, A].forEach((w) => pick(g, w));
    // C (lehčí A i B ještě zbývají) +10, B (A ještě zbývá) +10, A nic
    expect(scoreBreakdown(g, 0).bravery).toBe(20);
  });

  it('chyba strhne body a zruší čistou hru', () => {
    const g = createGame(puzzle);
    pick(g, ['a1', 'a2', 'b1', 'b2']);
    [A, B, C].forEach((w) => pick(g, w));
    const s = scoreBreakdown(g, 300);
    expect(s).toMatchObject({ mistakes: 10, clean: 0, time: 0, total: 50 });
  });

  it('nápovědy stojí body podle typu', () => {
    const g = createGame(puzzle);
    useHint(g, 'title', 2);
    useHint(g, 'pair', 2);
    expect(scoreBreakdown(g, 0).hints).toBe(35);
  });

  it('po prohře zůstanou body za skupiny, bez času a čisté hry, nikdy pod nulu', () => {
    const g = createGame(puzzle);
    pick(g, C);
    ['a2', 'a3', 'a4', 'b2'].forEach((w) => pick(g, ['a1', 'b1', 'b3', w]));
    expect(g.status).toBe('lost');
    const s = scoreBreakdown(g, 10);
    expect(s).toMatchObject({ groupPoints: 30, bravery: 10, time: 0, clean: 0, mistakes: 40, total: 0 });
  });

  it('časový bonus klesá lineárně k nule za 5 minut', () => {
    expect(timeBonus(0)).toBe(SCORING.timeBonusMax);
    expect(timeBonus(150)).toBe(25);
    expect(timeBonus(300)).toBe(0);
    expect(timeBonus(999)).toBe(0);
  });
});

describe('pokusy a trénink', () => {
  it('pokusy se ukládají po řadě i s výsledkem, opakování ne', () => {
    const g = createGame(puzzle);
    pick(g, ['a1', 'a2', 'a3', 'b1']);
    pick(g, ['a1', 'a2', 'a3', 'b1']);
    pick(g, A);
    expect(g.attempts).toEqual([{ words: ['a1', 'a2', 'a3', 'b1'], result: 'oneAway' }, { words: A, result: 'correct' }]);
  });

  it('v tréninku se neprohrává', () => {
    const g = createGame(puzzle, Math.random, { maxMistakes: Infinity });
    for (let i = 0; i < 6; i++) pick(g, ['a1', 'b1', 'c1', ['a2', 'a3', 'a4', 'b2', 'b3', 'b4'][i]]);
    expect(g.mistakes).toBe(6);
    expect(g.status).toBe('playing');
  });
});

describe('nápovědy', () => {
  it('název odhalí nejlehčí nevyřešenou skupinu, pak další', () => {
    const g = createGame(puzzle);
    pick(g, A);
    expect(useHint(g, 'title', 2)).toEqual({ type: 'title', group: 1 });
    expect(useHint(g, 'title', 2)).toEqual({ type: 'title', group: 2 });
  });

  it('dvojice je z nejlehčí nevyřešené skupiny a slova se neopakují', () => {
    const g = createGame(puzzle);
    const h1 = useHint(g, 'pair', 2, () => 0);
    const h2 = useHint(g, 'pair', 2, () => 0);
    expect(h1.group).toBe(0);
    expect(h1.words).toHaveLength(2);
    expect(h2.group).toBe(0);
    expect([...h1.words, ...h2.words].sort()).toEqual(A);
    expect(canHint(g, 'pair', 3)).toBe(true); // skupina A už nemá co ukázat, přijde B
    expect(useHint(g, 'pair', 3).group).toBe(1);
  });

  it('nejvýš 2 nápovědy na hru', () => {
    const g = createGame(puzzle);
    useHint(g, 'title', 2);
    useHint(g, 'pair', 2);
    expect(canHint(g, 'pair', 2)).toBe(false);
    expect(useHint(g, 'pair', 2)).toBe(null);
  });

  it('po konci hry nápověda nejde', () => {
    const g = createGame(puzzle);
    [A, B, C].forEach((w) => pick(g, w));
    expect(canHint(g, 'title', 2)).toBe(false);
  });
});

describe('časovač', () => {
  it('měří čas a při pozastavení stojí', () => {
    let t = 0;
    const timer = createTimer(() => t);
    timer.start();
    t = 5000;
    timer.pause();
    t = 60000; // aplikace byla na pozadí
    expect(timer.seconds()).toBe(5);
    timer.start();
    t = 62500;
    expect(timer.seconds()).toBe(7);
  });

  it('formátuje čas', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(161)).toBe('2:41');
    expect(formatTime(3600)).toBe('60:00');
  });
});
