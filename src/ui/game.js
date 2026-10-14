// Obrazovka hry: vyřešené skupiny, kostičky, pokusy, ovládání a konec hry.
import { h, fitText } from './dom.js';
import { t } from '../services/i18n.js';
import {
  createGame, toggleWord, clearSelection, shuffleBoard, submit,
  mistakesLeft, MAX_MISTAKES, RESULT
} from '../game/engine.js';

export const SYMBOLS = { 1: '●', 2: '▲', 3: '■', 4: '◆', 5: '★' };
const REVEAL_DELAY = 700; // ms mezi odkrýváním skupin po prohře
const MESSAGE_TIME = 2500;
const TILE_HEIGHT = 74; // výchozí výška kostičky v px

export function renderGame(root, { puzzle, number, navigate }) {
  const game = createGame(puzzle);
  const tiles = new Map(); // slovo → tlačítko kostičky (zůstávají, aby fungovaly přechody)
  let messageTimer = null;
  const timers = [];

  const solvedList = h('div', { class: 'solved-list' });
  const board = h('div', { class: 'board', role: 'group', 'aria-label': t('game.board') });
  const dots = h('span', { class: 'attempts-dots', role: 'img' });
  const attempts = h('div', { class: 'attempts' }, h('span', { 'aria-hidden': 'true' }, t('game.attempts')), dots);
  const message = h('p', { class: 'message', role: 'status', 'aria-live': 'polite' });
  const shuffleBtn = h('button', { class: 'secondary', onclick: onShuffle }, t('game.shuffle'));
  const deselectBtn = h('button', { class: 'secondary', onclick: onDeselect }, t('game.deselect'));
  const submitBtn = h('button', { class: 'primary', onclick: onSubmit }, t('game.submit'));
  const play = h('div', { class: 'play' },
    board, attempts, message, h('div', { class: 'controls' }, shuffleBtn, deselectBtn), submitBtn);

  root.append(
    h('div', { class: 'bar' },
      h('span', {}, t('home.puzzle', { n: number })),
      h('span', { class: 'muted' }, t(`size.${puzzle.size}`))),
    solvedList,
    play
  );

  for (const word of game.board) {
    const btn = h('button', { class: 'tile', 'aria-pressed': 'false', 'aria-label': word, 'data-word': word, onclick: () => onTile(word) },
      h('span', {}, word));
    tiles.set(word, btn);
  }

  // Kostičky se zmenší (nejvýš na 48 px), aby se hra vešla na displej bez posouvání
  const refit = () => {
    const rows = Math.ceil(game.board.length / 4);
    board.style.setProperty('--tile-h', TILE_HEIGHT + 'px');
    const overflow = document.documentElement.scrollHeight - window.innerHeight;
    if (overflow > 0 && rows) {
      board.style.setProperty('--tile-h', Math.max(48, TILE_HEIGHT - Math.ceil(overflow / rows)) + 'px');
    }
    tiles.forEach((btn) => btn.isConnected && fitText(btn));
  };
  window.addEventListener('resize', refit);
  document.fonts.ready.then(refit);

  update();

  // ---------- akce hráče ----------
  function onTile(word) {
    toggleWord(game, word);
    update();
  }

  function onDeselect() {
    clearSelection(game);
    update();
  }

  function onShuffle() {
    shuffleBoard(game);
    update();
  }

  function onSubmit() {
    const { result, groupIndex } = submit(game);
    if (result === RESULT.CORRECT) {
      addGroup(groupIndex);
      say(t('msg.correct'));
    } else if (result === RESULT.ONE_AWAY) say(t('msg.oneAway'));
    else if (result === RESULT.WRONG) say(t('msg.wrong'));
    else if (result === RESULT.REPEAT) say(t('msg.repeat'));
    else if (result === RESULT.INCOMPLETE) say(t('msg.pickFour'));

    if (game.status === 'lost') revealRest();
    else if (game.status === 'won') showEnd();
    update();
  }

  // ---------- vykreslení ----------
  function update() {
    // kostičky v aktuálním pořadí, vyřešené odeberou
    board.replaceChildren(...game.board.map((w) => tiles.get(w)));
    tiles.forEach((btn, word) => {
      btn.setAttribute('aria-pressed', String(game.selected.includes(word)));
      btn.disabled = game.status !== 'playing';
    });
    refit();

    const left = mistakesLeft(game);
    dots.setAttribute('aria-label', t('game.attemptsLeft', { count: left }));
    dots.replaceChildren(...Array.from({ length: MAX_MISTAKES }, (_, i) =>
      h('span', { class: i < left ? 'dot' : 'dot off' })));

    deselectBtn.disabled = game.selected.length === 0;
    submitBtn.disabled = game.selected.length !== 4 || game.status !== 'playing';
    shuffleBtn.disabled = game.status !== 'playing';
  }

  function addGroup(index, revealed = false) {
    const g = puzzle.groups[index];
    solvedList.append(h('section', {
      class: revealed ? 'group revealed' : 'group',
      'data-d': g.difficulty,
      'aria-label': t('game.solvedGroup', { title: g.title, words: g.words.join(', ') })
    },
      h('div', { class: 'group-title' }, `${SYMBOLS[g.difficulty]} ${g.title}`),
      h('div', { class: 'group-words' }, g.words.join(' · ')),
      h('div', { class: 'group-note' }, g.explanation)
    ));
  }

  function say(text) {
    message.textContent = text;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => (message.textContent = ''), MESSAGE_TIME);
  }

  // Po prohře se zbylé skupiny klidně odkryjí jedna po druhé
  function revealRest() {
    game.revealed.forEach((index, i) => {
      timers.push(setTimeout(() => {
        addGroup(index, true);
        game.board = game.board.filter((w) => !puzzle.groups[index].words.includes(w));
        update();
        if (i === game.revealed.length - 1) showEnd();
      }, REVEAL_DELAY * (i + 1)));
    });
  }

  function showEnd() {
    play.replaceChildren(h('div', { class: 'end' },
      h('p', { role: 'status' }, t(game.status === 'won' ? 'end.won' : 'end.lost')),
      h('button', { class: 'primary', onclick: () => navigate(`#/hra/${puzzle.id}`) }, t('end.again')),
      h('button', { class: 'secondary', onclick: () => navigate('#/') }, t('end.back'))
    ));
  }

  // Úklid při odchodu z obrazovky
  function cleanup() {
    window.removeEventListener('resize', refit);
    clearTimeout(messageTimer);
    timers.forEach(clearTimeout);
  }
  return cleanup;
}
