// Kontrola veškerého obsahu: npm run validate
// Hádanky (formát, složka, id), rozpis denních hádanek (jen schválené, bez opakování, rytmus týdne),
// balíčky, zásoba denních hádanek a texty v src/locales.
// Chyby ukončí skript s kódem 1 (GitHub Actions pak nic nenasadí), varování jen vypíše.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validatePuzzle } from '../src/game/puzzle.js';
import { pragueDate, weekday, addDays, isValidDate } from '../src/game/calendar.js';
import { RHYTHM } from '../src/config/rhythm.js';
import { tiersOf } from '../src/config/tiers.js';

export const MIN_DAYS_AHEAD = 14;


const FOLDER_STATUS = { puzzles: ['approved', 'test'], drafts: ['draft'] };

// Čistá funkce kvůli testům. puzzles = [{ file, lang, folder, data }]
export function checkContent({ puzzles, daily, packs, locales, today, paths = {}, stories = {}, news = {} }) {
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
  // (návrh balíčku "draft": true smí obsahovat i návrhy – ukazuje se jen ve vývojové verzi)
  const usable = (id, lang, where, allowDraft = false) => {
    const p = byId.get(id);
    if (!p) errors.push(`${where}: hádanka ${id} neexistuje`);
    else if (p.status !== 'approved' && !(allowDraft && p.status === 'draft')) errors.push(`${where}: hádanka ${id} není schválená (${p.status})`);
    else if (p.language !== lang) errors.push(`${where}: hádanka ${id} je v jiném jazyce`);
    else return p;
    return null;
  };

  // Rozpisy denních hádanek: jazyk s úrovněmi má v daily.json rozpis pro každou úroveň ({ easy: {…}, … })
  const schedulesOf = (lang, file) => {
    const tiers = tiersOf(lang);
    if (!tiers.length) return [[null, file]];
    for (const key of Object.keys(file)) if (!tiers.includes(key)) errors.push(`${lang}/daily.json: neznámá úroveň ${key}`);
    return tiers.map((tier) => [tier, file[tier] || {}]);
  };

  for (const [lang, file] of Object.entries(daily)) {
    const used = new Map();
    let daysAheadMin = Infinity;
    for (const [tier, schedule] of schedulesOf(lang, file)) {
      const label = tier ? `${lang} ${tier}` : lang;
      for (const [date, id] of Object.entries(schedule)) {
        const where = `${lang}/daily.json ${tier ? tier + ' ' : ''}${date}`;
        if (!isValidDate(date)) errors.push(`${where}: neplatné datum`);
        if (used.has(id)) errors.push(`${where}: hádanka ${id} už je ${used.get(id)}`);
        used.set(id, date);
        const p = usable(id, lang, where);
        if (!p || !isValidDate(date)) continue;
        if (tier && p.tier !== tier) errors.push(`${where}: hádanka ${id} má úroveň ${p.tier}, ne ${tier}`);
        const rule = RHYTHM[weekday(date)];
        if (p.size !== rule.size) errors.push(`${where}: rytmus týdne chce velikost ${rule.size}×4, hádanka má ${p.size}×4`);
        if (p.level < rule.min || p.level > rule.max) {
          errors.push(`${where}: rytmus týdne chce úroveň ${rule.min}–${rule.max}, hádanka má ${p.level}`);
        }
      }
      // zásoba: kolik dní ode dneška je naplánováno bez mezery
      let daysAhead = 0;
      while (schedule[addDays(today, daysAhead)]) daysAhead += 1;
      daysAheadMin = Math.min(daysAheadMin, daysAhead);
      if (daysAhead < MIN_DAYS_AHEAD) warnings.push(`${label}: denní hádanky jsou naplánované jen na ${daysAhead} dní dopředu (méně než ${MIN_DAYS_AHEAD})`);
    }
    const all = puzzles.filter((x) => x.lang === lang);
    summary[lang] = {
      approved: all.filter((x) => x.data?.status === 'approved').length,
      drafts: all.filter((x) => x.data?.status === 'draft').length,
      daysAhead: daysAheadMin
    };
  }

  for (const [lang, list] of Object.entries(packs)) {
    for (const pack of list) {
      const where = `${lang}/packs.json ${pack.id}`;
      for (const field of ['id', 'title', 'description']) if (!pack[field]) errors.push(`${where}: chybí ${field}`);
      if (typeof pack.price !== 'number') errors.push(`${where}: price musí být číslo`);
      if (typeof pack.locked !== 'boolean') errors.push(`${where}: locked musí být true/false`);
      if (tiersOf(lang).length && !tiersOf(lang).includes(pack.tier)) errors.push(`${where}: chybí nebo neplatná úroveň (tier) ${pack.tier}`);
      if (!Array.isArray(pack.puzzles) || pack.puzzles.length === 0) errors.push(`${where}: prázdný seznam hádanek`);
      else pack.puzzles.forEach((id) => usable(id, lang, where, pack.draft === true));
    }
  }

  // „Co je nového“: id, nadpis a 1–3 body
  for (const [lang, list] of Object.entries(news)) {
    if (!Array.isArray(list)) {
      errors.push(`${lang}/news.json: musí být seznam`);
      continue;
    }
    const ids = new Set();
    for (const item of list) {
      const where = `${lang}/news.json ${item?.id}`;
      if (!item?.id || !item.title) errors.push(`${where}: chybí id nebo title`);
      if (ids.has(item?.id)) errors.push(`${where}: id už existuje`);
      ids.add(item?.id);
      if (!Array.isArray(item?.items) || item.items.length < 1 || item.items.length > 3 || !item.items.every((x) => typeof x === 'string' && x)) {
        errors.push(`${where}: items musí mít 1–3 texty`);
      }
      if (lang === 'cs' && JSON.stringify(item).includes('\\"')) errors.push(`${where}: rovné uvozovky, v češtině patří „takhle“`);
    }
  }

  // Cesta: jen schválené hádanky, každá jednou, žádná z rozpisu denních (aby si hráč denní nevyzradil)
  for (const [lang, path] of Object.entries(paths)) {
    const used = new Set();
    const chapterIds = new Set();
    for (const act of path.acts || []) {
      for (const chapter of act.chapters || []) {
        const where = `${lang}/path.json kapitola ${chapter.id}`;
        if (chapterIds.has(chapter.id)) errors.push(`${where}: id kapitoly už existuje`);
        chapterIds.add(chapter.id);
        if (!chapter.levels?.length) errors.push(`${where}: kapitola nemá žádné úrovně`);
        if (!stories[lang]?.chapters?.[chapter.id]?.title) errors.push(`${where}: chybí název v ${lang}/story.json`);
        for (const level of chapter.levels || []) {
          if (used.has(level.puzzle)) errors.push(`${where}: hádanka ${level.puzzle} je na Cestě dvakrát`);
          used.add(level.puzzle);
          usable(level.puzzle, lang, where);
          if (schedulesOf(lang, daily[lang] || {}).some(([, s]) => Object.values(s).includes(level.puzzle))) errors.push(`${where}: hádanka ${level.puzzle} je i v rozpisu denních hádanek`);
        }
      }
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
  const paths = {};
  const stories = {};
  const news = {};
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
    paths[lang] = readJson(join(contentDir, lang, 'path.json'), { acts: [] });
    stories[lang] = readJson(join(contentDir, lang, 'story.json'), {});
    news[lang] = readJson(join(contentDir, lang, 'news.json'), []);
  }
  const locales = {};
  for (const name of readdirSync(join(root, 'src', 'locales'))) {
    locales[name.replace('.json', '')] = readJson(join(root, 'src', 'locales', name));
  }
  return { puzzles, daily, packs, locales, paths, stories, news, today: pragueDate() };
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
