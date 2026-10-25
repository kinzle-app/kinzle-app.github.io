// Žebříček (#/zebricek): zápis přezdívkou, záložky Dnes (denní hádanka) a Celkem (semínka), smazání údajů.
import { h } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { tiersOf } from '../config/tiers.js';
import { leaderboardEnabled, nickname, join, board, forget } from '../services/leaderboard.js';
import { openModal } from './modal.js';

let kind = 'today'; // vybraná záložka (pamatuje se mezi návštěvami)

const ERRORS = ['nickname_taken', 'nickname_length', 'nickname_chars', 'nickname_bad'];

export function renderLeaderboard(root) {
  const page = h('div', { class: 'page' });
  root.append(page);
  draw();

  function draw() {
    page.replaceChildren(h('h2', {}, t('board.title')));
    if (!leaderboardEnabled()) page.append(h('p', { class: 'muted' }, t('board.disabled')));
    else if (!nickname()) page.append(...joinForm());
    else page.append(...boardView());
  }

  // Zápis: přezdívka a krátké vysvětlení, co se ukládá
  function joinForm() {
    const input = h('input', { class: 'nick-input', type: 'text', maxlength: 16, autocomplete: 'nickname', 'aria-label': t('board.nickname'), placeholder: t('board.nickname') });
    const status = h('p', { class: 'share-note', role: 'status' });
    const button = h('button', { class: 'primary', type: 'submit' }, t('board.join'));
    const form = h('form', { class: 'nick-form', onsubmit: async (event) => {
      event.preventDefault();
      button.disabled = true;
      status.textContent = '';
      try {
        await join(input.value);
        draw();
      } catch (error) {
        status.textContent = t(ERRORS.includes(error.message) ? `board.error.${error.message}` : 'board.unavailable');
        button.disabled = false;
      }
    } }, input, button, status);
    return [h('p', {}, t('board.intro')), form, h('p', { class: 'muted' }, t('board.privacy'))];
  }

  // Pořadí: záložky, seznam (top 50 + vlastní řádek), smazání údajů
  function boardView() {
    const list = h('div', { class: 'board-list' }, h('p', { class: 'muted' }, t('board.loading')));
    const choice = h('div', { class: 'tier-choice', role: 'group', 'aria-label': t('board.title') },
      ['today', 'total'].map((k) => h('button', {
        type: 'button', 'aria-pressed': String(k === kind),
        onclick: () => { kind = k; draw(); }
      }, t(`board.${k}`))));
    load(list);
    return [
      choice,
      h('p', { class: 'muted' }, t(`board.${kind}Note`)),
      list,
      h('p', { class: 'muted' }, t('board.playingAs', { name: nickname() })),
      h('button', { class: 'link', onclick: confirmForget }, t('board.forget'))
    ];
  }

  async function load(list) {
    try {
      const data = await board(kind);
      list.replaceChildren(...rows(data));
    } catch {
      list.replaceChildren(h('p', { class: 'muted' }, t('board.unavailable')));
    }
  }

  function rows({ top, me }) {
    if (!top.length) return [h('p', { class: 'muted' }, t(`board.${kind}Empty`))];
    const out = [h('ol', { class: 'board' }, top.map(row))];
    if (me && !top.some((r) => r.me)) out.push(h('ol', { class: 'board board-me' }, row(me)));
    if (!me && kind === 'today') out.push(h('p', { class: 'muted' }, t('board.notYet')));
    return out;
  }

  function row(r) {
    const badge = r.level ? t('board.badge', { level: r.level, stars: r.stars }) : '';
    const value = kind === 'today'
      ? [t('game.points', { points: r.score }), tiersOf(getLanguage()).length ? ` · ${t(`tier.${r.tier}`)}` : '']
      : [t('board.seeds', { count: r.seeds })];
    return h('li', { class: r.me ? 'me' : '' },
      h('span', { class: 'board-rank' }, `${r.rank}.`),
      h('span', { class: 'board-name' }, h('strong', {}, r.nickname), badge && h('small', {}, badge)),
      h('span', { class: 'board-value' }, ...value));
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
