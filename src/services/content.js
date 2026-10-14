// Obsah hry (hádanky, rozpis denních, Cesta, příběh, balíčky, novinky, přepínače) – jediné místo, kde se řeší jeho zdroj.
// Kopie obsahu je zabalená přímo v aplikaci (funguje offline i při prvním spuštění).
// Novější obsah z webu (content/manifest.json) se stáhne na pozadí a použije se při dalším spuštění.
import { validatePuzzle } from '../game/puzzle.js';
import { t } from './i18n.js';
import { load, save } from './storage.js';
import { activeContent, syncContent } from './content-sync.js';
import { CONTENT_URL } from '../config/remote.js';

const STORE_KEY = 'content';

// Zabalená kopie: klíče jako v manifestu ('cs/puzzles/cs-0001.json')
const bundledFiles = Object.fromEntries(Object.entries({
  ...import.meta.glob('/content/*/puzzles/*.json', { eager: true, import: 'default' }),
  ...import.meta.glob('/content/*/{daily,packs,path,story,news}.json', { eager: true, import: 'default' }),
  ...import.meta.glob('/content/flags.json', { eager: true, import: 'default' })
}).map(([path, data]) => [path.slice('/content/'.length), data]));
const bundled = { version: __CONTENT_VERSION__, files: bundledFiles };

const active = activeContent(bundled, load(STORE_KEY, null));
const files = active.files;

// Návrhy ke schválení jen ve vývojové verzi (npm run dev), aby je šlo vyzkoušet; do nasazené hry se nedostanou
const drafts = import.meta.env.DEV ? import.meta.glob('/content/*/drafts/*.json', { eager: true, import: 'default' }) : {};

// Poškozená hádanka se přeskočí, hra kvůli ní nespadne
const puzzles = [
  ...Object.entries(files).filter(([path]) => path.includes('/puzzles/')).map(([, data]) => data),
  ...Object.values(drafts)
].filter((p) => {
  const errors = validatePuzzle(p);
  if (errors.length) console.warn(`Hádanka ${p?.id} přeskočena:`, errors);
  return errors.length === 0;
});

const langFile = (lang, name, fallback) => files[`${lang}/${name}`] ?? fallback;

// Verze obsahu, se kterou se hraje (testovací režim ji ukazuje)
export function contentVersion() {
  return active.version;
}

// Přepínače funkcí (content/flags.json)
export function flags() {
  return files['flags.json'] || {};
}

// Kontrola nového obsahu na webu; vrací true, když se něco stáhlo (použije se při dalším spuštění)
export async function updateContent() {
  const fetchJson = async (path) => {
    const res = await fetch(CONTENT_URL + path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return res.json();
  };
  try {
    const next = await syncContent(bundled, load(STORE_KEY, null), fetchJson);
    if (next) save(STORE_KEY, next);
    return Boolean(next);
  } catch (e) {
    console.info('Obsah z webu se nepodařilo zkontrolovat, hraje se s tím, co je v zařízení.', e.message);
    return false;
  }
}

// Smaže stažený obsah (testovací režim); při dalším spuštění se hraje se zabalenou kopií
export function clearDownloadedContent() {
  save(STORE_KEY, null);
}

export function listPuzzles(lang) {
  return puzzles.filter((p) => p.language === lang).sort((a, b) => a.id.localeCompare(b.id));
}

// Název hádanky v seznamu a v liště: návrh podle id, jinak pořadí v seznamu
export function puzzleLabel(puzzle) {
  if (puzzle.status === 'draft') return t('home.draft', { id: puzzle.id });
  return t('home.puzzle', { n: listPuzzles(puzzle.language).filter((p) => p.status !== 'draft').indexOf(puzzle) + 1 });
}

// Aktuální dějství (hráč vidí jen jedno) a jeho texty z path.json a story.json
export function currentAct(lang) {
  const act = langFile(lang, 'path.json', {}).acts?.at(-1);
  if (!act?.chapters?.length) return null;
  const story = langFile(lang, 'story.json', {});
  return { ...act, story: story.acts?.[act.id] || {}, chapterStory: (id) => story.chapters?.[id] || {} };
}

// Rozpis denních hádanek a schválené hádanky pro výběr denní hádanky
export function dailySchedule(lang) {
  return langFile(lang, 'daily.json', {});
}

// Balíčky s hádankami, které jdou hrát. Návrh balíčku ("draft": true) jen ve vývojové verzi.
export function listPacks(lang) {
  return langFile(lang, 'packs.json', [])
    .filter((pack) => !pack.draft || import.meta.env.DEV)
    .map((pack) => ({ ...pack, puzzles: pack.puzzles.map(getPuzzle).filter(Boolean) }))
    .filter((pack) => pack.puzzles.length);
}

// Nejnovější „Co je nového“ (první položka v news.json), nebo null
export function latestNews(lang) {
  return langFile(lang, 'news.json', [])[0] || null;
}

export function approvedById() {
  return new Map(puzzles.filter((p) => p.status === 'approved').map((p) => [p.id, p]));
}

export function getPuzzle(id) {
  return puzzles.find((p) => p.id === id) || null;
}
