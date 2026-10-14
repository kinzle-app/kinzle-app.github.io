import { describe, it, expect } from 'vitest';
import { contentHash, activeContent, syncContent } from '../src/services/content-sync.js';
import { publicContent, manifestFor } from '../scripts/content-files.js';

const bundled = { version: '2026-10-01', files: { 'cs/daily.json': { a: 1 }, 'cs/puzzles/x.json': { id: 'x' } } };

// Web jako slovník souborů; zapisuje, co se stahovalo
function web(files, version) {
  const all = { ...files, 'manifest.json': manifestFor(files, version) };
  const fetched = [];
  const fetchJson = async (path) => {
    fetched.push(path);
    if (!(path in all)) throw new Error('404');
    return all[path];
  };
  return { fetchJson, fetched };
}

describe('stahování obsahu', () => {
  it('stejná verze na webu: nic se nestahuje', async () => {
    const { fetchJson, fetched } = web(bundled.files, bundled.version);
    expect(await syncContent(bundled, null, fetchJson)).toBeNull();
    expect(fetched).toEqual(['manifest.json']);
  });

  it('novější verze: stáhne jen změněné a nové soubory', async () => {
    const files = { 'cs/daily.json': { a: 2 }, 'cs/puzzles/x.json': { id: 'x' }, 'cs/puzzles/y.json': { id: 'y' } };
    const { fetchJson, fetched } = web(files, '2026-10-05');
    const stored = await syncContent(bundled, null, fetchJson);
    expect(fetched.sort()).toEqual(['cs/daily.json', 'cs/puzzles/y.json', 'manifest.json']);
    expect(Object.keys(stored.data).sort()).toEqual(['cs/daily.json', 'cs/puzzles/y.json']);
    expect(activeContent(bundled, stored)).toEqual({ version: '2026-10-05', files });
  });

  it('soubor smazaný na webu zmizí i ze hry', async () => {
    const { fetchJson } = web({ 'cs/daily.json': { a: 1 } }, '2026-10-05');
    const stored = await syncContent(bundled, null, fetchJson);
    expect(Object.keys(activeContent(bundled, stored).files)).toEqual(['cs/daily.json']);
  });

  it('bez internetu nebo s poškozeným souborem zůstane dosavadní obsah', async () => {
    await expect(syncContent(bundled, null, async () => { throw new Error('offline'); })).rejects.toThrow();
    const { fetchJson } = web({ 'cs/daily.json': { a: 2 } }, '2026-10-05');
    const broken = async (path) => (path === 'manifest.json' ? fetchJson(path) : { a: 'jiný obsah' });
    await expect(syncContent(bundled, null, broken)).rejects.toThrow(/neodpovídá/);
  });

  it('nová verze aplikace se zabaleným novějším obsahem má přednost před starším staženým', () => {
    const stored = { version: '2026-10-05', hashes: { 'cs/daily.json': contentHash({ a: 9 }) }, data: { 'cs/daily.json': { a: 9 } } };
    const newer = { ...bundled, version: '2026-10-10' };
    expect(activeContent(newer, stored)).toBe(newer);
    expect(activeContent(bundled, stored).files).toEqual({ 'cs/daily.json': { a: 9 } });
  });

  it('podruhé se už stažené soubory znovu nestahují', async () => {
    const files = { 'cs/daily.json': { a: 2 }, 'cs/puzzles/x.json': { id: 'x' } };
    const first = await syncContent(bundled, null, web(files, '2026-10-05').fetchJson);
    const { fetchJson, fetched } = web({ ...files, 'cs/puzzles/z.json': { id: 'z' } }, '2026-10-06');
    await syncContent(bundled, first, fetchJson);
    expect(fetched.sort()).toEqual(['cs/puzzles/z.json', 'manifest.json']);
  });
});

describe('veřejný obsah na web', () => {
  it('obsahuje schválené hádanky, rozpis a přepínače, ale ne návrhy', () => {
    const paths = Object.keys(publicContent());
    expect(paths).toContain('flags.json');
    expect(paths).toContain('cs/daily.json');
    expect(paths).toContain('cs/puzzles/cs-0001.json');
    expect(paths.some((p) => p.includes('drafts'))).toBe(false);
  });
});
