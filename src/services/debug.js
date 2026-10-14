// Testovací režim: adresa s ?debug ve vývojové verzi, v nasazené jen když ho zapne přepínač v content/flags.json.
import { flags } from './content.js';
import { load, save } from './storage.js';

const params = new URLSearchParams(location.search);

export function isDebug() {
  return params.has('debug') && (import.meta.env.DEV || flags().debug === true);
}

// Volby testovacího režimu uložené v zařízení: { offline } – simulace hry bez internetu
export function debugOptions() {
  return { offline: false, ...load('debug', {}) };
}

export function setDebugOptions(changes) {
  save('debug', { ...debugOptions(), ...changes });
}
