// Záložka Cesta – herní plán přibude v další části fáze 3.
import { h } from './dom.js';
import { t } from '../services/i18n.js';
import { tabs } from './tabs.js';

export function renderPath(root, { navigate }) {
  root.append(h('div', { class: 'page' },
    h('section', { class: 'panel' }, h('small', {}, t('tabs.path')), h('p', { class: 'panel-text' }, t('path.soon')))
  ), tabs('#/cesta', navigate));
}
