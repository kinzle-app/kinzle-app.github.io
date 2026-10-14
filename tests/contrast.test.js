// Kontrast textu (min. 4,5 : 1) na všech plochách obou stolů.
// Barvy se čtou přímo z tokens.css, takže test hlídá i budoucí úpravy.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/ui/styles/tokens.css', 'utf8');

function tokens(selector) {
  const start = css.indexOf(selector + ' {');
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}

const evening = tokens(':root');
const day = { ...evening, ...tokens(":root[data-table='day']") };

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// [text, plocha]
const pairs = [
  ['text', 'felt'], ['muted', 'felt'], ['text', 'felt-light'],
  ['ink', 'tile'], ['selected-ink', 'selected'], ['primary-ink', 'primary'],
  ['panel-text', 'panel'], ['panel-muted', 'panel'], ['panel-text', 'panel-active'],
  ['g1-ink', 'g1'], ['g2-ink', 'g2'], ['g3-ink', 'g3'], ['g4-ink', 'g4'], ['g5-ink', 'g5']
];

for (const [name, table] of [['Večerní', evening], ['Denní', day]]) {
  describe(`kontrast – ${name} stůl`, () => {
    for (const [fg, bg] of pairs) {
      it(`${fg} na ${bg}`, () => {
        expect(contrast(table[fg], table[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
  });
}
