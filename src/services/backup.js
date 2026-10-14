// Záloha postupu a nastavení do souboru a obnovení z něj.
import { createBackup, readBackup } from '../game/progress.js';
import { getProgress, replaceProgress } from './progress.js';
import { getSettings, updateSettings } from './settings.js';
import { today } from './clock.js';

export function downloadBackup() {
  const json = JSON.stringify(createBackup(getProgress(), getSettings()), null, 2);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  link.download = `kinzle-zaloha-${today()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Přečte soubor; vrátí funkci, která zálohu použije, nebo null, když soubor není záloha Kinzle
export async function readBackupFile(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return null;
  }
  const backup = readBackup(data);
  if (!backup) return null;
  return () => {
    replaceProgress(backup.progress);
    updateSettings({ ...backup.settings, onboarded: true });
  };
}
