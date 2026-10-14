// Vibrace. Teď přes navigator.vibrate (Android), na iOS tiše nic.
// Později jde vyměnit za Capacitor Haptics bez zásahu do hry.

let enabled = true;

export function setHapticsEnabled(value) {
  enabled = value;
}

export function hapticsSupported() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function vibrate(pattern) {
  if (!enabled || !hapticsSupported()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // některé prohlížeče vibrace blokují, hra pokračuje
  }
}
