import { describe, it, expect } from 'vitest';
import { customErrors, encodeCustom, decodeCustom, customId } from '../src/game/custom.js';

const draft = (groups = 3) => ({
  lang: 'cs',
  author: 'Táta',
  groups: [
    { title: 'Ovoce', words: ['jablko', 'hruška', 'švestka', 'třešeň'], explanation: '' },
    { title: 'Zvířata', words: ['pes', 'kočka', 'kůň', 'kráva'], explanation: 'Na statku.' },
    { title: 'Barvy', words: ['modrá', 'žlutá', 'zelená', 'červená'], explanation: '' },
    { title: 'Nástroje', words: ['housle', 'flétna', 'buben', 'harfa'], explanation: '' },
    { title: 'Řeky', words: ['Vltava', 'Labe', 'Morava', 'Odra'], explanation: '' }
  ].slice(0, groups)
});

describe('vlastní hádanka', () => {
  it('projde tam a zpět přes odkaz i s diakritikou, skupiny od nejlehčí', () => {
    const code = encodeCustom(draft(4));
    expect(code).toMatch(/^[\w-]+$/); // bezpečné v adrese
    const puzzle = decodeCustom(code);
    expect(puzzle.size).toBe(4);
    expect(puzzle.author).toBe('Táta');
    expect(puzzle.groups[1]).toEqual({ title: 'Zvířata', difficulty: 2, words: ['pes', 'kočka', 'kůň', 'kráva'], explanation: 'Na statku.' });
    expect(puzzle.id).toBe(customId(code));
  });

  it('jde 3, 4 i 5 skupin, jinak ne', () => {
    for (const n of [3, 4, 5]) expect(customErrors(draft(n))).toEqual([]);
    expect(customErrors(draft(2))).toEqual([{ error: 'size' }]);
  });

  it('najde chybějící název, prázdné, dlouhé a zdvojené slovo', () => {
    const d = draft(3);
    d.groups[0].title = ' ';
    d.groups[1].words[0] = '';
    d.groups[1].words[1] = 'nejdelšíslovovůbec';
    d.groups[2].words[3] = 'JABLKO';
    expect(customErrors(d)).toEqual([
      { error: 'title', group: 0 },
      { error: 'word', group: 1, word: 0 },
      { error: 'wordLong', group: 1, word: 1 },
      { error: 'duplicate', group: 2, word: 3 }
    ]);
  });

  it('poškozený nebo podvržený odkaz vrátí null', () => {
    expect(decodeCustom('nesmysl')).toBeNull();
    expect(decodeCustom(encodeCustom(draft(4)).slice(0, 30))).toBeNull();
    const fake = btoa(JSON.stringify({ v: 1, l: 'cs', g: [['a', 'b', 'b', 'c', 'd']] }));
    expect(decodeCustom(fake)).toBeNull();
  });
});
