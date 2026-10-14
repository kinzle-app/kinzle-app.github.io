// Promítne nastavení hráče do vzhledu a do vrstev (zvuk, vibrace).
import { setTable } from './theme.js';
import { setSoundEnabled } from '../services/sound.js';
import { setHapticsEnabled } from '../services/haptics.js';

const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceSetting = false;

export function applySettings(s) {
  setTable(s.table);
  setSoundEnabled(s.sound);
  setHapticsEnabled(s.vibration);
  reduceSetting = s.reduceMotion;
  const root = document.documentElement;
  root.dataset.fontSize = s.fontSize;
  root.classList.toggle('colorblind', s.colorblind);
  root.classList.toggle('reduce-motion', motionReduced());
}

// true = místo animací jen jednoduché prolnutí
export function motionReduced() {
  return reduceSetting || systemReduced.matches;
}

systemReduced.addEventListener('change', () => {
  document.documentElement.classList.toggle('reduce-motion', motionReduced());
});
