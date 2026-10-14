import { describe, it, expect } from 'vitest';
import { splitWord } from '../src/ui/dom.js';

describe('dělení dlouhých slov', () => {
  it('dělí podle jednoduchých slabičných pravidel blízko středu', () => {
    expect(splitWord('calculator')).toBe('calcu-\nlator');
    expect(splitWord('ořezávátko')).toBe('ořezá-\nvátko');
    expect(splitWord('elektrikář')).toBe('elek-\ntrikář');
    expect(splitWord('helikoptéra')).toBe('heli-\nkoptéra');
    expect(splitWord('firefighter')).toBe('fire-\nfighter');
    expect(splitWord('electrician')).toBe('electri-\ncian');
  });

  it('bez vhodného místa dělí v půlce', () => {
    expect(splitWord('bcdfgh')).toBe('bcd-\nfgh');
  });
});
