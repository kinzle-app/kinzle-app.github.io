// Parta: soukromá skupina s vlastním žebříčkem, přehledem „kdo dnes hrál“ a hádankami od členů.
// #/parta (moje party, založit, připojit se), #/parta/<id> (detail), #/parta/pripojit/<kód> (odkaz z pozvánky)
import { h } from './dom.js';
import { t } from '../services/i18n.js';
import { shareText } from '../services/share.js';
import { getProgress } from '../services/progress.js';
import {
  leaderboardEnabled, nickname, sync, myParties, createParty, joinParty, partyDetail,
  leaveParty, removeMember, deletePartyPuzzle
} from '../services/leaderboard.js';
import { customId } from '../game/custom.js';
import { nicknameForm, rankings, playerName } from './leaderboard.js';
import { customLabel } from './custom.js';
import { formatDate } from './daily.js';
import { openModal } from './modal.js';

const ERRORS = ['party_name_length', 'party_name_chars', 'party_name_bad', 'too_many_parties', 'party_not_found', 'party_full'];
const errorText = (error) => t(ERRORS.includes(error.message) ? `party.error.${error.message}` : 'board.unavailable');

// Hráč bez přezdívky se nejdřív zapíše (parta potřebuje přezdívku)
function needsNickname(page, title, draw) {
  if (!leaderboardEnabled()) {
    page.replaceChildren(h('h2', {}, title), h('p', { class: 'muted' }, t('board.disabled')));
    return true;
  }
  if (!nickname()) {
    page.replaceChildren(h('h2', {}, title), h('p', {}, t('party.needNick')), ...nicknameForm(draw));
    return true;
  }
  return false;
}

export function renderParties(root, { navigate }) {
  const page = h('div', { class: 'page' });
  root.append(page);
  draw();

  function draw() {
    if (needsNickname(page, t('party.title'), draw)) return;
    const list = h('div', {}, h('p', { class: 'muted' }, t('board.loading')));
    page.replaceChildren(
      h('h2', {}, t('party.title')),
      h('p', { class: 'muted' }, t('party.intro')),
      list,
      h('h3', {}, t('party.create')),
      form(t('party.namePlaceholder'), 24, t('party.createButton'), async (value) => navigate(`#/parta/${(await createParty(value)).id}`)),
      h('h3', {}, t('party.join')),
      form(t('party.codePlaceholder'), 6, t('party.joinButton'), async (value) => navigate(`#/parta/${(await joinParty(value)).id}`)));
    myParties().then((parties) => {
      list.replaceChildren(parties.length
        ? h('ul', { class: 'menu' }, parties.map((p) => h('li', {}, h('button', { class: 'menu-item', onclick: () => navigate(`#/parta/${p.id}`) },
          h('span', {}, p.name), h('span', { class: 'muted' }, t('party.members', { count: p.members }))))))
        : h('p', {}, t('party.none')));
    }).catch(() => list.replaceChildren(h('p', { class: 'muted' }, t('board.unavailable'))));
  }

  // Jednoduchý formulář s jedním políčkem (název nové party / kód pro připojení)
  function form(placeholder, maxlength, label, action) {
    const input = h('input', { class: 'nick-input', type: 'text', maxlength, placeholder, 'aria-label': placeholder });
    const status = h('p', { class: 'share-note', role: 'status' });
    const button = h('button', { class: 'secondary', type: 'submit' }, label);
    return h('form', { class: 'nick-form', onsubmit: async (e) => {
      e.preventDefault();
      button.disabled = true;
      try {
        await action(input.value);
      } catch (error) {
        status.textContent = errorText(error);
        button.disabled = false;
      }
    } }, input, button, status);
  }
}

// Pozvánka odkazem: po zápisu přezdívky se hráč rovnou připojí
export function renderPartyJoin(root, { code }) {
  const page = h('div', { class: 'page' });
  root.append(page);
  draw();

  async function draw() {
    if (needsNickname(page, t('party.title'), draw)) return;
    page.replaceChildren(h('h2', {}, t('party.title')), h('p', { class: 'muted' }, t('board.loading')));
    try {
      location.replace(`#/parta/${(await joinParty(code)).id}`);
    } catch (error) {
      page.replaceChildren(h('h2', {}, t('party.title')), h('p', {}, errorText(error)),
        h('button', { class: 'secondary', onclick: () => location.replace('#/parta') }, t('party.title')));
    }
  }
}

export function renderParty(root, { navigate, id }) {
  const page = h('div', { class: 'page' }, h('p', { class: 'muted' }, t('board.loading')));
  root.append(page);
  draw();

  async function draw() {
    if (needsNickname(page, t('party.title'), draw)) return;
    let party;
    try {
      await sync(); // vlastní dnešní výsledek ať je v přehledu
      party = await partyDetail(id);
    } catch (error) {
      if (error.message === 'not_member') location.replace('#/parta');
      else page.replaceChildren(h('h2', {}, t('party.title')), h('p', { class: 'muted' }, t('board.unavailable')));
      return;
    }
    const played = new Set(getProgress().history.filter((e) => e.mode === 'custom').map((e) => e.puzzleId));
    const note = h('p', { class: 'share-note', role: 'status' });
    const invite = `${location.origin}${location.pathname}#/parta/pripojit/${party.code}`;

    page.replaceChildren(
      h('h2', {}, party.name),
      h('section', { class: 'panel party-invite' },
        h('small', {}, t('party.code')),
        h('strong', { class: 'party-code' }, party.code),
        h('button', { class: 'primary', onclick: async () => {
          const result = await shareText(t('party.inviteText', { name: party.name, code: party.code }), invite);
          if (result === 'copied') note.textContent = t('party.copied');
          else if (result === 'manual') note.replaceChildren(t('share.manual'), h('textarea', { readonly: true, rows: 3, 'aria-label': t('party.invite') }, invite));
        } }, t('party.invite')),
        note),

      h('h3', {}, t('party.today')),
      h('ol', { class: 'rank-list' }, party.members.map((m) => h('li', { class: m.me ? 'me' : '' },
        h('span', { class: 'rank-pos', 'aria-hidden': 'true' }, m.played ? '✓' : '·'),
        playerName(m),
        h('span', { class: 'rank-value' }, t(m.played ? 'party.played' : 'party.notPlayed'),
          party.owner && !m.me ? h('button', { class: 'link small', onclick: () => confirmRemove(m) }, t('party.remove')) : null)))),

      h('h3', {}, t('party.board')),
      rankings(id),

      h('h3', {}, t('party.puzzles')),
      h('button', { class: 'primary', onclick: () => navigate(`#/vlastni/parta/${id}`) }, t('party.newPuzzle')),
      party.puzzles.length
        ? h('ul', { class: 'menu' }, party.puzzles.map((p) => h('li', { class: 'party-puzzle' },
          h('button', { class: 'menu-item', onclick: () => navigate(`#/h/${p.code}`) },
            h('span', {}, `${played.has(customId(p.code)) ? '✓ ' : ''}${customLabel(p.code)}`),
            h('span', { class: 'muted' }, formatDate(p.created_at.slice(0, 10)))),
          (p.mine || party.owner) && h('button', { class: 'link small', onclick: () => confirmDelete(p) }, t('party.deletePuzzle')))))
        : h('p', { class: 'muted' }, t('party.noPuzzles')),

      h('button', { class: 'link', onclick: confirmLeave }, t('party.leave')));
  }

  // Potvrzení akce v dialogu; action() po potvrzení, pak se přehled načte znovu
  function confirm(title, text, button, action) {
    const close = openModal([
      h('h2', { id: 'confirm-title' }, title),
      h('p', {}, text),
      h('button', { class: 'primary', onclick: async () => {
        try {
          await action();
        } catch {
          // nepovedlo se (bez internetu) – přehled ukáže aktuální stav
        }
        close();
        draw();
      } }, button),
      h('button', { class: 'secondary', onclick: () => close() }, t('board.cancel'))
    ], { labelledBy: 'confirm-title' });
  }

  const confirmRemove = (m) => confirm(t('party.removeTitle', { name: m.nickname }), t('party.removeText'), t('party.remove'), () => removeMember(id, m.id));
  const confirmDelete = (p) => confirm(t('party.deletePuzzleTitle'), t('party.deletePuzzleText'), t('party.deletePuzzle'), () => deletePartyPuzzle(p.id));
  const confirmLeave = () => confirm(t('party.leaveTitle'), t('party.leaveText'), t('party.leave'), async () => {
    await leaveParty(id);
    location.replace('#/parta');
  });
}
