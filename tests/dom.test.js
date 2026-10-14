import { describe, it, expect } from 'vitest';
import { splitWord } from '../src/ui/dom.js';

describe('dělení dlouhých slov', () => {
  it('dělí za samohláskou blízko středu', () => {
    expect(splitWord('photographer')).toBe('photo-\ngrapher');
    expect(splitWord('calculator')).toBe('calcu-\nlator');
    expect(splitWord('ořezávátko')).toBe('ořezá-\nvátko');
  });

  it('bez vhodné samohlásky dělí v půlce', () => {
    expect(splitWord('bcdfgh')).toBe('bcd-\nfgh');
  });
});
