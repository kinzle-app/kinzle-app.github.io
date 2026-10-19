// Váček se semínky: sbírka vyřešených skupin. Každá skupina = semínko v barvě své obtížnosti,
// vzácné (za hru bez chyby a nápovědy) má zlatý lem. Semínka se jednou zasadí do stromu slov.
import { h } from './dom.js';
import { t } from '../services/i18n.js';
import { getProgress } from '../services/progress.js';
import { seeds } from '../game/progress.js';
import { SYMBOLS } from './game.js';
import { formatDate, bagIcon } from './daily.js';

// Semínko jako zrnko (SVG) v barvě skupiny se symbolem obtížnosti
export function seedIcon(difficulty, { rare = false, size = 44 } = {}) {
  const span = document.createElement('span');
  span.className = rare ? 'seed-icon rare' : 'seed-icon';
  span.dataset.d = difficulty;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 40 40">
    <path d="M20 3C31 10 34 27 20 37C6 27 9 10 20 3Z" fill="var(--gc)" stroke="var(--gc-shadow)" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M20 9C25 14 26 24 20 31" fill="none" stroke="var(--gc-shadow)" stroke-width="2" stroke-linecap="round" opacity=".45"/>
    <text x="20" y="24.5" text-anchor="middle" font-size="11" fill="var(--gc-ink)">${SYMBOLS[difficulty]}</text>
  </svg>${rare ? '<span class="seed-star">✦</span>' : ''}`;
  return span;
}

export function renderBag(root) {
  const list = seeds(getProgress()).reverse(); // nejnovější nahoře
  const rare = list.filter((s) => s.rare).length;
  const byDifficulty = [1, 2, 3, 4, 5].map((d) => [d, list.filter((s) => s.difficulty === d).length]).filter(([, n]) => n);

  root.append(h('div', { class: 'page' },
    h('div', { class: 'bag-head' }, bagIcon(), h('div', {},
      h('h2', {}, t('bag.title')),
      h('div', { class: 'bag-chips' },
        h('span', { class: 'chip' }, t('bag.count', { count: list.length })),
        rare ? h('span', { class: 'chip chip-rare' }, '✦ ', t('bag.rare', { count: rare })) : ''))),
    h('p', { class: 'bag-intro' }, t('bag.intro')),
    byDifficulty.length > 0 && h('ul', { class: 'seed-tally', 'aria-label': t('bag.byDifficulty') },
      byDifficulty.map(([d, n]) => h('li', {}, seedIcon(d, { size: 30 }), h('span', {}, String(n))))),
    list.length === 0 && h('p', {}, t('bag.empty')),
    h('ul', { class: 'seed-grid' }, list.map((s) => h('li', { class: s.rare ? 'seed-card rare' : 'seed-card', 'data-d': s.difficulty },
      seedIcon(s.difficulty, { rare: s.rare }),
      h('strong', {}, s.title),
      h('span', { class: 'seed-words' }, s.words.join(' · ')),
      s.date.length === 10 && h('span', { class: 'seed-date' }, formatDate(s.date, { day: 'numeric', month: 'numeric', year: 'numeric' })),
      s.rare && h('span', { class: 'visually-hidden' }, t('bag.rareOne')))))
  ));
}
