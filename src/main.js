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
import { getPuzzle, puzzleLabel, dailySchedule, approvedById, currentAct } from './services/content.js';
import { getProgress, recordGame } from './services/progress.js';
import { today } from './services/clock.js';
import { dailyFor } from './game/daily.js';
import { createEntry, dailyEntry } from './game/progress.js';
import { FEEL } from './config/feel.js';
import { applySettings } from './ui/prefs.js';
import { renderDaily } from './ui/daily.js';
import { renderPath, renderNotebook, starsSvg } from './ui/path.js';
import { starsFor, actState } from './game/path.js';
import { renderMore } from './ui/more.js';
import { renderArchive } from './ui/archive.js';
import { renderBag } from './ui/bag.js';
import { renderStats } from './ui/stats.js';
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

// Uložení dohrané hry; vrací počet nových semínek ve váčku
const finisher = (mode, date) => (game, seconds, score) => recordGame(createEntry(game, { mode, date, seconds, score }));

// Obrazovky se záložkami Denní / Cesta / Více
const TAB_SCREENS = { '#/': renderDaily, '#/cesta': renderPath, '#/vice': renderMore };
// Další obrazovky s tlačítkem Zpět
const SCREENS = { '#/archiv': renderArchive, '#/vacek': renderBag, '#/statistiky': renderStats, '#/zapisnik': renderNotebook };

// Denní hádanka (dnešní) nebo starší z archivu: #/denni/YYYY-MM-DD
function renderDailyGame(date) {
  const lang = settings.lang;
  const info = dailyFor(date, dailySchedule(lang), approvedById());
  const isToday = date === today();
  // budoucí den, neexistující hádanka nebo už odehraná dnešní → zpět na úvod (tam je výsledek)
  if (!info.puzzle || date > today() || (isToday && dailyEntry(getProgress(), date))) {
    location.replace('#/');
    return null;
  }
  const mode = isToday ? 'daily' : 'archive';
  return renderGame(app, {
    puzzle: info.puzzle,
    label: t('daily.label', { n: info.number }),
    navigate,
    sessionKey: `${mode}:${date}`,
    onFinish: finisher(mode, date),
    again: !isToday
  });
}

// Úroveň Cesty: #/cesta/<id hádanky>; neznámá úroveň vrátí hráče na plán
function renderPathGame(puzzleId) {
  const act = currentAct(settings.lang);
  const chapter = act?.chapters.find((c) => c.levels.some((l) => l.puzzle === puzzleId));
  const puzzle = getPuzzle(puzzleId);
  const index = chapter ? chapter.levels.findIndex((l) => l.puzzle === puzzleId) : -1;
  const level = index >= 0 && actState(act, getProgress()).chapters.flatMap((c) => c.levels).find((l) => l.puzzle === puzzleId);
  if (!puzzle || !level || level.state === 'locked') {
    location.replace('#/cesta');
    return null;
  }
  return renderGame(app, {
    puzzle,
    label: t('path.level', { n: index + 1 }),
    navigate,
    sessionKey: `path:${puzzleId}`,
    onFinish: finisher('path', today()),
    back: '#/cesta',
    backLabel: t('path.back'),
    endNote: (game) => {
      const stars = starsFor({ won: game.status === 'won', mistakes: game.mistakes, hints: game.hints.length });
      const note = document.createElement('span');
      note.append(starsSvg(stars, 3, 22), ' ', stars ? t('path.earned', { count: stars }) : t('path.notYet'));
      return note;
    }
  });
}

function render() {
  cleanup?.();
  cleanup = null;
  app.replaceChildren();
  document.title = 'Kinzle';

  const route = location.hash || '#/';
  const free = route.match(/^#\/hra\/([\w-]+)$/);
  const daily = route.match(/^#\/denni\/(\d{4}-\d{2}-\d{2})$/);
  const pathLevel = route.match(/^#\/cesta\/([\w-]+)$/);
  const puzzle = free && getPuzzle(free[1]);

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
  } else if (daily) {
    app.append(header(false));
    cleanup = renderDailyGame(daily[1]);
  } else if (pathLevel) {
    app.append(header(false));
    cleanup = renderPathGame(pathLevel[1]);
  } else if (puzzle) {
    app.append(header(false));
    cleanup = renderGame(app, {
      puzzle, label: puzzleLabel(puzzle), navigate, sessionKey: `free:${puzzle.id}`, onFinish: finisher('free', today())
    });
  } else if (SCREENS[route]) {
    app.append(header(false));
    SCREENS[route](app, { navigate });
  } else {
    app.append(header(true));
    cleanup = (TAB_SCREENS[route] || renderDaily)(app, { navigate }) || null;
  }
  if (!isPersistent()) app.append(h('p', { class: 'notice' }, t('app.storageWarning')));
  // nahoru jen při změně obrazovky, ne při překreslení (např. přepnutí v nastavení)
  if (route !== lastRoute) window.scrollTo(0, 0);
  lastRoute = route;
}

window.addEventListener('hashchange', render);
render();
