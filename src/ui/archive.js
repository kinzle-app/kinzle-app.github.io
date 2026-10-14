// Archiv: starší denní hádanky k dohrání (bez žebříčku).
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { dailySchedule, approvedById } from '../services/content.js';
import { getProgress } from '../services/progress.js';
import { today } from '../services/clock.js';
import { dailyFor } from '../game/daily.js';
import { formatDate } from './daily.js';

export function renderArchive(root, { navigate }) {
  const schedule = dailySchedule(getLanguage());
  const byId = approvedById();
  const history = getProgress().history;
  const dates = Object.keys(schedule).filter((d) => d < today() && byId.has(schedule[d])).sort().reverse();

  const items = dates.map((date) => {
    const { number } = dailyFor(date, schedule, byId);
    const played = history.filter((e) => e.date === date && (e.mode === 'daily' || e.mode === 'archive'));
    const best = played.length ? Math.max(...played.map((e) => e.score)) : null;
    return h('li', {}, h('button', { class: 'menu-item', onclick: () => navigate(`#/denni/${date}`) },
      h('span', {}, `${t('daily.label', { n: number })} · ${formatDate(date)}`),
      h('span', { class: 'muted' }, best === null ? t('archive.unplayed') : `✓ ${t('game.points', { points: best })}`)));
  });

  root.append(h('div', { class: 'page' },
    h('h2', {}, t('archive.title')),
    h('p', { class: 'muted' }, t('archive.note')),
    items.length ? h('ul', { class: 'menu' }, items) : h('p', {}, t('archive.empty'))));
}
