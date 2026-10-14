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
import { FEEL } from './config/feel.js';
import { applySettings } from './ui/prefs.js';
import { renderHome } from './ui/home.js';
import { renderGame } from './ui/game.js';
import { renderSettings } from './ui/settings.js';
import { renderHelp } from './ui/help.js';

const app = document.getElementById('app');
let cleanup = null;
let lastRoute = null;

// Jazyk: uložená volba, jinak podle prohlížeče (a rovnou ji uložíme)
let settings = getSettings();
if (!settings.lang) settings = updateSettings({ lang: detectLanguage() });
setLanguage(settings.lang);
applySettings(settings);

// rychlost zamáčknutí kostičky z feel.js
document.documentElement.style.setProperty('--press', FEEL.tilePress + 'ms');
document.documentElement.style.setProperty('--release', FEEL.tileRelease + 'ms');

// Přechod na obrazovku. Stejná adresa znovu (např. „Hrát znovu“) obrazovku jen překreslí.
// Hloubka v historii si pamatuje každý záznam, takže funguje i systémové Zpět.
function navigate(hash) {
  if (location.hash !== hash) history.pushState({ depth: depth() + 1 }, '', hash);
  render();
}

function depth() {
  return history.state?.depth || 0;
}

// Zpět: uvnitř aplikace jako systémové Zpět, jinak (např. po otevření odkazu) na úvodní obrazovku
function goBack() {
  if (depth() > 0) history.back();
  else location.replace('#/');
}

function header(isHome) {
  const button = (name, label, onclick) => h('button', { class: 'icon-btn', 'aria-label': label, onclick }, icon(name));
  return h('header', { class: 'header' },
    h('div', { class: 'brand' },
      !isHome && button('back', t('nav.back'), goBack),
      h('div', { class: 'logo', 'aria-hidden': 'true' }, h('span'), h('span'), h('span'), h('span')),
      h('h1', {}, 'Kinzle')),
    h('div', { class: 'header-actions' },
      button('help', t('nav.help'), () => navigate('#/navod')),
      button('settings', t('nav.settings'), () => navigate('#/nastaveni')))
  );
}

function onChange(changes) {
  settings = updateSettings(changes);
  if (changes.lang) setLanguage(settings.lang);
  applySettings(settings);
  render();
}

function render() {
  cleanup?.();
  cleanup = null;
  app.replaceChildren();
  document.title = 'Kinzle';

  const route = location.hash;
  const game = route.match(/^#\/hra\/([\w-]+)$/);
  const puzzle = game && getPuzzle(game[1]);

  if (!settings.onboarded && route !== '#/navod') {
    location.replace('#/navod');
    return;
  }

  if (route === '#/navod') {
    renderHelp(app, {
      onDone: () => {
        if (!settings.onboarded) {
          settings = updateSettings({ onboarded: true });
          location.replace('#/');
        } else goBack();
      }
    });
  } else if (route === '#/nastaveni') {
    app.append(header(false));
    renderSettings(app, { onChange, navigate });
  } else if (puzzle) {
    app.append(header(false));
    const number = listPuzzles(puzzle.language).findIndex((p) => p.id === puzzle.id) + 1;
    cleanup = renderGame(app, { puzzle, number, navigate });
  } else {
    app.append(header(true));
    renderHome(app, { navigate });
  }
  if (!isPersistent()) app.append(h('p', { class: 'notice' }, t('app.storageWarning')));
  // nahoru jen při změně obrazovky, ne při překreslení (např. přepnutí v nastavení)
  if (route !== lastRoute) window.scrollTo(0, 0);
  lastRoute = route;
}

window.addEventListener('hashchange', render);
render();
