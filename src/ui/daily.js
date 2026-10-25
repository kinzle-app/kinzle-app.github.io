// Záložka Denní (úvodní obrazovka): dnešní hádanka, výsledek s odpočtem do další, váček se semínky.
import { h, icon } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { dailySchedule, approvedById, activeTier, setActiveTier, currentAct, listPacks } from '../services/content.js';
import { actState } from '../game/path.js';
import { freeList } from './free.js';
import { tiersOf, defaultTier, tierPick } from '../config/tiers.js';
import { rhythmFor } from '../config/rhythm.js';
import { getProgress } from '../services/progress.js';
import { today, msToNextDay } from '../services/clock.js';
import { dailyFor } from '../game/daily.js';
import { dailyEntry, seeds } from '../game/progress.js';
import { addDays } from '../game/calendar.js';
import { formatTime } from '../game/timer.js';
import { hasSession } from './game.js';
import { tabs } from './tabs.js';
import { leaderboardEnabled } from '../services/leaderboard.js';

export function formatDate(date, options = { day: 'numeric', month: 'numeric' }) {
  return new Intl.DateTimeFormat(getLanguage(), { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

// „Kinzle #3“, u jazyka s úrovněmi „Kinzle #3 · Hard“. Výchozí úroveň volená přepínačem na kartě
// (čeština: Lehká) se nevypisuje, ať to hráče, který nic nepřepnul, neplete.
export function dailyLabel(number, tier, lang = getLanguage()) {
  const quiet = !tier || (tierPick(lang) === 'card' && tier === defaultTier(lang));
  return quiet ? t('daily.label', { n: number }) : `${t('daily.label', { n: number })} · ${t(`tier.${tier}`)}`;
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
  const lang = getLanguage();
  const tier = activeTier(lang);
  const schedule = dailySchedule(lang, tier);
  const byId = approvedById();
  const info = dailyFor(date, schedule, byId, rhythmFor(lang, tier));
  const progress = getProgress();
  const result = dailyEntry(progress, date, tier, defaultTier(lang));
  let countdown = null;

  const card = h('section', { class: 'panel daily-card' });
  // volba Lehká | Těžká na kartě (jen jazyk, kde se úroveň volí tady); zvýrazněná je ta, která se právě hraje
  if (tierPick(lang) === 'card') {
    card.append(h('div', { class: 'tier-choice', role: 'group', 'aria-label': t('daily.tierChoice') },
      tiersOf(lang).map((x) => h('button', {
        type: 'button', 'aria-pressed': String(x === tier),
        onclick: () => {
          if (x === tier) return;
          setActiveTier(lang, x);
          navigate('#/');
        }
      }, dailyEntry(progress, date, x, defaultTier(lang)) ? `${t(`tier.${x}`)} ✓` : t(`tier.${x}`)))));
  }
  if (info.upcoming !== undefined) {
    card.append(
      h('small', {}, t('daily.title')),
      h('p', { class: 'panel-text' }, info.upcoming ? t('daily.upcoming', { date: formatDate(info.upcoming) }) : t('daily.none')));
  } else {
    card.append(
      h('small', {}, `${t('daily.title')} · ${formatDate(date)}`),
      h('div', { class: 'daily-head' },
        h('span', { class: 'daily-number' }, dailyLabel(info.number, tier)),
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
        leaderboardEnabled() && h('button', { class: 'link', onclick: () => navigate('#/spolu') }, t('board.open')),
        teaser ? h('p', { class: 'teaser' }, t('daily.teaser', { text: teaser })) : '');
    } else {
      card.append(h('button', { class: 'primary', onclick: () => navigate(`#/denni/${date}`) },
        t(hasSession(`daily:${date}${tier ? ':' + tier : ''}`) ? 'daily.continue' : 'daily.play')));
    }
  }

  // Jazyk s úrovní v nastavení: dnešní hádanky ostatních úrovní (✓ = už odehraná); u volby na kartě je to v ní
  const others = tierPick(lang) !== 'settings' ? [] : tiersOf(lang).filter((x) => x !== tier && dailySchedule(lang, x)[date] && byId.has(dailySchedule(lang, x)[date]));
  if (others.length) {
    card.append(h('p', { class: 'panel-muted other-tiers' }, t('daily.alsoToday'), ' ',
      ...others.map((x) => h('button', { class: 'link', onclick: () => navigate(`#/denni/${date}/${x}`), disabled: Boolean(dailyEntry(progress, date, x, defaultTier(lang))) },
        dailyEntry(progress, date, x, defaultTier(lang)) ? `${t(`tier.${x}`)} ✓` : t(`tier.${x}`)))));
  }

  const count = seeds(progress).length;
  const more = moreToPlay(lang, progress, navigate);
  const bag = h('button', { class: 'panel bag-card', onclick: () => navigate('#/vacek') },
    bagIcon(),
    h('span', { class: 'bag-text' },
      h('strong', {}, t('bag.title')),
      h('span', { class: 'panel-muted' }, t('bag.count', { count }))));

  root.append(h('div', { class: 'page' }, card, more, bag), tabs('#/', navigate));
  return () => clearInterval(countdown);
}

// „Zahraj si dál“: ztlumené řádky pod denní hádankou – kde hráč skončil na Cestě, balíčky a trénink.
// Prázdný řádek se neukáže, aby nic nerušilo.
function moreToPlay(lang, progress, navigate) {
  const row = (iconName, title, note, hash) => h('li', {}, h('button', { class: 'more-row', onclick: () => navigate(hash) },
    icon(iconName), h('span', { class: 'more-text' }, h('strong', {}, title), h('span', {}, note)), icon('chevron')));
  const rows = [];

  const act = currentAct(lang);
  if (act) {
    const state = actState(act, progress);
    const ci = state.chapters.findIndex((c) => c.levels.some((l) => l.state === 'current'));
    if (ci >= 0) {
      const level = state.chapters[ci].levels.find((l) => l.state === 'current');
      rows.push(row('path', t('tabs.path'), t('home.pathNext', { chapter: ci + 1, n: level.number }), '#/cesta'));
    }
  }

  const won = new Set(progress.history.filter((e) => e.mode === 'pack' && e.won).map((e) => e.puzzleId));
  const packs = listPacks(lang);
  const left = packs.reduce((n, p) => n + p.puzzles.filter((x) => !won.has(x.id)).length, 0);
  if (packs.length) rows.push(row('pack', t('packs.title'), left ? t('home.packsLeft', { count: left }) : t('home.packsDone'), '#/balicky'));

  const training = freeList(lang).length;
  if (training) rows.push(row('training', t('free.title'), t('home.training', { count: training }), '#/volna'));

  return rows.length ? h('section', { class: 'more-to-play', 'aria-label': t('home.more') },
    h('h3', {}, t('home.more')), h('ul', {}, rows)) : '';
}
