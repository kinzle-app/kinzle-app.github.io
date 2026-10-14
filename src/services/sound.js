// Zvuky. Krátké jemné tóny syntetizované přes Web Audio, takže nejsou potřeba žádné soubory.
// Později jde vyměnit za nativní přehrávání bez zásahu do hry.
import { FEEL } from '../config/feel.js';

let enabled = true;
let ctx = null;

export function setSoundEnabled(value) {
  enabled = value;
}

function audio() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    // iPhone: zvuky respektují tichý režim a nepřeruší hudbu v pozadí
    if (navigator.audioSession) navigator.audioSession.type = 'ambient';
    ctx = new Ctx();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Jeden tón: frekvence (Hz), začátek (s od teď), délka (s), hlasitost (0–1), tvar vlny
function tone(freq, start, length, volume = 1, type = 'sine') {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(FEEL.volume * volume, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

const SOUNDS = {
  // cvaknutí kamínku
  select: () => { tone(1250, 0, 0.045, 0.7, 'triangle'); tone(620, 0, 0.06, 0.35); },
  deselect: () => tone(820, 0, 0.04, 0.4, 'triangle'),
  // úspěch: dva stoupající tóny
  correct: () => { tone(523, 0, 0.16, 0.7); tone(784, 0.09, 0.22, 0.7); },
  // těsně vedle: krátké „hm-hm“
  oneAway: () => { tone(440, 0, 0.1, 0.5, 'triangle'); tone(494, 0.11, 0.12, 0.5, 'triangle'); },
  // chyba: tlumené ťuknutí dolů
  wrong: () => { tone(220, 0, 0.14, 0.7, 'triangle'); tone(165, 0.08, 0.18, 0.6, 'triangle'); },
  // výhra: akord nahoru
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.35, 0.6)),
  hint: () => tone(988, 0, 0.12, 0.4)
};

export function play(name) {
  if (!enabled) return;
  try {
    SOUNDS[name]?.();
  } catch {
    // zvuk není podstatný, hra pokračuje
  }
}
