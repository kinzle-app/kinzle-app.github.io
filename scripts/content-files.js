// Veřejný obsah, který se při sestavení nahraje na web (dist/content/) i s manifestem.
// Návrhy (drafts/) a přehledy ke schválení se nenahrávají.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { contentHash } from '../src/services/content-sync.js';

const LANG_FILES = ['daily.json', 'packs.json', 'path.json', 'story.json', 'news.json'];

// Vrací { 'cs/daily.json': data, ... }
export function publicContent(root = '.') {
  const dir = join(root, 'content');
  const files = {};
  const add = (path) => {
    const file = join(dir, path);
    if (existsSync(file)) files[path] = JSON.parse(readFileSync(file, 'utf8'));
  };
  add('flags.json');
  for (const lang of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    for (const name of LANG_FILES) add(`${lang}/${name}`);
    const puzzles = join(dir, lang, 'puzzles');
    if (existsSync(puzzles)) for (const name of readdirSync(puzzles).filter((n) => n.endsWith('.json'))) add(`${lang}/puzzles/${name}`);
  }
  return files;
}

export function manifestFor(files, version) {
  return { version, files: Object.fromEntries(Object.entries(files).map(([path, data]) => [path, contentHash(data)])) };
}

// Plugin pro Vite: při sestavení přidá obsah a content/manifest.json do dist/
export function contentPlugin(version) {
  return {
    name: 'kinzle-content',
    apply: 'build',
    generateBundle() {
      const files = publicContent();
      for (const [path, data] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName: `content/${path}`, source: JSON.stringify(data) });
      }
      this.emitFile({ type: 'asset', fileName: 'content/manifest.json', source: JSON.stringify(manifestFor(files, version)) });
    }
  };
}
