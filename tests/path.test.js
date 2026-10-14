import { describe, it, expect } from 'vitest';
import { actState, starsFor, activeChapterIndex, layout, trackPath, SKIP_AFTER_FAILURES } from '../src/game/path.js';

const act = {
  id: '1',
  chapters: [
    { id: 'c1', title: 'K1', levels: [{ puzzle: 'a' }, { puzzle: 'b' }, { puzzle: 'c', master: true }] },
    { id: 'c2', title: 'K2', levels: [{ puzzle: 'd' }, { puzzle: 'e' }] }
  ]
};

const play = (puzzleId, won, mistakes = 0, hints = 0) =>
  ({ puzzleId, mode: 'path', date: '2026-10-14', won, score: 0, seconds: 1, mistakes, hints, solved: [] });

const states = (s) => s.chapters.flatMap((c) => c.levels.map((l) => l.state));

describe('hvězdy', () => {
  it('3 = bez chyby a nápovědy, 2 = nejvýš 1, 1 = dohráno, 0 = nedohráno', () => {
    expect(starsFor(play('a', true))).toBe(3);
    expect(starsFor(play('a', true, 1))).toBe(2);
    expect(starsFor(play('a', true, 0, 1))).toBe(2);
    expect(starsFor(play('a', true, 1, 1))).toBe(1);
    expect(starsFor(play('a', false))).toBe(0);
  });

  it('počítá se nejlepší pokus', () => {
    const s = actState(act, { history: [play('a', true, 2), play('a', true)] });
    expect(s.chapters[0].levels[0].stars).toBe(3);
  });
});

describe('odemykání', () => {
  it('na začátku je odemčená jen první úroveň', () => {
    expect(states(actState(act, { history: [] }))).toEqual(['current', 'locked', 'locked', 'locked', 'locked']);
  });

  it('další úroveň se odemkne dohráním, bez ohledu na hvězdy', () => {
    const s = actState(act, { history: [play('a', true, 3, 2)] });
    expect(states(s)).toEqual(['done', 'current', 'locked', 'locked', 'locked']);
  });

  it('prohra nic neodemkne', () => {
    expect(states(actState(act, { history: [play('a', false)] }))[1]).toBe('locked');
  });

  it('dokončení kapitoly odemkne další kapitolu', () => {
    const s = actState(act, { history: ['a', 'b', 'c'].map((p) => play(p, true)) });
    expect(s.chapters[0].complete).toBe(true);
    expect(s.chapters[1].levels[0].state).toBe('current');
    expect(activeChapterIndex(s)).toBe(1);
  });
});

describe('přeskočení po 3 neúspěších', () => {
  it('přeskočit jde až po 3 neúspěšných pokusech', () => {
    const two = actState(act, { history: [play('a', false), play('a', false)] });
    expect(two.chapters[0].levels[0].canSkip).toBe(false);
    const three = actState(act, { history: Array.from({ length: SKIP_AFTER_FAILURES }, () => play('a', false)) });
    expect(three.chapters[0].levels[0].canSkip).toBe(true);
  });

  it('přeskočená úroveň odemkne další a dá se k ní vrátit', () => {
    const s = actState(act, { history: [], skipped: ['a'] });
    expect(states(s).slice(0, 3)).toEqual(['skipped', 'current', 'locked']);
  });

  it('pozdější dohrání přeskočené úrovně ji označí jako hotovou', () => {
    const s = actState(act, { history: [play('a', true)], skipped: ['a'] });
    expect(s.chapters[0].levels[0].state).toBe('done');
  });

  it('kapitola s přeskočenou úrovní není dokončená, ale nic nezamyká', () => {
    const s = actState(act, { history: ['b', 'c'].map((p) => play(p, true)), skipped: ['a'] });
    expect(s.chapters[0].complete).toBe(false);
    expect(s.chapters[0].skippedCount).toBe(1);
    expect(s.chapters[1].levels[0].state).toBe('current');
  });
});

describe('herní plán', () => {
  it('rozmístí 10 úrovní hadovitě, mistrovskou nahoru doprostřed', () => {
    const { points, height } = layout(10);
    expect(points).toHaveLength(10);
    expect(points[9]).toEqual({ x: 177, y: 62 });
    expect(points[0].y).toBeGreaterThan(points[3].y); // cesta vede zdola nahoru
    expect(points[0].x).toBe(points[5].x); // druhá řada jde opačným směrem
    expect(height).toBe(450);
  });

  it('cesta prochází všemi body', () => {
    const { points } = layout(4);
    const d = trackPath(points);
    expect(d.startsWith(`M${points[0].x} ${points[0].y}`)).toBe(true);
    expect(d.endsWith(`${points[3].x} ${points[3].y}`)).toBe(true);
  });
});
