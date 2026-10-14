// Panel testovacího režimu (#/debug, jen s ?debug). Posun hodin, simulace offline, vynulování,
// naplnění váčku, odemčení Cesty, repríza a „Co je nového“. Další volby přibudou s dalšími fázemi.
// Texty panelu jsou jen česky – je to nástroj pro autora, hráč ho nevidí.
import { h } from './dom.js';
import { getLanguage } from '../services/i18n.js';
import { today } from '../services/clock.js';
import { debugOptions, setDebugOptions } from '../services/debug.js';
import { contentVersion, clearDownloadedContent, currentAct, dailySchedule, latestNews } from '../services/content.js';
import { getProgress, updateProgress, replaceProgress } from '../services/progress.js';
import { emptyProgress } from '../game/progress.js';
import { addDays } from '../game/calendar.js';
import { showNews } from './news.js';

// Přenačte hru s jinými parametry adresy (?debug zůstává), obrazovka podle # zůstane
function reload(params = {}) {
  const query = new URLSearchParams({ debug: '', ...params }).toString().replace('debug=', 'debug');
  location.search = '?' + query;
}

const entry = (puzzleId, mode, solved = []) => ({
  puzzleId, mode, date: today(), won: true, score: 0, seconds: 60, mistakes: 0, hints: 0, solved, finishedAt: new Date().toISOString()
});

export function renderDebug(root) {
  const lang = getLanguage();
  const status = h('p', { class: 'muted', role: 'status' });
  const done = (text) => (status.textContent = text);
  const button = (label, onclick) => h('button', { class: 'secondary', onclick }, label);

  // ---------- hodiny ----------
  const dateInput = h('input', { type: 'date', value: today(), 'aria-label': 'Datum' });
  const timeInput = h('input', { type: 'time', value: '23:59', 'aria-label': 'Čas' });
  const dates = Object.keys(dailySchedule(lang)).sort();

  // ---------- Cesta ----------
  const act = currentAct(lang);
  const levels = act ? act.chapters.flatMap((c, ci) => c.levels.map((l, li) => ({ ...l, label: `Kapitola ${ci + 1}, úroveň ${li + 1}` }))) : [];
  const levelSelect = h('select', { 'aria-label': 'Úroveň' }, levels.map((l, i) => h('option', { value: String(i) }, l.label)));

  const seedInput = h('input', { type: 'number', min: '1', max: '500', value: '20', 'aria-label': 'Počet semínek' });
  const offline = debugOptions().offline;

  root.append(h('div', { class: 'page' },
    h('h2', {}, 'Testovací režim'),
    h('p', { class: 'muted' }, `Dnes ve hře: ${today()} · obsah verze ${contentVersion()}`),
    status,

    h('h3', {}, 'Datum a čas'),
    h('div', { class: 'debug-row' }, dateInput, timeInput,
      button('Nastavit', () => reload({ datum: dateInput.value, cas: timeInput.value })),
      button('Skutečný čas', () => reload())),
    h('div', { class: 'debug-row' },
      dates.length > 0 && button('Den s reprízou', () => reload({ datum: addDays(dates.at(-1), 1) })),
      latestNews(lang) && button('Ukázat „Co je nového“', () => showNews(latestNews(lang)))),

    h('h3', {}, 'Obsah z webu'),
    h('div', { class: 'debug-row' },
      button(offline ? 'Simulace offline: zapnutá' : 'Simulace offline: vypnutá', () => {
        setDebugOptions({ offline: !offline });
        reload();
      }),
      button('Smazat stažený obsah', () => {
        clearDownloadedContent();
        done('Stažený obsah smazán, po dalším spuštění se hraje se zabalenou kopií.');
      })),

    h('h3', {}, 'Postup'),
    levels.length > 0 && h('div', { class: 'debug-row' }, levelSelect, button('Odemknout až sem', () => {
      const before = levels.slice(0, Number(levelSelect.value)).map((l) => l.puzzle);
      updateProgress((p) => ({ history: [...p.history, ...before.filter((id) => !p.history.some((e) => e.mode === 'path' && e.won && e.puzzleId === id)).map((id) => entry(id, 'path'))] }));
      done('Úrovně před vybranou jsou dohrané za 3 hvězdy.');
    })),
    h('div', { class: 'debug-row' }, seedInput, button('Přidat semínka', () => {
      const count = Math.min(500, Math.max(1, Number(seedInput.value) || 0));
      const start = getProgress().history.length;
      const games = [];
      for (let i = 0; i < count; i += 5) {
        const solved = [1, 2, 3, 4, 5].slice(0, Math.min(5, count - i)).map((d) => ({ title: `Testovací skupina ${d}`, words: ['a', 'b', 'c', 'd'], difficulty: d }));
        games.push(entry(`debug-${start + i}`, 'free', solved));
      }
      updateProgress((p) => ({ history: [...p.history, ...games] }));
      done(`Přidáno ${count} semínek (jako testovací hry ve Volné hře).`);
    })),
    h('div', { class: 'debug-row' }, button('Vynulovat postup', () => {
      if (!confirm('Smazat celý postup (historii, váček, Cestu, zápisník)?')) return;
      replaceProgress(emptyProgress());
      done('Postup vynulován.');
    }))
  ));
}
