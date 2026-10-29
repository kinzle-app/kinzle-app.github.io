// Žebříček (#/zebricek): zápis přezdívkou, záložky Dnes (denní hádanka) a Celkem (semínka), smazání údajů.
// Formulář přezdívky a pořadí používá i obrazovka party.
import { h } from './dom.js';
import { t } from '../services/i18n.js';
import { leaderboardEnabled, nickname, join, board, forget } from '../services/leaderboard.js';
import { openModal } from './modal.js';

const ERRORS = ['nickname_taken', 'nickname_length', 'nickname_chars', 'nickname_bad'];

export function renderLeaderboard(root) {
  const page = h('div', { class: 'page' });
  root.append(page);
  draw();

  function draw() {
    page.replaceChildren(h('h2', {}, t('board.title')));
    if (!leaderboardEnabled()) page.append(h('p', { class: 'muted' }, t('board.disabled')));
    else if (!nickname()) page.append(...nicknameForm(draw));
    else {
      page.append(
        rankings(),
        h('p', { class: 'muted' }, t('board.playingAs', { name: nickname() })),
        h('button', { class: 'link', onclick: confirmForget }, t('board.forget')));
    }
  }

  function confirmForget() {
    const close = openModal([
      h('h2', { id: 'forget-title' }, t('board.forgetTitle')),
      h('p', {}, t('board.forgetText')),
      h('button', { class: 'primary', onclick: async () => {
        try {
          await forget();
          close();
          draw();
        } catch {
          close();
          page.append(h('p', { class: 'muted', role: 'status' }, t('board.unavailable')));
        }
      } }, t('board.forgetConfirm')),
      h('button', { class: 'secondary', onclick: () => close() }, t('board.cancel'))
    ], { labelledBy: 'forget-title' });
  }
}

// Zápis přezdívkou a krátké vysvětlení, co se ukládá; onDone() po úspěšném zápisu
export function nicknameForm(onDone) {
  const input = h('input', { class: 'nick-input', type: 'text', maxlength: 16, autocomplete: 'nickname', 'aria-label': t('board.nickname'), placeholder: t('board.nickname') });
  const status = h('p', { class: 'share-note', role: 'status' });
  const button = h('button', { class: 'primary', type: 'submit' }, t('board.join'));
  const form = h('form', { class: 'nick-form', onsubmit: async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = '';
    try {
      await join(input.value);
      onDone();
    } catch (error) {
      status.textContent = t(ERRORS.includes(error.message) ? `board.error.${error.message}` : 'board.unavailable');
      button.disabled = false;
    }
  } }, input, button, status);
  return [
    h('p', { class: 'nick-intro' }, t('board.intro')),
    form,
    h('ul', { class: 'privacy' }, ['privacyStored', 'privacyNot', 'privacyDelete'].map((key) => h('li', {}, t(`board.${key}`))))
  ];
}

// Pořadí podle celkových bodů a u každého, kolik dnes přibylo: celé, nebo jen pro partu (party = id party).
// limit = kolik prvních hráčů ukázat (jinak všech 50); onMore = odkaz „Celý žebříček“, když je jich víc.
export function rankings(party = null, { limit = null, onMore = null } = {}) {
  const list = h('div', { class: 'rank-box' }, h('p', { class: 'muted' }, t('board.loading')));
  const box = h('div', { class: 'rankings' }, h('p', { class: 'muted' }, t('board.note')), list);
  load();
  return box;

  async function load() {
    try {
      const data = await board(party);
      list.replaceChildren(...rows(data));
    } catch {
      list.replaceChildren(h('p', { class: 'muted' }, t('board.unavailable')));
    }
  }

  function rows({ top, me }) {
    if (!top.length) return [h('p', { class: 'muted' }, t('board.empty'))];
    const shown = limit ? top.slice(0, limit) : top;
    const out = [h('ol', { class: 'rank-list' }, shown.map(row))];
    if (me && !shown.some((r) => r.me)) out.push(h('ol', { class: 'rank-list rank-me' }, row(me)));
    // výzva jen pro zapsaného hráče, který zatím nemá body (nezapsaného zve karta nad žebříčkem)
    if (!me && nickname()) out.push(h('p', { class: 'muted' }, t('board.notYet')));
    if (onMore && shown.length < top.length) out.push(h('button', { class: 'link', onclick: onMore }, t('board.all')));
    return out;
  }

  // body celkem a pod nimi, kolik dnes přibylo
  function row(r) {
    return h('li', { class: r.me ? 'me' : '' },
      h('span', { class: 'rank-pos' }, `${r.rank}.`),
      playerName(r),
      h('span', { class: 'rank-value' },
        h('strong', {}, t('game.points', { points: r.points })),
        h('small', {}, r.today ? t('board.todayGain', { points: r.today }) : t('board.todayNone'))));
  }
}

// Přezdívka s odznakem Cesty
export function playerName(r) {
  const badge = r.level ? t('board.badge', { level: r.level, stars: r.stars }) : '';
  return h('span', { class: 'rank-name' }, h('strong', {}, r.nickname), badge && h('small', {}, badge));
}
