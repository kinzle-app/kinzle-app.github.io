// Záložka Více: další režimy a obrazovky. Ve vývojové verzi i návrhy hádanek ke schválení.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { listPuzzles } from '../services/content.js';
import { tabs } from './tabs.js';
import { isDebug } from '../services/debug.js';
import { leaderboardEnabled } from '../services/leaderboard.js';

export function renderMore(root, { navigate }) {
  const item = (hash, title, note) => h('li', {}, h('button', { class: 'menu-item', onclick: () => navigate(hash) },
    h('span', {}, title), note && h('span', { class: 'muted' }, note)));

  const drafts = listPuzzles(getLanguage()).filter((p) => p.status !== 'approved');
  root.append(h('div', { class: 'page' },
    h('h2', {}, t('more.title')),
    h('ul', { class: 'menu' },
      leaderboardEnabled() && item('#/zebricek', t('board.title')),
      item('#/hry', t('history.title')),
      item('#/volna', t('free.title')),
      item('#/balicky', t('packs.title')),
      item('#/archiv', t('archive.title'), t('archive.note')),
      item('#/vacek', t('bag.title')),
      item('#/statistiky', t('stats.title')),
      isDebug() && item('#/debug', 'Testovací režim')),
    drafts.length > 0 && h('h2', {}, t('more.drafts')),
    drafts.length > 0 && h('ul', { class: 'menu' }, drafts.map((p) => item(`#/hra/${p.id}`, p.id, t(`size.${p.size}`))))
  ), tabs('#/vice', navigate));
}
