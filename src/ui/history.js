// Moje hry: seznam odehraných her (po dnech, s filtrem režimu) a detail hry s pokusy po řadě.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { getProgress } from '../services/progress.js';
import { getPuzzle, puzzleLabel, dailySchedule, approvedById, currentAct, listPacks } from '../services/content.js';
import { dailyFor } from '../game/daily.js';
import { formatTime } from '../game/timer.js';
import { formatDate, dailyLabel } from './daily.js';
import { SYMBOLS } from './game.js';
import { freeList } from './free.js';
import { defaultTier } from '../config/tiers.js';
import { decodeCustom } from '../game/custom.js';
import { customLabel } from './custom.js';

// Filtry: režimy, které patří k sobě (denní a archiv jsou obojí denní hádanky)
const FILTERS = { all: null, daily: ['daily', 'archive'], path: ['path'], free: ['free'], pack: ['pack'], custom: ['custom'] };

// Název hry v seznamu podle režimu
function entryLabel(e) {
  const lang = getLanguage();
  if (e.mode === 'daily' || e.mode === 'archive') {
    const info = dailyFor(e.date, dailySchedule(lang, e.tier || defaultTier(lang)), approvedById());
    if (info.puzzle?.id === e.puzzleId) return dailyLabel(info.number, e.tier);
  }
  if (e.mode === 'path') {
    const level = currentAct(lang)?.chapters.flatMap((c) => c.levels).findIndex((l) => l.puzzle === e.puzzleId);
    if (level >= 0) return t('path.level', { n: level + 1 });
  }
  if (e.mode === 'pack') {
    const pack = listPacks(lang).find((p) => p.puzzles.some((x) => x.id === e.puzzleId));
    if (pack) return pack.title;
  }
  if (e.mode === 'custom' && e.code) return customLabel(e.code);
  const free = e.mode === 'free' && freeList(lang).find((x) => x.puzzle.id === e.puzzleId);
  if (free) return free.label;
  const puzzle = getPuzzle(e.puzzleId);
  return puzzle ? puzzleLabel(puzzle) : e.puzzleId;
}

// Krátké shrnutí výsledku: „✓ 120 b. · 1 chyba · 0:45“ (trénink bez bodů)
function summary(e) {
  return [
    e.won ? '✓' : '✗',
    e.mode === 'free' ? null : t('game.points', { points: e.score }),
    e.mistakes ? t('share.mistakes', { count: e.mistakes }) : t('share.noMistakes'),
    e.mode === 'free' ? null : formatTime(e.seconds)
  ].filter(Boolean).join(' · ');
}

export function renderHistory(root, { navigate }) {
  const history = getProgress().history.map((e, index) => ({ ...e, index })).reverse(); // nejnovější nahoře
  let filter = 'all';
  const list = h('div', { class: 'history' });

  const chips = h('div', { class: 'choices', role: 'group', 'aria-label': t('history.filter') },
    Object.keys(FILTERS).map((key) => h('button', {
      class: 'secondary', 'aria-pressed': String(key === filter),
      onclick: (ev) => {
        filter = key;
        for (const b of chips.children) b.setAttribute('aria-pressed', String(b === ev.currentTarget));
        fill();
      }
    }, t(`history.filters.${key}`))));

  function fill() {
    const modes = FILTERS[filter];
    const items = history.filter((e) => !modes || modes.includes(e.mode));
    // po dnech podle dokončení hry
    const days = new Map();
    for (const e of items) {
      const day = (e.finishedAt || e.date).slice(0, 10);
      if (!days.has(day)) days.set(day, []);
      days.get(day).push(e);
    }
    list.replaceChildren(...[...days].map(([day, entries]) => h('section', {},
      h('h3', {}, formatDate(day, { weekday: 'long', day: 'numeric', month: 'numeric' })),
      h('ul', { class: 'menu' }, entries.map((e) => h('li', {}, h('button', { class: 'menu-item', onclick: () => navigate(`#/hry/${e.index}`) },
        h('span', {}, `${t(`history.modes.${e.mode}`)} · ${entryLabel(e)}`),
        h('span', { class: 'muted' }, summary(e))))))
    )));
    if (!items.length) list.append(h('p', {}, t(history.length ? 'history.emptyFilter' : 'history.empty')));
  }
  fill();

  root.append(h('div', { class: 'page' },
    h('h2', {}, t('history.title')),
    history.length > 0 && chips,
    list));
}

export function renderHistoryDetail(root, { navigate, index }) {
  const e = getProgress().history[index];
  if (!e) {
    location.replace('#/hry');
    return;
  }
  const puzzle = getPuzzle(e.puzzleId) || (e.code && decodeCustom(e.code));
  // skupina každého slova (barva čtverečku v pokusu); u změněné hádanky podle uložených skupin
  const groups = puzzle ? puzzle.groups : e.solved;
  const groupOf = (word) => groups.find((g) => g.words.includes(word));

  const attempts = e.attempts?.length
    ? h('ol', { class: 'attempt-list' }, e.attempts.map((a) => h('li', { class: 'attempt' },
      h('span', { class: 'attempt-squares', 'aria-hidden': 'true' }, a.words.map((w) =>
        h('span', { class: 'attempt-square', 'data-d': groupOf(w)?.difficulty }))),
      h('span', { class: 'attempt-words' }, a.words.join(' · ')),
      h('span', { class: 'attempt-result' }, t(`history.result.${a.result}`)))))
    : h('p', { class: 'muted' }, t('history.noAttempts'));

  root.append(h('div', { class: 'page' },
    h('h2', {}, `${t(`history.modes.${e.mode}`)} · ${entryLabel(e)}`),
    h('p', { class: 'muted' }, `${formatDate(e.date.length === 10 ? e.date : e.finishedAt.slice(0, 10))} · ${summary(e)}`),
    h('h3', {}, t('history.attempts')),
    attempts,
    h('h3', {}, t('history.groups')),
    h('div', { class: 'solved-list' }, groups.map((g) => h('div', { class: 'group', 'data-d': g.difficulty },
      h('span', { class: 'group-title' }, h('span', { 'aria-hidden': 'true' }, SYMBOLS[g.difficulty]), ' ', g.title),
      h('span', { class: 'group-words' }, g.words.join(' · ')),
      g.explanation && h('span', { class: 'group-note' }, g.explanation)))),
    puzzle && h('button', { class: 'primary', onclick: () => navigate(e.code ? `#/h/${e.code}` : `#/hra/${puzzle.id}`) }, t('history.again'))
  ));
}
