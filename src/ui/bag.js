// Váček se semínky: sbírka vyřešených skupin (název, slova, datum).
import { h } from './dom.js';
import { t } from '../services/i18n.js';
import { getProgress } from '../services/progress.js';
import { seeds } from '../game/progress.js';
import { SYMBOLS } from './game.js';
import { formatDate, bagIcon } from './daily.js';

export function renderBag(root) {
  const list = seeds(getProgress()).reverse(); // nejnovější nahoře
  const rare = list.filter((s) => s.rare).length;

  root.append(h('div', { class: 'page' },
    h('div', { class: 'bag-head' }, bagIcon(), h('div', {},
      h('h2', {}, t('bag.title')),
      h('p', { class: 'muted' }, t('bag.count', { count: list.length }), rare ? ` · ${t('bag.rare', { count: rare })}` : ''))),
    list.length === 0 && h('p', {}, t('bag.empty')),
    h('ul', { class: 'seed-list' }, list.map((s) => h('li', { class: 'seed', 'data-d': s.difficulty },
      h('span', { class: 'seed-dot', 'aria-hidden': 'true' }, SYMBOLS[s.difficulty]),
      h('span', { class: 'seed-body' },
        h('strong', {}, s.title, s.rare ? h('span', { class: 'seed-rare', title: t('bag.rareOne') }, ' ✦') : null),
        h('span', {}, s.words.join(' · ')),
        h('span', { class: 'muted' }, s.date.length === 10 ? formatDate(s.date, { day: 'numeric', month: 'numeric', year: 'numeric' }) : ''))))))
  );
}
