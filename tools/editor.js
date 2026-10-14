// Editor hádanek (jen lokálně: npm run editor). Formulář, živý náhled ve stylu hry,
// kontrola pravidel a uložení jako JSON.
import '@fontsource/bricolage-grotesque/500.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '../src/ui/styles/tokens.css';
import '../src/ui/styles/app.css';
import { h, fitText } from '../src/ui/dom.js';
import { validatePuzzle } from '../src/game/puzzle.js';
import { pragueDate } from '../src/game/calendar.js';

const SYMBOLS = { 1: '●', 2: '▲', 3: '■', 4: '◆', 5: '★' };

// všechna existující id (kvůli návrhu dalšího volného a kontrole duplicit)
const existing = Object.values(import.meta.glob('/content/*/{puzzles,drafts}/*.json', { eager: true, import: 'default' }));

const form = document.getElementById('form');
const groupsEl = document.getElementById('groups');
const problemsEl = document.getElementById('problems');
const board = document.getElementById('board');
const solved = document.getElementById('solved');
let loadedId = null; // při úpravě existující hádanky její id není duplicita

document.documentElement.style.setProperty('--press', '80ms');
document.documentElement.style.setProperty('--release', '120ms');

function nextId(lang) {
  const numbers = existing.filter((p) => p.language === lang).map((p) => Number(p.id.split('-')[1]) || 0);
  return `${lang}-${String(Math.max(0, ...numbers) + 1).padStart(4, '0')}`;
}

function renderGroupFields(size, values = []) {
  groupsEl.replaceChildren(...Array.from({ length: size }, (_, i) => {
    const g = values[i] || {};
    return h('fieldset', {},
      h('legend', {}, `${SYMBOLS[i + 1]} Skupina obtížnosti ${i + 1}`),
      h('label', {}, 'Přesný název skupiny', h('input', { name: `title${i}`, value: g.title || '' })),
      h('div', { class: 'words' }, [0, 1, 2, 3].map((w) =>
        h('input', { name: `word${i}-${w}`, value: g.words?.[w] || '', 'aria-label': `Slovo ${w + 1}` }))),
      h('label', {}, 'Vysvětlení nebo ověřená zajímavost', h('textarea', { name: `explanation${i}` }, g.explanation || ''))
    );
  }));
}

function readPuzzle() {
  const f = new FormData(form);
  const size = Number(f.get('size'));
  const puzzle = {
    id: f.get('id').trim(),
    language: f.get('language'),
    size,
    level: Number(f.get('level')),
    status: 'draft',
    author: 'Kinzle',
    createdAt: pragueDate()
  };
  if (f.get('teaser').trim()) puzzle.teaser = f.get('teaser').trim();
  puzzle.groups = Array.from({ length: size }, (_, i) => ({
    title: f.get(`title${i}`)?.trim() || '',
    difficulty: i + 1,
    words: [0, 1, 2, 3].map((w) => f.get(`word${i}-${w}`)?.trim().toLocaleLowerCase(puzzle.language) || ''),
    explanation: f.get(`explanation${i}`)?.trim() || ''
  }));
  return puzzle;
}

function update() {
  const p = readPuzzle();
  const problems = validatePuzzle(p);
  if (p.id && p.id !== loadedId && existing.some((x) => x.id === p.id)) problems.push(`id ${p.id} už existuje`);
  if (p.id && !p.id.startsWith(`${p.language}-`)) problems.push(`id má začínat „${p.language}-“`);
  problemsEl.className = problems.length ? 'problems' : 'problems ok';
  problemsEl.replaceChildren(...(problems.length ? problems : ['✓ Formát je v pořádku. Teď ověřovací postup z pravidel.']).map((t) => h('li', {}, t)));

  // náhled: kostičky ve stejné velikosti jako na mobilu (šířka 390 px)
  document.documentElement.lang = p.language;
  const words = p.groups.flatMap((g) => g.words).filter(Boolean);
  board.replaceChildren(...words.map((w) => h('button', { class: 'tile', type: 'button', 'data-word': w }, h('span', {}, w))));
  board.querySelectorAll('.tile').forEach((tile) => fitText(tile));
  solved.replaceChildren(...p.groups.map((g) => h('div', { class: 'group', 'data-d': g.difficulty, 'aria-expanded': 'true' },
    h('span', { class: 'group-title' }, `${SYMBOLS[g.difficulty]} ${g.title}`),
    h('span', { class: 'group-words' }, g.words.join(' · ')),
    h('span', { class: 'group-note' }, g.explanation))));
}

function load(p) {
  loadedId = p.id;
  for (const name of ['language', 'id', 'size', 'level']) form.elements[name].value = p[name];
  form.elements.teaser.value = p.teaser || '';
  renderGroupFields(p.size, p.groups);
  update();
}

async function save(event) {
  event.preventDefault();
  const p = readPuzzle();
  const json = JSON.stringify(p, null, 2) + '\n';
  const name = `${p.id || 'hadanka'}.json`;
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: name, types: [{ accept: { 'application/json': ['.json'] } }] });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const link = h('a', { href: URL.createObjectURL(new Blob([json], { type: 'application/json' })), download: name });
  link.click();
}

form.addEventListener('input', (e) => {
  if (e.target.name === 'size') renderGroupFields(Number(e.target.value), readPuzzle().groups);
  if (e.target.name === 'language' && !loadedId) form.elements.id.value = nextId(e.target.value);
  update();
});
form.addEventListener('submit', save);
document.getElementById('open').addEventListener('click', () => document.getElementById('file').click());
document.getElementById('file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) load(JSON.parse(await file.text()));
});

form.elements.id.value = nextId('cs');
renderGroupFields(4);
update();
document.fonts.ready.then(update);
