// Záložka Denní (úvodní obrazovka): dnešní hádanka, výsledek s odpočtem do další, váček se semínky.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { dailySchedule, approvedById } from '../services/content.js';
import { getProgress } from '../services/progress.js';
import { today, msToNextDay } from '../services/clock.js';
import { dailyFor } from '../game/daily.js';
import { dailyEntry, seeds } from '../game/progress.js';
import { addDays } from '../game/calendar.js';
import { formatTime } from '../game/timer.js';
import { hasSession } from './game.js';
import { tabs } from './tabs.js';

export function formatDate(date, options = { day: 'numeric', month: 'numeric' }) {
  return new Intl.DateTimeFormat(getLanguage(), { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

// 18 573 s → „05:09:33“
function clock(seconds) {
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

// Váček se šňůrkou (SVG, žádný obrázek)
export function bagIcon() {
  const span = document.createElement('span');
  span.innerHTML = '<svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40"><path d="M14 9c2 2 10 2 12 0l-2 6c5 3 9 9 9 14 0 5-5 7-13 7S7 34 7 29c0-5 4-11 9-14z" fill="var(--selected)" stroke="var(--selected-shadow)" stroke-width="2" stroke-linejoin="round"/><path d="M15 15c3 1.5 7 1.5 10 0" fill="none" stroke="var(--selected-shadow)" stroke-width="2" stroke-linecap="round"/></svg>';
  return span.firstChild;
}

export function renderDaily(root, { navigate }) {
  const date = today();
  const schedule = dailySchedule(getLanguage());
  const byId = approvedById();
  const info = dailyFor(date, schedule, byId);
  const progress = getProgress();
  const result = dailyEntry(progress, date);
  let countdown = null;

  const card = h('section', { class: 'panel daily-card' });
  if (info.upcoming !== undefined) {
    card.append(
      h('small', {}, t('daily.title')),
      h('p', { class: 'panel-text' }, info.upcoming ? t('daily.upcoming', { date: formatDate(info.upcoming) }) : t('daily.none')));
  } else {
    card.append(
      h('small', {}, `${t('daily.title')} · ${formatDate(date)}`),
      h('div', { class: 'daily-head' },
        h('span', { class: 'daily-number' }, t('daily.label', { n: info.number })),
        h('span', { class: 'panel-muted' }, t(`size.${info.puzzle.size}`))),
      info.rerun ? h('p', { class: 'panel-muted' }, t('daily.rerun')) : '');

    if (result) {
      const left = h('span', {});
      const tick = () => (left.textContent = clock(Math.floor(msToNextDay() / 1000)));
      tick();
      countdown = setInterval(() => {
        if (today() !== date) navigate('#/'); // po půlnoci nová hádanka
        else tick();
      }, 1000);
      const teaser = byId.get(schedule[addDays(date, 1)])?.teaser;
      card.append(
        h('div', { class: 'result-row' },
          h('span', {}, t(result.won ? 'daily.won' : 'daily.lost')),
          h('span', {}, t('game.points', { points: result.score })),
          h('span', {}, formatTime(result.seconds))),
        h('p', { class: 'panel-muted' }, t('daily.next'), ' ', left),
        teaser ? h('p', { class: 'teaser' }, t('daily.teaser', { text: teaser })) : '');
    } else {
      card.append(h('button', { class: 'primary', onclick: () => navigate(`#/denni/${date}`) },
        t(hasSession(`daily:${date}`) ? 'daily.continue' : 'daily.play')));
    }
  }

  const count = seeds(progress).length;
  const bag = h('button', { class: 'panel bag-card', onclick: () => navigate('#/vacek') },
    bagIcon(),
    h('span', { class: 'bag-text' },
      h('strong', {}, t('bag.title')),
      h('span', { class: 'panel-muted' }, t('bag.count', { count }))));

  root.append(h('div', { class: 'page' }, card, bag), tabs('#/', navigate));
  return () => clearInterval(countdown);
}
