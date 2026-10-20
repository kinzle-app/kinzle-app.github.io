// Obrazovka hry: lišta s časem a body, nápovědy, vyřešené skupiny, kostičky, ovládání a konec hry.
import { h, fitText } from './dom.js';
import { t } from '../services/i18n.js';
import { getSettings } from '../services/settings.js';
import { play } from '../services/sound.js';
import { vibrate } from '../services/haptics.js';
import { shareText } from '../services/share.js';
import { FEEL } from '../config/feel.js';
import { SCORING } from '../config/scoring.js';
import {
  createGame, toggleWord, clearSelection, shuffleBoard, submit, canHint, useHint,
  mistakesLeft, MAX_MISTAKES, RESULT
} from '../game/engine.js';
import { scoreBreakdown } from '../game/score.js';
import { createTimer, formatTime } from '../game/timer.js';
import { flip, shake, bounce, gather, revealGroup, fadeIn, countUp } from './anim.js';
import { confetti } from './confetti.js';
import { openModal } from './modal.js';

export const SYMBOLS = { 1: '●', 2: '▲', 3: '■', 4: '◆', 5: '★' };
const TILE_HEIGHT = 74; // výchozí výška kostičky v px

// Rozehrané hry (klíč = režim + hádanka): odchod do nastavení a zpět hru nepřeruší
const sessions = new Map();

export function hasSession(key) {
  return sessions.get(key)?.game.status === 'playing';
}

// onFinish(game, seconds, score) se zavolá jednou po konci hry a vrátí počet nových semínek.
// again = jde hrát znovu (denní hádanka jen jednou); back = kam vede tlačítko Zpět na konci;
// endNote(game) = doplňující řádek na konci hry (např. hvězdy na Cestě).
// training = trénink: bez bodů a časomíry, bez limitu chyb, nápovědy zdarma a bez omezení.
export function renderGame(root, { puzzle, label, navigate, sessionKey = puzzle.id, onFinish, again = true, back = '#/', backLabel, endNote, training = false }) {
  const maxHints = training ? Infinity : SCORING.maxHints;
  if (!sessions.has(sessionKey)) {
    const game = createGame(puzzle, Math.random, { maxMistakes: training ? Infinity : MAX_MISTAKES });
    sessions.set(sessionKey, { game, timer: createTimer(), finished: false, seedsAdded: 0 });
  }
  const session = sessions.get(sessionKey);
  const { game, timer } = session;

  const tiles = new Map(); // slovo → tlačítko kostičky (zůstávají, aby fungovaly přechody)
  const groupEls = [];
  // během animace nejde odeslat, míchat ani brát nápovědu; kostičky vybírat jde (rychlý hráč)
  let busy = false;
  let messageTimer = null;
  const timers = [];

  // ---------- prvky ----------
  const timeEl = h('span', {});
  const scoreEl = h('span', { class: 'pill' });
  const hintCards = h('div', { class: 'hint-cards' });
  const solvedList = h('div', { class: 'solved-list' });
  const board = h('div', { class: 'board', role: 'group', 'aria-label': t('game.board') });
  const dots = h('span', { class: 'attempts-dots', role: 'img' });
  const attempts = h('div', { class: 'attempts' }, h('span', { 'aria-hidden': 'true' }, t('game.attempts')), dots);
  const message = h('p', { class: 'message', role: 'status', 'aria-live': 'polite' });
  const hintBtn = h('button', { class: 'secondary', onclick: onHintMenu }, t('game.hint'));
  const shuffleBtn = h('button', { class: 'secondary', onclick: onShuffle }, t('game.shuffle'));
  const deselectBtn = h('button', { class: 'secondary', onclick: onDeselect }, t('game.deselect'));
  const submitBtn = h('button', { class: 'primary', onclick: onSubmit }, t('game.submit'));
  const playArea = h('div', { class: 'play' },
    board, attempts, message, h('div', { class: 'controls' }, hintBtn, shuffleBtn, deselectBtn), submitBtn);

  if (training) attempts.replaceChildren(t('game.trainingNote'));
  root.append(
    h('div', { class: 'bar' },
      h('span', {}, label),
      training ? h('span', { class: 'pill' }, t('game.training')) : '',
      training ? '' : h('span', { class: 'timer' }, clockIcon(), h('span', { class: 'visually-hidden' }, t('game.time')), timeEl),
      training ? '' : scoreEl),
    hintCards,
    solvedList,
    playArea
  );

  for (const word of game.puzzle.groups.flatMap((g) => g.words)) {
    tiles.set(word, h('button', {
      class: 'tile', 'aria-pressed': 'false', 'aria-label': word, 'data-word': word,
      onclick: () => onTile(word)
    }, h('span', {}, word)));
  }

  // Kostičky se zmenší (nejvýš na 48 px), aby se hra vešla na displej bez posouvání
  const refit = () => {
    const rows = Math.ceil(game.board.length / 4);
    board.style.setProperty('--tile-h', TILE_HEIGHT + 'px');
    const overflow = document.documentElement.scrollHeight - window.innerHeight;
    if (overflow > 0 && rows) {
      board.style.setProperty('--tile-h', Math.max(48, TILE_HEIGHT - Math.ceil(overflow / rows)) + 'px');
    }
    const max = 15 * fontScale();
    tiles.forEach((btn) => btn.isConnected && fitText(btn, max));
  };

  // stav po návratu na obrazovku (nebo nová hra)
  game.solved.forEach((i) => addGroup(i));
  game.revealed.forEach((i) => addGroup(i, { revealed: true }));
  renderHints();
  update();
  if (game.status !== 'playing') showEnd(false);

  // ---------- časovač: běží jen při hře a na viditelné obrazovce ----------
  const onVisibility = () => {
    if (document.hidden) timer.pause();
    else if (game.status === 'playing') timer.start();
  };
  if (game.status === 'playing') timer.start();
  document.addEventListener('visibilitychange', onVisibility);
  const tick = setInterval(updateBar, 1000);

  // přepočítat při změně šířky mřížky (otočení, okno) i po načtení písma (do té doby má jiné rozměry)
  let boardWidth = 0;
  const resizeObserver = new ResizeObserver(([entry]) => {
    if (Math.round(entry.contentRect.width) !== boardWidth) {
      boardWidth = Math.round(entry.contentRect.width);
      refit();
    }
  });
  resizeObserver.observe(board);
  window.addEventListener('resize', refit);
  document.fonts.addEventListener('loadingdone', refit);
  document.fonts.ready.then(refit);
  // šířka slov se měří tučností 800 (vybraná kostička); prohlížeč by ji jinak načetl až při prvním výběru
  // a do té doby měřil užším náhradním písmem (Safari pak o dočtení písma nedá vědět)
  document.fonts.load("800 15px 'Bricolage Grotesque'").then(refit, () => {});

  // ---------- akce hráče ----------
  function onTile(word) {
    if (game.status !== 'playing') return;
    const wasSelected = game.selected.includes(word);
    toggleWord(game, word);
    const nowSelected = game.selected.includes(word);
    if (nowSelected !== wasSelected) {
      play(nowSelected ? 'select' : 'deselect');
      vibrate(nowSelected ? FEEL.vibrate.select : FEEL.vibrate.deselect);
    }
    update({ keepTiles: busy }); // během animace se kostičky nepřeskládají
  }

  function onDeselect() {
    clearSelection(game);
    play('deselect');
    update({ keepTiles: busy });
  }

  function onShuffle() {
    if (busy) return;
    busy = true;
    flip([...tiles.values()], () => {
      shuffleBoard(game);
      placeTiles();
    }).then(() => { busy = false; update({ keepTiles: true }); });
  }

  async function onSubmit() {
    if (busy) return;
    const chosen = game.selected.map((w) => tiles.get(w));
    const { result, groupIndex } = submit(game);

    if (result === RESULT.INCOMPLETE) return say(t('msg.pickFour'));
    if (result === RESULT.REPEAT) return say(t('msg.repeat'));
    busy = true;
    update({ keepTiles: true });

    if (result === RESULT.CORRECT) {
      play('correct');
      vibrate(FEEL.vibrate.correct);
      update({ keepTiles: true });
      chosen.forEach((el) => el.setAttribute('aria-pressed', 'true')); // během animace zůstanou vybrané
      await gather(chosen);
      await flip([...tiles.values()].filter((el) => !chosen.includes(el)), placeTiles);
      chosen.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      renderHints();
      // pruh skupiny vyjíždí, ale hráč už může vybírat další kostičky (při výhře se počká)
      const reveal = addGroup(groupIndex, { animate: true });
      if (game.status === 'won') await reveal;
    } else {
      const oneAway = result === RESULT.ONE_AWAY;
      play(oneAway ? 'oneAway' : 'wrong');
      vibrate(oneAway ? FEEL.vibrate.oneAway : FEEL.vibrate.wrong);
      say(t(oneAway ? 'msg.oneAway' : 'msg.wrong'));
      update({ keepTiles: true });
      await (oneAway ? bounce(chosen) : shake(chosen));
    }

    busy = false;
    update();
    if (game.status !== 'playing') finish();
    if (game.status === 'won') {
      timer.pause();
      play('win');
      showEnd(true);
    } else if (game.status === 'lost') {
      timer.pause();
      revealRest();
    }
  }

  function onHintMenu() {
    if (busy || game.status !== 'playing') return;
    const left = maxHints - game.hints.length;
    // každá volba s jednou větou, co přesně udělá
    const option = (type) => h('button', {
      class: 'secondary hint-option', type: 'button',
      disabled: !canHint(game, type, maxHints),
      onclick: () => { close(); applyHint(type); }
    },
      h('span', { class: 'hint-option-text' }, h('strong', {}, t(`hint.option.${type}`)), h('small', {}, t(`hint.optionNote.${type}`))),
      h('span', { class: 'cost' }, training ? t('hint.free') : t('hint.cost', { points: SCORING.hintCost[type] })));

    const close = openModal([
      h('h2', { id: 'hint-title' }, t('hint.title')),
      training ? '' : h('p', { class: 'muted' }, t('hint.left', { count: left })),
      h('div', { class: 'hint-options' }, option('title'), option('pair')),
      h('button', { class: 'primary', type: 'button', onclick: () => close() }, t('hint.cancel'))
    ], { labelledBy: 'hint-title' });
  }

  function applyHint(type) {
    if (!useHint(game, type, maxHints)) return;
    play('hint');
    renderHints();
    update();
  }

  // ---------- vykreslení ----------
  function placeTiles() {
    board.replaceChildren(...game.board.map((w) => tiles.get(w)));
  }

  function update({ keepTiles = false } = {}) {
    if (!keepTiles) placeTiles();
    tiles.forEach((btn, word) => {
      btn.setAttribute('aria-pressed', String(game.selected.includes(word)));
      btn.disabled = game.status !== 'playing';
    });
    requestAnimationFrame(refit);

    if (!training) {
      const left = mistakesLeft(game);
      dots.setAttribute('aria-label', t('game.attemptsLeft', { count: left }));
      dots.replaceChildren(...Array.from({ length: MAX_MISTAKES }, (_, i) =>
        h('span', { class: i < left ? 'dot' : 'dot off' })));
    }

    const playing = game.status === 'playing';
    deselectBtn.disabled = !playing || game.selected.length === 0;
    // během animace jsou tlačítka viditelně neaktivní (stisk by se jinak tiše ztratil)
    submitBtn.disabled = busy || !playing || game.selected.length !== 4;
    shuffleBtn.disabled = busy || !playing;
    hintBtn.disabled = busy || !playing || !(canHint(game, 'title', maxHints) || canHint(game, 'pair', maxHints));
    updateBar();
  }

  function updateBar() {
    timeEl.textContent = formatTime(timer.seconds());
    scoreEl.textContent = t('game.points', { points: scoreBreakdown(game, timer.seconds()).total });
  }

  // Nápovědy: trvalé karty nad kostičkami (název skupiny / dvojice slov) a značka skupiny na kostičkách
  function renderHints() {
    const active = game.hints.filter((hint) => !game.solved.includes(hint.group) && !game.revealed.includes(hint.group));
    hintCards.replaceChildren(...active.map((hint) => {
      const g = game.puzzle.groups[hint.group];
      const text = hint.type === 'title'
        ? t('hint.groupTitle', { title: g.title })
        : t('hint.pairCard', { a: hint.words[0].toLocaleUpperCase(), b: hint.words[1].toLocaleUpperCase() });
      return h('div', { class: 'hint-card', 'data-d': g.difficulty }, h('span', { 'aria-hidden': 'true' }, SYMBOLS[g.difficulty]), ' ', text);
    }));
    tiles.forEach((btn) => {
      btn.classList.remove('hinted');
      btn.removeAttribute('data-d');
      btn.removeAttribute('data-symbol');
      btn.setAttribute('aria-label', btn.dataset.word);
    });
    for (const hint of active.filter((x) => x.type === 'pair')) {
      const g = game.puzzle.groups[hint.group];
      for (const word of hint.words) {
        const btn = tiles.get(word);
        btn.classList.add('hinted');
        btn.dataset.d = g.difficulty;
        btn.dataset.symbol = SYMBOLS[g.difficulty];
        btn.setAttribute('aria-label', t('hint.tileLabel', { word, symbol: SYMBOLS[g.difficulty] }));
      }
    }
  }

  async function addGroup(index, { revealed = false, animate = false } = {}) {
    const g = game.puzzle.groups[index];
    const note = h('span', { class: 'group-note' }, g.explanation);
    const el = h('button', {
      class: revealed ? 'group revealed' : 'group', type: 'button', 'data-d': g.difficulty,
      'aria-expanded': 'true', onclick: () => toggleGroup(el)
    },
      h('span', { class: 'group-title' }, h('span', { 'aria-hidden': 'true' }, SYMBOLS[g.difficulty]), ' ', g.title),
      h('span', { class: 'group-words' }, g.words.join(' · ')),
      note);
    // vysvětlení nechá rozbalené jen u nejnovější skupiny, ať se hra vejde na displej
    groupEls.forEach((other) => other.setAttribute('aria-expanded', 'false'));
    groupEls.push(el);
    solvedList.append(el);
    requestAnimationFrame(refit);
    if (animate) await revealGroup(el, note);
  }

  function toggleGroup(el) {
    el.setAttribute('aria-expanded', String(el.getAttribute('aria-expanded') !== 'true'));
    requestAnimationFrame(refit);
  }

  function say(text) {
    message.textContent = text;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => (message.textContent = ''), FEEL.message);
  }

  // Po prohře se zbylé skupiny klidně odkryjí jedna po druhé
  function revealRest() {
    busy = true;
    game.revealed.forEach((index, i) => {
      timers.push(setTimeout(async () => {
        const words = game.puzzle.groups[index].words;
        await gather(words.map((w) => tiles.get(w)).filter((el) => el.isConnected));
        game.board = game.board.filter((w) => !words.includes(w));
        update();
        renderHints();
        await addGroup(index, { revealed: true, animate: true });
        if (i === game.revealed.length - 1) {
          busy = false;
          showEnd(true);
        }
      }, FEEL.revealDelay * (i + 1)));
    });
  }

  // Uloží výsledek (jen jednou za hru)
  function finish() {
    if (session.finished) return;
    timer.pause();
    session.finished = true;
    session.seedsAdded = onFinish?.(game, timer.seconds(), training ? 0 : scoreBreakdown(game, timer.seconds()).total) || 0;
  }

  function showEnd(fresh) {
    const won = game.status === 'won';
    const seconds = timer.seconds();
    const score = scoreBreakdown(game, seconds);
    const points = h('span', { class: 'end-points' });
    const shareNote = h('p', { class: 'share-note', role: 'status' });
    const stat = (label, value) => h('div', { class: 'stat' },
      h('span', { class: 'stat-value' }, value), h('span', { class: 'stat-label' }, label));

    // řádek rozpisu bodů; srážky se zobrazují se znaménkem minus
    const line = (key, value, minus = false) => value
      ? h('li', {}, h('span', {}, t(key)), h('span', {}, `${minus ? '−' : '+'}${value}`))
      : null;

    // trénink: bez bodů, jen kolik to stálo chyb a nápověd
    if (training) {
      const end = h('div', { class: 'end' },
        h('h2', {}, t('end.won')),
        h('div', { class: 'stats stats-2' },
          stat(t('end.mistakes'), String(game.mistakes)),
          stat(t('end.hints'), String(game.hints.length))),
        session.seedsAdded > 0 && h('p', { class: 'seeds-note' }, t('end.seeds', { count: session.seedsAdded })),
        h('button', { class: 'primary', onclick: () => navigate(back) }, backLabel || t('end.back')),
        h('button', { class: 'secondary', onclick: () => { sessions.delete(sessionKey); navigate(location.hash); } }, t('end.again')));
      playArea.replaceChildren(end);
      if (fresh) fadeIn(end);
      return;
    }

    const end = h('div', { class: 'end' },
      h('h2', {}, t(won ? 'end.won' : 'end.lost')),
      h('p', { class: 'end-score' }, points, ' ', h('span', { class: 'end-unit' }, t('game.pointsUnit', { count: score.total }))),
      h('div', { class: 'stats' },
        stat(t('end.time'), formatTime(seconds)),
        stat(t('end.mistakes'), String(game.mistakes)),
        stat(t('end.hints'), String(game.hints.length))),
      h('ul', { class: 'breakdown' },
        line('score.groups', score.groupPoints),
        line('score.bravery', score.bravery),
        line('score.time', score.time),
        line('score.clean', score.clean),
        line('score.mistakes', score.mistakes, true),
        line('score.hints', score.hints, true)),
      endNote && h('p', { class: 'end-note' }, endNote(game)),
      session.seedsAdded > 0 && h('p', { class: 'seeds-note' }, t('end.seeds', { count: session.seedsAdded })),
      won && h('button', { class: 'primary', onclick: () => onShare(score.total, seconds, shareNote) }, t('end.share')),
      won && shareNote,
      again && h('button', {
        class: won ? 'secondary' : 'primary',
        onclick: () => { sessions.delete(sessionKey); navigate(location.hash); }
      }, t('end.again')),
      h('button', { class: again || won ? 'secondary' : 'primary', onclick: () => navigate(back) }, backLabel || t('end.back'))
    );
    playArea.replaceChildren(end);
    if (fresh) {
      fadeIn(end);
      countUp(points, score.total, String);
      if (won) confetti();
    } else {
      points.textContent = String(score.total);
    }
  }

  async function onShare(total, seconds, note) {
    const text = t('share.text', {
      name: label,
      points: total,
      time: formatTime(seconds),
      mistakes: game.mistakes === 0 ? t('share.noMistakes') : t('share.mistakes', { count: game.mistakes })
    });
    const url = location.origin + location.pathname;
    const result = await shareText(text, url);
    if (result === 'copied') note.textContent = t('share.copied');
    else if (result === 'manual') {
      note.replaceChildren(t('share.manual'),
        h('textarea', { readonly: true, rows: 3, 'aria-label': t('end.share') }, `${text}\n${url}`));
    }
  }

  // Úklid při odchodu z obrazovky (hra zůstane rozehraná v sessions)
  return function cleanup() {
    timer.pause();
    clearInterval(tick);
    clearTimeout(messageTimer);
    timers.forEach(clearTimeout);
    window.removeEventListener('resize', refit);
    resizeObserver.disconnect();
    document.fonts.removeEventListener('loadingdone', refit);
    document.removeEventListener('visibilitychange', onVisibility);
    // odkrývání po prohře se přerušilo: zbytek se po návratu ukáže hned
    if (game.status === 'lost') game.board = [];
  };
}

function fontScale() {
  return { normal: 1, large: 1.12, xlarge: 1.25 }[getSettings().fontSize] || 1;
}

function clockIcon() {
  const span = document.createElement('span');
  span.innerHTML = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/></svg>';
  return span.firstChild;
}
