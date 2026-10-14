// Balíčky: tematické sady hádanek. Zamčený balíček má připravený vzhled (zatím je všechno odemčené).
import { h, icon } from './dom.js';
import { t, getLanguage } from '../services/i18n.js';
import { listPacks } from '../services/content.js';
import { getProgress } from '../services/progress.js';
import { isUnlocked } from '../services/entitlements.js';

// Hádanky balíčku, které hráč v balíčku vyhrál
function wonIn(pack) {
  const won = new Set(getProgress().history.filter((e) => e.mode === 'pack' && e.won).map((e) => e.puzzleId));
  return pack.puzzles.filter((p) => won.has(p.id));
}

export function findPack(id) {
  return listPacks(getLanguage()).find((p) => p.id === id) || null;
}

export function renderPacks(root, { navigate }) {
  const packs = listPacks(getLanguage());
  root.append(h('div', { class: 'page' },
    h('h2', {}, t('packs.title')),
    packs.length ? h('ul', { class: 'pack-list' }, packs.map((pack) => {
      const locked = !isUnlocked(pack.id);
      return h('li', {}, h('button', {
        class: 'pack', 'data-locked': String(locked), disabled: locked,
        onclick: () => navigate(`#/balicek/${pack.id}`)
      },
        h('strong', {}, pack.title, locked ? h('span', { class: 'pack-lock' }, ' ', icon('lock'), ' ', t('packs.locked')) : ''),
        h('span', {}, pack.description),
        h('span', { class: 'muted' }, t('packs.progress', { done: wonIn(pack).length, total: pack.puzzles.length }))));
    })) : h('p', {}, t('packs.empty'))));
}

export function renderPack(root, { navigate, id }) {
  const pack = findPack(id);
  if (!pack || !isUnlocked(pack.id)) {
    location.replace('#/balicky');
    return;
  }
  const won = new Set(wonIn(pack).map((p) => p.id));
  root.append(h('div', { class: 'page' },
    h('h2', {}, pack.title),
    h('p', { class: 'muted' }, pack.description),
    h('ul', { class: 'menu' }, pack.puzzles.map((p, i) => h('li', {}, h('button', { class: 'menu-item', onclick: () => navigate(`#/balicek/${pack.id}/${p.id}`) },
      h('span', {}, t('packs.puzzle', { n: i + 1 })),
      h('span', { class: 'muted' }, won.has(p.id) ? `✓ ${t(`size.${p.size}`)}` : t(`size.${p.size}`))))))));
}
