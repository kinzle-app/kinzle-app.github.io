// Statistiky z historie her a záloha postupu do souboru.
import { h } from './dom.js';
import { t } from '../services/i18n.js';
import { getProgress } from '../services/progress.js';
import { downloadBackup, readBackupFile } from '../services/backup.js';
import { stats } from '../game/progress.js';
import { formatTime } from '../game/timer.js';
import { openModal } from './modal.js';

export function renderStats(root) {
  const s = stats(getProgress());
  const tile = (value, label) => h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, value), h('span', { class: 'stat-label' }, label));
  const max = Math.max(1, ...s.mistakes);
  const note = h('p', { class: 'share-note', role: 'status' });
  const file = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: onFile });

  root.append(h('div', { class: 'page' },
    h('h2', {}, t('stats.title')),
    h('div', { class: 'stats stats-4' },
      tile(String(s.played), t('stats.played', { count: s.played })),
      tile(`${s.winRate} %`, t('stats.winRate')),
      tile(String(s.bestScore), t('stats.best')),
      tile(s.averageSeconds ? formatTime(s.averageSeconds) : '–', t('stats.average'))),
    h('h3', {}, t('stats.mistakes')),
    h('ul', { class: 'bars' }, s.mistakes.map((count, n) => h('li', {},
      h('span', { class: 'bar-label' }, String(n)),
      h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill', style: `width:${(count / max) * 100}%` })),
      h('span', { class: 'bar-value' }, String(count))))),
    h('h3', {}, t('stats.backup')),
    h('p', { class: 'muted' }, t('stats.backupNote')),
    h('button', { class: 'secondary', onclick: downloadBackup }, t('stats.export')),
    h('button', { class: 'secondary', onclick: () => file.click() }, t('stats.import')),
    file, note));

  async function onFile() {
    const apply = file.files[0] && await readBackupFile(file.files[0]);
    file.value = '';
    if (!apply) {
      note.textContent = t('stats.importInvalid');
      return;
    }
    const close = openModal([
      h('h2', { id: 'import-title' }, t('stats.importTitle')),
      h('p', {}, t('stats.importWarning')),
      h('button', { class: 'primary', onclick: () => { apply(); close(); location.replace('#/'); location.reload(); } }, t('stats.importConfirm')),
      h('button', { class: 'secondary', onclick: () => close() }, t('stats.cancel'))
    ], { labelledBy: 'import-title' });
  }
}
