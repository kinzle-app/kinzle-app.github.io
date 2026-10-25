// Záložka Žebříček (adresa #/spolu): rovnou pořadí (prvních 10, celý na #/zebricek), pod ním party a vlastní hádanka.
// Údaje ze serveru se doplní, až dorazí; bez internetu zůstanou řádky klikací s popiskem „teď nedostupné“.
import { h, menuSection, menuRow } from './dom.js';
import { t } from '../services/i18n.js';
import { getProgress } from '../services/progress.js';
import { leaderboardEnabled, nickname, myParties, partyDetail } from '../services/leaderboard.js';
import { rankings } from './leaderboard.js';
import { customId } from '../game/custom.js';
import { tabs } from './tabs.js';

export function renderTogether(root, { navigate }) {
  const go = (hash) => () => navigate(hash);
  const sections = [];

  if (leaderboardEnabled()) {
    // kdo ještě nemá přezdívku, vidí žebříček taky a nad ním pozvánku k zápisu
    if (!nickname()) {
      sections.push(h('section', { class: 'panel join-card' },
        h('p', { class: 'panel-text' }, t('together.joinText')),
        h('button', { class: 'primary', onclick: go('#/zebricek') }, t('board.join'))));
    }
    sections.push(rankings(null, { limit: 10, onMore: go('#/zebricek') }));
    const partyList = h('ul', {}, menuRow('plus', t('together.partyNew'), t('together.partyNewNote'), go('#/parta')));
    sections.push(h('section', { class: 'more-to-play' }, h('h3', {}, t('together.party')), partyList));
    if (nickname()) fill(partyList);
  } else {
    sections.push(h('p', { class: 'muted' }, t('board.disabled')));
  }
  sections.push(menuSection(t('together.puzzles'), [menuRow('pencil', t('together.custom'), t('together.customNote'), go('#/vlastni'))]));

  root.append(h('div', { class: 'page' }, h('h2', {}, t('together.title')), ...sections), tabs('#/spolu', navigate));

  // Doplnění ze serveru: řádek pro každou partu (kdo dnes hrál, nové hádanky)
  async function fill(partyList) {
    try {
      const parties = await myParties();
      const played = new Set(getProgress().history.filter((e) => e.mode === 'custom').map((e) => e.puzzleId));
      for (const p of parties) {
        const note = h('span', {}, t('together.loading'));
        partyList.lastChild.before(menuRow('people', p.name, note, go(`#/parta/${p.id}`)));
        partyDetail(p.id).then((d) => {
          const fresh = d.puzzles.filter((z) => !z.mine && !played.has(customId(z.code))).length;
          note.textContent = [
            t('together.played', { played: d.members.filter((m) => m.played).length, total: d.members.length }),
            fresh ? t('together.newPuzzles', { count: fresh }) : null
          ].filter(Boolean).join(' · ');
        }).catch(() => { note.textContent = t('together.unavailable'); });
      }
    } catch {
      // bez internetu zůstane jen řádek pro založení party
    }
  }
}
