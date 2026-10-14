import { describe, it, expect } from 'vitest';
import {
  createGame, toggleWord, clearSelection, submit, shuffle, shuffleBoard,
  mistakesLeft, RESULT, MAX_MISTAKES
} from '../src/game/engine.js';

const puzzle = {
  id: 'test', language: 'cs', size: 3, status: 'test', author: 'test', createdAt: '2026-10-14',
  groups: [
    { title: 'A', difficulty: 2, words: ['a1', 'a2', 'a3', 'a4'], explanation: '-' },
    { title: 'B', difficulty: 1, words: ['b1', 'b2', 'b3', 'b4'], explanation: '-' },
    { title: 'C', difficulty: 3, words: ['c1', 'c2', 'c3', 'c4'], explanation: '-' }
  ]
};

function pick(game, words) {
  clearSelection(game);
  words.forEach((w) => toggleWord(game, w));
  return submit(game);
}

describe('výběr', () => {
  it('vybere nejvýš 4 slova', () => {
    const g = createGame(puzzle);
    ['a1', 'a2', 'a3', 'a4', 'b1'].forEach((w) => toggleWord(g, w));
    expect(g.selected).toEqual(['a1', 'a2', 'a3', 'a4']);
  });

  it('druhé klepnutí výběr zruší', () => {
    const g = createGame(puzzle);
    toggleWord(g, 'a1');
    toggleWord(g, 'a1');
    expect(g.selected).toEqual([]);
  });

  it('slovo mimo stůl nejde vybrat', () => {
    const g = createGame(puzzle);
    toggleWord(g, 'xyz');
    expect(g.selected).toEqual([]);
  });

  it('méně než 4 slova nejde odeslat', () => {
    const g = createGame(puzzle);
    toggleWord(g, 'a1');
    expect(submit(g).result).toBe(RESULT.INCOMPLETE);
    expect(g.mistakes).toBe(0);
  });
});

describe('vyhodnocení', () => {
  it('správná skupina zmizí ze stolu', () => {
    const g = createGame(puzzle);
    const r = pick(g, ['a4', 'a2', 'a1', 'a3']);
    expect(r).toEqual({ result: RESULT.CORRECT, groupIndex: 0 });
    expect(g.board).toHaveLength(8);
    expect(g.selected).toEqual([]);
    expect(g.solved).toEqual([0]);
  });

  it('3 ze 4 je „těsně vedle“ a ubere pokus', () => {
    const g = createGame(puzzle);
    expect(pick(g, ['a1', 'a2', 'a3', 'b1']).result).toBe(RESULT.ONE_AWAY);
    expect(mistakesLeft(g)).toBe(MAX_MISTAKES - 1);
  });

  it('obyčejná chyba ubere pokus', () => {
    const g = createGame(puzzle);
    expect(pick(g, ['a1', 'a2', 'b1', 'b2']).result).toBe(RESULT.WRONG);
    expect(g.mistakes).toBe(1);
  });

  it('stejná kombinace podruhé (i v jiném pořadí) se nepočítá', () => {
    const g = createGame(puzzle);
    pick(g, ['a1', 'a2', 'b1', 'b2']);
    expect(pick(g, ['b2', 'b1', 'a2', 'a1']).result).toBe(RESULT.REPEAT);
    expect(g.mistakes).toBe(1);
  });

  it('vyřešení všech skupin je výhra', () => {
    const g = createGame(puzzle);
    pick(g, ['a1', 'a2', 'a3', 'a4']);
    pick(g, ['b1', 'b2', 'b3', 'b4']);
    pick(g, ['c1', 'c2', 'c3', 'c4']);
    expect(g.status).toBe('won');
    expect(g.board).toEqual([]);
  });

  it('po 4 chybách je prohra a zbylé skupiny se odkryjí od nejlehčí', () => {
    const g = createGame(puzzle);
    pick(g, ['c1', 'c2', 'c3', 'c4']);
    pick(g, ['a1', 'a2', 'b1', 'b2']);
    pick(g, ['a1', 'a3', 'b1', 'b3']);
    pick(g, ['a1', 'a4', 'b1', 'b4']);
    pick(g, ['a2', 'a3', 'b2', 'b3']);
    expect(g.status).toBe('lost');
    expect(g.revealed).toEqual([1, 0]); // B (obtížnost 1), pak A (2)
  });

  it('po konci hry už nic nejde', () => {
    const g = createGame(puzzle);
    ['a2', 'a3', 'a4', 'b2'].forEach((w) => pick(g, ['a1', 'b1', 'c1', w]));
    expect(g.status).toBe('lost');
    toggleWord(g, 'a1');
    expect(g.selected).toEqual([]);
    expect(submit(g).result).toBe(null);
  });
});

describe('míchání', () => {
  it('zachová všechna slova', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffle(items).sort()).toEqual(items);
  });

  it('nemění původní pole', () => {
    const items = ['a', 'b', 'c'];
    shuffle(items);
    expect(items).toEqual(['a', 'b', 'c']);
  });

  it('zamíchání stolu nezruší výběr', () => {
    const g = createGame(puzzle);
    toggleWord(g, 'a1');
    shuffleBoard(g);
    expect(g.selected).toEqual(['a1']);
    expect(g.board).toHaveLength(12);
  });
});
