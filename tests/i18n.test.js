import { describe, it, expect } from 'vitest';
import { typography } from '../src/services/typography.js';
import { t, setLanguage, detectLanguage, LANGUAGES } from '../src/services/i18n.js';
import cs from '../src/locales/cs.json';
import en from '../src/locales/en.json';

const NBSP = ' ';

describe('typografie', () => {
  it('dá pevnou mezeru po jednopísmenné předložce a spojce', () => {
    expect(typography('jsem v lese a v poli', 'cs')).toBe(`jsem v${NBSP}lese a${NBSP}v${NBSP}poli`);
  });

  it('dá pevnou mezeru za číslo', () => {
    expect(typography('zbývají 3 pokusy', 'cs')).toBe(`zbývají 3${NBSP}pokusy`);
  });

  it('angličtinu nemění', () => {
    expect(typography('a cat', 'en')).toBe('a cat');
  });
});

describe('překlady', () => {
  it('zná oba jazyky', () => {
    expect(LANGUAGES).toEqual(['cs', 'en']);
  });

  it('vybere jazyk podle prohlížeče', () => {
    expect(detectLanguage(['cs-CZ', 'en'])).toBe('cs');
    expect(detectLanguage(['de-DE', 'en-GB'])).toBe('en');
    expect(detectLanguage(['de-DE'])).toBe('en');
  });

  it('skloňuje podle čísla', () => {
    setLanguage('cs');
    expect(t('game.attemptsLeft', { count: 1 })).toBe(`Zbývá 1${NBSP}pokus`);
    expect(t('game.attemptsLeft', { count: 3 })).toBe(`Zbývají 3${NBSP}pokusy`);
    expect(t('game.attemptsLeft', { count: 0 })).toBe(`Zbývá 0${NBSP}pokusů`);
    setLanguage('en');
    expect(t('game.attemptsLeft', { count: 1 })).toBe('1 attempt left');
  });

  // Oba soubory musí mít stejné klíče, aby nikde nechyběl text
  it('cs a en mají stejné klíče', () => {
    const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
      typeof v === 'object' && !('other' in v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]);
    expect(keys(cs).sort()).toEqual(keys(en).sort());
  });
});
