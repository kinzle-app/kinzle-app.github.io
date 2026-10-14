import { describe, it, expect } from 'vitest';
import { freePuzzles, bucketOf } from '../src/game/free.js';

const p = (id, level) => ({ id, level });
const byId = new Map([p('d1', 1), p('d2', 3), p('d3', 5), p('c1', 2), p('c2', 4)].map((x) => [x.id, x]));
const schedule = { '2026-10-19': 'd1', '2026-10-20': 'd2', '2026-10-21': 'd3' };
const pathState = { chapters: [{ levels: [
  { puzzle: 'c1', index: 0, state: 'done' },
  { puzzle: 'c2', index: 1, state: 'current' }
] }] };

describe('Volná hra', () => {
  it('jen starší denní (ne dnešní ani budoucí) a dohrané úrovně Cesty', () => {
    const list = freePuzzles({ pathState, schedule, byId, today: '2026-10-21' });
    expect(list.map((x) => x.puzzle.id)).toEqual(['d2', 'd1', 'c1']);
    expect(list[0]).toMatchObject({ source: 'daily', date: '2026-10-20' });
    expect(list[2]).toMatchObject({ source: 'path', level: 1 });
  });

  it('bez dohraných úrovní a před první denní je prázdná', () => {
    expect(freePuzzles({ pathState: null, schedule, byId, today: '2026-10-19' })).toEqual([]);
  });

  it('obtížnost podle plánované úrovně', () => {
    expect([1, 2, 3, 4, 5].map((level) => bucketOf({ level }))).toEqual(['easy', 'easy', 'medium', 'hard', 'hard']);
  });
});
