// Záložka Více: další režimy a moje přehledy, po sekcích. Ve vývojové verzi i návrhy hádanek ke schválení.
import { h, menuSection, menuRow } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { listPuzzles } from '../services/content.js';
import { tabs } from './tabs.js';
import { isDebug } from '../services/debug.js';

export function renderMore(root, { navigate }) {
  const go = (hash) => () => navigate(hash);
  const item = (hash, title, note) => h('li', {}, h('button', { class: 'menu-item', onclick: go(hash) },
    h('span', {}, title), note && h('span', { class: 'muted' }, note)));

  const drafts = listPuzzles(getLanguage()).filter((p) => p.status !== 'approved');
  root.append(h('div', { class: 'page' },
    h('h2', {}, t('more.title')),
    menuSection(t('more.play'), [
      menuRow('training', t('free.title'), t('more.training'), go('#/volna')),
      menuRow('pack', t('packs.title'), t('more.packs'), go('#/balicky')),
      menuRow('calendar', t('archive.title'), t('archive.note'), go('#/archiv'))
    ]),
    menuSection(t('more.mine'), [
      menuRow('list', t('history.title'), t('more.history'), go('#/hry')),
      menuRow('seed', t('bag.title'), t('more.bag'), go('#/vacek')),
      menuRow('stats', t('stats.title'), t('more.stats'), go('#/statistiky'))
    ]),
    isDebug() && h('ul', { class: 'menu' }, item('#/debug', 'Testovací režim')),
    drafts.length > 0 && h('h2', {}, t('more.drafts')),
    drafts.length > 0 && h('ul', { class: 'menu' }, drafts.map((p) => item(`#/hra/${p.id}`, p.id, t(`size.${p.size}`))))
  ), tabs('#/vice', navigate));
}
