import { describe, it, expect } from 'vitest';
import { checkContent, checkLocale } from '../scripts/validate.js';
import { pragueDate, weekday, addDays, isValidDate } from '../src/game/calendar.js';

// schválená hádanka pro testy; level a size se dají přepsat
function puzzle(id, { size = 4, level = 1, status = 'approved', lang = 'cs' } = {}) {
  const groups = Array.from({ length: size }, (_, g) => ({
    title: `S${g}`, difficulty: g + 1, words: [0, 1, 2, 3].map((w) => `${id}-${g}-${w}`), explanation: '-'
  }));
  return {
    file: `content/${lang}/${status === 'draft' ? 'drafts' : 'puzzles'}/${id}.json`,
    lang, folder: status === 'draft' ? 'drafts' : 'puzzles',
    data: { id, language: lang, size, level, status, author: 'a', createdAt: '2026-10-14', groups }
  };
}

const MONDAY = '2026-10-19';
const base = (over = {}) => ({ puzzles: [], daily: { cs: {} }, packs: { cs: [] }, locales: {}, today: MONDAY, ...over });

describe('kalendář', () => {
  it('den v Praze, i když v UTC už je zítra/včera', () => {
    expect(pragueDate(new Date('2026-10-14T22:30:00Z'))).toBe('2026-10-15'); // 0:30 v Praze
    expect(pragueDate(new Date('2026-01-14T22:30:00Z'))).toBe('2026-01-14'); // v zimě 23:30
  });

  it('dny v týdnu, přičítání dnů a platnost data', () => {
    expect(weekday(MONDAY)).toBe(1);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30'); // přechod na letní čas
    expect(isValidDate('2026-02-30')).toBe(false);
  });
});

describe('npm run validate', () => {
  it('správný rozpis projde', () => {
    const r = checkContent(base({ puzzles: [puzzle('cs-0001')], daily: { cs: { [MONDAY]: 'cs-0001' } } }));
    expect(r.errors).toEqual([]);
    expect(r.summary.cs).toEqual({ approved: 1, drafts: 0, daysAhead: 1 });
  });

  it('odmítne neschválenou nebo neexistující hádanku v rozpisu', () => {
    const r = checkContent(base({
      puzzles: [puzzle('cs-0001', { status: 'draft' })],
      daily: { cs: { [MONDAY]: 'cs-0001', '2026-10-20': 'cs-0099' } }
    }));
    expect(r.errors.join()).toMatch(/není schválená/);
    expect(r.errors.join()).toMatch(/neexistuje/);
  });

  it('odmítne opakování denní hádanky', () => {
    const r = checkContent(base({
      puzzles: [puzzle('cs-0001', { level: 2 })],
      daily: { cs: { [MONDAY]: 'cs-0001', '2026-10-20': 'cs-0001' } }
    }));
    expect(r.errors.join()).toMatch(/už je 2026-10-19/);
  });

  it('hlídá rytmus týdne: pátek nejtěžší, víkend 5×4', () => {
    const r = checkContent(base({
      puzzles: [puzzle('cs-0001', { level: 2 }), puzzle('cs-0002', { level: 4 })],
      daily: { cs: { '2026-10-23': 'cs-0001', '2026-10-24': 'cs-0002' } }
    }));
    expect(r.errors.join()).toMatch(/úroveň 4–5/);
    expect(r.errors.join()).toMatch(/velikost 5×4/);
  });

  it('varuje, když zbývá méně než 14 dní', () => {
    const r = checkContent(base({ puzzles: [puzzle('cs-0001')], daily: { cs: { [MONDAY]: 'cs-0001' } } }));
    expect(r.warnings.join()).toMatch(/jen na 1 dní/);
  });

  it('hlídá složku podle stavu a duplicitní id', () => {
    const wrong = puzzle('cs-0001');
    wrong.folder = 'drafts';
    const r = checkContent(base({ puzzles: [wrong, puzzle('cs-0001')] }));
    expect(r.errors.join()).toMatch(/nepatří do složky drafts/);
    expect(r.errors.join()).toMatch(/už má jiná hádanka/);
  });

  it('balíček smí obsahovat jen schválené hádanky a má cenu a zámek', () => {
    const r = checkContent(base({
      puzzles: [puzzle('cs-0001', { status: 'draft' })],
      packs: { cs: [{ id: 'kuchyne', title: 'K', description: 'D', puzzles: ['cs-0001'] }] }
    }));
    expect(r.errors.join()).toMatch(/price/);
    expect(r.errors.join()).toMatch(/locked/);
    expect(r.errors.join()).toMatch(/není schválená/);
  });

  it('návrh balíčku smí obsahovat návrhy hádanek', () => {
    const r = checkContent(base({
      puzzles: [puzzle('cs-0001', { status: 'draft' })],
      packs: { cs: [{ id: 'kuchyne', title: 'K', description: 'D', price: 0, locked: false, draft: true, puzzles: ['cs-0001'] }] }
    }));
    expect(r.errors).toEqual([]);
  });

  it('„Co je nového“ má id, nadpis, 1–3 body a české uvozovky', () => {
    const r = checkContent(base({ news: { cs: [
      { id: 'a', title: 'T', items: ['1', '2', '3', '4'] },
      { id: 'a', title: '', items: ['řekl "ahoj"'] }
    ] } }));
    expect(r.errors.join()).toMatch(/1–3 texty/);
    expect(r.errors.join()).toMatch(/id už existuje/);
    expect(r.errors.join()).toMatch(/chybí id nebo title/);
    expect(r.errors.join()).toMatch(/rovné uvozovky/);
  });
});

describe('kontrola textů', () => {
  it('najde rovné uvozovky a chybějící tvary množného čísla', () => {
    const errors = checkLocale('cs', { a: 'řekl "ahoj"', b: { one: '1 hra', other: '{count} her' } });
    expect(errors.join()).toMatch(/rovné uvozovky/);
    expect(errors.join()).toMatch(/few/);
  });

  it('skutečné texty jsou v pořádku', async () => {
    const cs = (await import('../src/locales/cs.json')).default;
    const en = (await import('../src/locales/en.json')).default;
    expect([...checkLocale('cs', cs), ...checkLocale('en', en)]).toEqual([]);
  });
});

describe('kontrola Cesty', () => {
  const path = (ids) => ({ acts: [{ id: '1', chapters: [{ id: '1-1', levels: ids.map((puzzle) => ({ puzzle })) }] }] });
  const stories = { cs: { chapters: { '1-1': { title: 'K' } } } };

  it('správná Cesta projde', () => {
    const r = checkContent(base({ puzzles: [puzzle('cs-0001')], paths: { cs: path(['cs-0001']) }, stories }));
    expect(r.errors).toEqual([]);
  });

  it('odmítne denní hádanku, opakování a chybějící název kapitoly', () => {
    const r = checkContent(base({
      puzzles: [puzzle('cs-0001')],
      daily: { cs: { [MONDAY]: 'cs-0001' } },
      paths: { cs: path(['cs-0001', 'cs-0001']) },
      stories: {}
    }));
    const all = r.errors.join();
    expect(all).toMatch(/rozpisu denních/);
    expect(all).toMatch(/dvakrát/);
    expect(all).toMatch(/chybí název/);
  });
});
