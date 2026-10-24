import { describe, it, expect } from 'vitest';
import { rhythmFor, RHYTHM } from '../src/config/rhythm.js';
import { dailyFor } from '../src/game/daily.js';

describe('rytmus podle úrovně', () => {
  it('čeština Lehká: každý den 4×4 s úrovní 1–2', () => {
    const r = rhythmFor('cs', 'easy');
    for (const day of [0, 1, 2, 3, 4, 5, 6]) expect(r[day]).toEqual({ size: 4, min: 1, max: 2 });
  });

  it('čeština Těžká: víkend 5×4, ve všední dny úroveň aspoň 3', () => {
    const r = rhythmFor('cs', 'hard');
    expect(r[6].size).toBe(5);
    for (const day of [1, 2, 3, 4, 5]) expect(r[day].min).toBeGreaterThanOrEqual(3);
  });

  it('ostatní úrovně používají běžný rytmus týdne', () => {
    expect(rhythmFor('en', 'medium')).toBe(RHYTHM);
  });

  it('repríza vybírá hádanku s úrovní podle rytmu', () => {
    const p = (id, level) => ({ id, level, size: 4 });
    const byId = new Map([p('a', 1), p('b', 5)].map((x) => [x.id, x]));
    const schedule = { '2026-10-12': 'a', '2026-10-13': 'b' };
    // pondělí 19. 10. po konci rozpisu: Lehká chce úroveň 1–2 → jen „a“
    expect(dailyFor('2026-10-19', schedule, byId, rhythmFor('cs', 'easy'))).toMatchObject({ rerun: true, puzzle: { id: 'a' } });
  });
});
