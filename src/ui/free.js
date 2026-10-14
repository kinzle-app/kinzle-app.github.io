// Volná hra: dohrané úrovně Cesty a starší denní hádanky, s filtrem obtížnosti. Nejde do žebříčku.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { dailySchedule, approvedById, currentAct } from '../services/content.js';
import { getProgress } from '../services/progress.js';
import { today } from '../services/clock.js';
import { freePuzzles, bucketOf, BUCKETS } from '../game/free.js';
import { actState } from '../game/path.js';
import { dailyFor } from '../game/daily.js';
import { formatDate } from './daily.js';

export function freeList(lang = getLanguage()) {
  const act = currentAct(lang);
  const schedule = dailySchedule(lang);
  const byId = approvedById();
  return freePuzzles({ pathState: act && actState(act, getProgress()), schedule, byId, today: today() })
    .map((item) => ({
      ...item,
      label: item.source === 'daily'
        ? t('daily.label', { n: dailyFor(item.date, schedule, byId).number })
        : t('free.pathLevel', { n: item.level })
    }));
}

export function renderFree(root, { navigate }) {
  const all = freeList();
  let filter = null; // null = vše
  const list = h('ul', { class: 'menu' });

  const chips = h('div', { class: 'choices', role: 'group', 'aria-label': t('free.filter') },
    [null, ...BUCKETS].map((bucket) => h('button', {
      class: 'secondary', 'aria-pressed': String(bucket === filter),
      onclick: (e) => {
        filter = bucket;
        for (const b of chips.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
        fill();
      }
    }, t(bucket ? `free.${bucket}` : 'free.all'))));

  function fill() {
    const items = all.filter((x) => !filter || bucketOf(x.puzzle) === filter);
    list.replaceChildren(...items.map((x) => h('li', {}, h('button', { class: 'menu-item', onclick: () => navigate(`#/hra/${x.puzzle.id}`) },
      h('span', {}, x.date ? `${x.label} · ${formatDate(x.date)}` : x.label),
      h('span', { class: 'muted' }, `${x.puzzle.size}×4 · ${t(`free.${bucketOf(x.puzzle)}`)}`)))));
    if (!items.length) list.append(h('li', { class: 'muted' }, t(all.length ? 'free.emptyFilter' : 'free.empty')));
  }
  fill();

  root.append(h('div', { class: 'page' },
    h('h2', {}, t('free.title')),
    h('p', { class: 'muted' }, t('free.note')),
    all.length > 0 && chips,
    list));
}
