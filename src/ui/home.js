// Úvodní obrazovka fáze 1: seznam zkušebních hádanek v aktuálním jazyce.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { listPuzzles } from '../services/content.js';

export function renderHome(root, { navigate }) {
  const puzzles = listPuzzles(getLanguage());
  root.append(h('section', { class: 'home' },
    h('h2', {}, t('home.title')),
    h('p', { class: 'muted' }, t('home.note')),
    h('ul', { class: 'puzzle-list' }, puzzles.map((p, i) =>
      h('li', {}, h('button', { class: 'puzzle-item', onclick: () => navigate(`#/hra/${p.id}`) },
        h('span', {}, t('home.puzzle', { n: i + 1 })),
        h('span', { class: 'size' }, t(`size.${p.size}`))
      ))
    ))
  ));
}
