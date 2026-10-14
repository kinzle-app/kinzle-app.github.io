// Kontrola veškerého obsahu: npm run validate
// Hádanky (formát, složka, id), rozpis denních hádanek (jen schválené, bez opakování, rytmus týdne),
// balíčky, zásoba denních hádanek a texty v src/locales.
// Chyby ukončí skript s kódem 1 (GitHub Actions pak nic nenasadí), varování jen vypíše.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validatePuzzle } from '../src/game/puzzle.js';
import { pragueDate, weekday, addDays, isValidDate } from '../src/game/calendar.js';

export const MIN_DAYS_AHEAD = 14;

// Rytmus týdne: velikost a rozsah úrovně (level) podle dne (0 = neděle)
export const RHYTHM = {
  1: { size: 4, min: 1, max: 2 },
  2: { size: 4, min: 2, max: 3 },
  3: { size: 4, min: 2, max: 4 },
  4: { size: 4, min: 3, max: 4 },
  5: { size: 4, min: 4, max: 5 },
  6: { size: 5, min: 3, max: 5 },
  0: { size: 5, min: 3, max: 5 }
};

const FOLDER_STATUS = { puzzles: ['approved', 'test'], drafts: ['draft'] };

// Čistá funkce kvůli testům. puzzles = [{ file, lang, folder, data }]
export function checkContent({ puzzles, daily, packs, locales, today }) {
  const errors = [];
  const warnings = [];
  const summary = {};
  const byId = new Map();

  for (const { file, lang, folder, data } of puzzles) {
    for (const e of validatePuzzle(data)) errors.push(`${file}: ${e}`);
    if (!data?.id) continue;
    if (byId.has(data.id)) errors.push(`${file}: id ${data.id} už má jiná hádanka`);
    byId.set(data.id, data);
    if (!file.endsWith(`${data.id}.json`)) errors.push(`${file}: název souboru neodpovídá id ${data.id}`);
    if (data.language !== lang) errors.push(`${file}: jazyk ${data.language} neodpovídá složce ${lang}`);
    if (!FOLDER_STATUS[folder].includes(data.status)) errors.push(`${file}: stav ${data.status} nepatří do složky ${folder}/`);
  }

  // hádanka použitelná v rozpisu nebo balíčku: existuje, je schválená a ve správném jazyce
  const usable = (id, lang, where) => {
    const p = byId.get(id);
    if (!p) errors.push(`${where}: hádanka ${id} neexistuje`);
    else if (p.status !== 'approved') errors.push(`${where}: hádanka ${id} není schválená (${p.status})`);
    else if (p.language !== lang) errors.push(`${where}: hádanka ${id} je v jiném jazyce`);
    else return p;
    return null;
  };

  for (const [lang, schedule] of Object.entries(daily)) {
    const used = new Map();
    for (const [date, id] of Object.entries(schedule)) {
      const where = `${lang}/daily.json ${date}`;
      if (!isValidDate(date)) errors.push(`${where}: neplatné datum`);
      if (used.has(id)) errors.push(`${where}: hádanka ${id} už je ${used.get(id)}`);
      used.set(id, date);
      const p = usable(id, lang, where);
      if (!p || !isValidDate(date)) continue;
      const rule = RHYTHM[weekday(date)];
      if (p.size !== rule.size) errors.push(`${where}: rytmus týdne chce velikost ${rule.size}×4, hádanka má ${p.size}×4`);
      if (p.level < rule.min || p.level > rule.max) {
        errors.push(`${where}: rytmus týdne chce úroveň ${rule.min}–${rule.max}, hádanka má ${p.level}`);
      }
    }
    // zásoba: kolik dní ode dneška je naplánováno bez mezery
    let daysAhead = 0;
    while (schedule[addDays(today, daysAhead)]) daysAhead += 1;
    const all = puzzles.filter((x) => x.lang === lang);
    summary[lang] = {
      approved: all.filter((x) => x.data?.status === 'approved').length,
      drafts: all.filter((x) => x.data?.status === 'draft').length,
      daysAhead
    };
    if (daysAhead < MIN_DAYS_AHEAD) warnings.push(`${lang}: denní hádanky jsou naplánované jen na ${daysAhead} dní dopředu (méně než ${MIN_DAYS_AHEAD})`);
  }

  for (const [lang, list] of Object.entries(packs)) {
    for (const pack of list) {
      const where = `${lang}/packs.json ${pack.id}`;
      for (const field of ['id', 'title', 'description']) if (!pack[field]) errors.push(`${where}: chybí ${field}`);
      if (typeof pack.price !== 'number') errors.push(`${where}: price musí být číslo`);
      if (typeof pack.locked !== 'boolean') errors.push(`${where}: locked musí být true/false`);
      if (!Array.isArray(pack.puzzles) || pack.puzzles.length === 0) errors.push(`${where}: prázdný seznam hádanek`);
      else pack.puzzles.forEach((id) => usable(id, lang, where));
    }
  }

  for (const [lang, messages] of Object.entries(locales)) errors.push(...checkLocale(lang, messages));

  return { errors, warnings, summary };
}

// Texty: rovné uvozovky v češtině a úplné tvary množného čísla
export function checkLocale(lang, messages) {
  const errors = [];
  const categories = new Intl.PluralRules(lang).resolvedOptions().pluralCategories;
  const walk = (obj, path) => {
    for (const [key, value] of Object.entries(obj)) {
      const where = `src/locales/${lang}.json ${path}${key}`;
      if (typeof value === 'string') {
        if (lang === 'cs' && value.includes('"')) errors.push(`${where}: rovné uvozovky, v češtině patří „takhle“`);
      } else if ('other' in value) {
        const missing = categories.filter((c) => !(c in value));
        if (missing.length) errors.push(`${where}: chybí tvary množného čísla ${missing.join(', ')}`);
      } else {
        walk(value, `${path}${key}.`);
      }
    }
  };
  walk(messages, '');
  return errors;
}

// ---------- spuštění z příkazové řádky ----------
function readJson(file, fallback) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback;
}

function loadAll(root = '.') {
  const contentDir = join(root, 'content');
  const langs = readdirSync(contentDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const puzzles = [];
  const daily = {};
  const packs = {};
  for (const lang of langs) {
    for (const folder of ['puzzles', 'drafts']) {
      const dir = join(contentDir, lang, folder);
      if (!existsSync(dir)) continue;
      for (const name of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
        const file = join(dir, name);
        let data;
        try {
          data = JSON.parse(readFileSync(file, 'utf8'));
        } catch {
          data = null; // validatePuzzle nahlásí
        }
        puzzles.push({ file, lang, folder, data });
      }
    }
    daily[lang] = readJson(join(contentDir, lang, 'daily.json'), {});
    packs[lang] = readJson(join(contentDir, lang, 'packs.json'), []);
  }
  const locales = {};
  for (const name of readdirSync(join(root, 'src', 'locales'))) {
    locales[name.replace('.json', '')] = readJson(join(root, 'src', 'locales', name));
  }
  return { puzzles, daily, packs, locales, today: pragueDate() };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { errors, warnings, summary } = checkContent(loadAll());
  for (const [lang, s] of Object.entries(summary)) {
    console.log(`${lang}: ${s.approved} schválených, ${s.drafts} ke schválení, denní hádanky na ${s.daysAhead} dní dopředu`);
  }
  for (const w of warnings) console.warn(`⚠ ${w}`);
  for (const e of errors) console.error(`✗ ${e}`);
  if (errors.length) {
    console.error(`\nNalezeno chyb: ${errors.length}`);
    process.exit(1);
  }
  console.log('\n✓ Obsah je v pořádku.');
}
