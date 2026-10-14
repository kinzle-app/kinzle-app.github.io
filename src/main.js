// Vstupní bod aplikace: nastavení, jazyk, stůl a jednoduché přepínání obrazovek přes #adresu.
import '@fontsource/bricolage-grotesque/500.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import './ui/styles/tokens.css';
import './ui/styles/app.css';

import { h, icon } from './ui/dom.js';
import { t, setLanguage, detectLanguage } from './services/i18n.js';
import { getSettings, updateSettings } from './services/settings.js';
import { isPersistent } from './services/storage.js';
import { getPuzzle, listPuzzles } from './services/content.js';
import { setTable } from './ui/theme.js';
import { renderHome } from './ui/home.js';
import { renderGame } from './ui/game.js';
import { openSettings } from './ui/settings.js';

const app = document.getElementById('app');
let cleanup = null;

// Jazyk: uložená volba, jinak podle prohlížeče (a rovnou ji uložíme)
const settings = getSettings();
if (!settings.lang) settings.lang = updateSettings({ lang: detectLanguage() }).lang;
setLanguage(settings.lang);
setTable(settings.table);

// Přechod na obrazovku. Stejná adresa znovu (např. „Hrát znovu“) obrazovku jen překreslí.
function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function header(inGame) {
  return h('header', { class: 'header' },
    h('div', { class: 'brand' },
      h('div', { class: 'logo', 'aria-hidden': 'true' }, h('span'), h('span'), h('span'), h('span')),
      h('h1', {}, 'Kinzle')),
    h('div', { class: 'header-actions' },
      inGame && h('button', { class: 'icon-btn', 'aria-label': t('nav.back'), onclick: () => navigate('#/') }, icon('back')),
      h('button', { class: 'icon-btn', 'aria-label': t('nav.settings'), onclick: () => openSettings({ onChange }) }, icon('settings')))
  );
}

function onChange(changes) {
  const next = updateSettings(changes);
  setTable(next.table);
  if (changes.lang) {
    setLanguage(next.lang);
    // hádanky jsou pro každý jazyk vlastní, proto zpět na výběr
    navigate('#/');
  }
}

function render() {
  cleanup?.();
  cleanup = null;
  app.replaceChildren();
  document.title = 'Kinzle';

  const match = location.hash.match(/^#\/hra\/([\w-]+)$/);
  const puzzle = match && getPuzzle(match[1]);

  if (puzzle) {
    app.append(header(true));
    const number = listPuzzles(puzzle.language).findIndex((p) => p.id === puzzle.id) + 1;
    cleanup = renderGame(app, { puzzle, number, navigate });
  } else {
    app.append(header(false));
    renderHome(app, { navigate });
  }
  if (!isPersistent()) app.append(h('p', { class: 'notice' }, t('app.storageWarning')));
}

window.addEventListener('hashchange', render);
render();
