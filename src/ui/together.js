// Záložka Spolu: všechno s lidmi – moje dnešní umístění, party (kdo hrál, nové hádanky) a vlastní hádanka.
// Údaje ze serveru se doplní, až dorazí; bez internetu zůstanou řádky klikací s popiskem „teď nedostupné“.
import { h, menuSection, menuRow } from './dom.js';
import { t } from '../services/i18n.js';
import { getProgress } from '../services/progress.js';
import { leaderboardEnabled, nickname, board, myParties, partyDetail } from '../services/leaderboard.js';
import { customId } from '../game/custom.js';
import { tabs } from './tabs.js';

export function renderTogether(root, { navigate }) {
  const go = (hash) => () => navigate(hash);
  const sections = [];

  if (leaderboardEnabled()) {
    const rankNote = h('span', {}, nickname() ? t('together.loading') : t('together.joinNote'));
    sections.push(menuSection(t('together.board'), [menuRow('trophy', t('together.boardRow'), rankNote, go('#/zebricek'))]));
    const partyList = h('ul', {}, menuRow('plus', t('together.partyNew'), t('together.partyNewNote'), go('#/parta')));
    sections.push(h('section', { class: 'more-to-play' }, h('h3', {}, t('together.party')), partyList));
    if (nickname()) fill(rankNote, partyList);
  }
  sections.push(menuSection(t('together.puzzles'), [menuRow('pencil', t('together.custom'), t('together.customNote'), go('#/vlastni'))]));

  root.append(h('div', { class: 'page' }, h('h2', {}, t('together.title')), ...sections), tabs('#/spolu', navigate));

  // Doplnění ze serveru: umístění dnes a řádek pro každou partu
  async function fill(rankNote, partyList) {
    board('today').then(({ me, count }) => {
      rankNote.textContent = me ? t('together.rank', { rank: me.rank, count, points: me.score }) : t('together.notPlayed');
    }).catch(() => { rankNote.textContent = t('together.unavailable'); });
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
