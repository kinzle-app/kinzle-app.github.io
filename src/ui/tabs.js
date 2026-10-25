// Spodní lišta záložek: Denní / Cesta / Žebříček (adresa #/spolu) / Více
import { h } from './dom.js';
import { t } from '../services/i18n.js';

const TABS = [['#/', 'tabs.daily'], ['#/cesta', 'tabs.path'], ['#/spolu', 'tabs.together'], ['#/vice', 'tabs.more']];

export function tabs(active, navigate) {
  return h('nav', { class: 'tabs', 'aria-label': t('tabs.label') }, TABS.map(([hash, key]) =>
    h('button', { class: 'tab', 'aria-current': hash === active ? 'page' : null, onclick: () => navigate(hash) }, t(key))));
}
