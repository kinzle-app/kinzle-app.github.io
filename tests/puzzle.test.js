import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validatePuzzle } from '../src/game/puzzle.js';

const good = () => ({
  id: 'x', language: 'cs', size: 3, status: 'test', author: 'a', createdAt: '2026-10-14',
  groups: [
    { title: 'A', difficulty: 1, words: ['a1', 'a2', 'a3', 'a4'], explanation: '-' },
    { title: 'B', difficulty: 2, words: ['b1', 'b2', 'b3', 'b4'], explanation: '-' },
    { title: 'C', difficulty: 3, words: ['c1', 'c2', 'c3', 'c4'], explanation: '-' }
  ]
});

describe('kontrola hádanky', () => {
  it('správná hádanka projde', () => {
    expect(validatePuzzle(good())).toEqual([]);
  });

  it('odhalí duplicitní slovo bez ohledu na velikost písmen', () => {
    const p = good();
    p.groups[1].words[0] = 'A1';
    expect(validatePuzzle(p).join()).toMatch(/dvakrát/);
  });

  it('odhalí špatný počet slov a skupin', () => {
    const p = good();
    p.groups[0].words.pop();
    p.size = 4;
    const errors = validatePuzzle(p).join();
    expect(errors).toMatch(/4 slova/);
    expect(errors).toMatch(/neodpovídá/);
  });

  it('odhalí chybějící vysvětlení a příliš dlouhé slovo', () => {
    const p = good();
    p.groups[0].explanation = '';
    p.groups[0].words[0] = 'nejneobhospodařovávatelnější';
    const errors = validatePuzzle(p).join();
    expect(errors).toMatch(/vysvětlení/);
    expect(errors).toMatch(/delší/);
  });
});

// Všechny hádanky v content/ musí projít kontrolou a mít unikátní id
describe('obsah v content/', () => {
  const root = 'content';
  const files = readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => {
      const dir = join(root, d.name, 'puzzles');
      return readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));
    });

  it('obsahuje hádanky', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  const ids = new Set();
  for (const file of files) {
    it(file, () => {
      const p = JSON.parse(readFileSync(file, 'utf8'));
      expect(validatePuzzle(p)).toEqual([]);
      expect(file).toContain(join(p.language, 'puzzles'));
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
    });
  }
});
