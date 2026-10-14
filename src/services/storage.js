// Vrstva pro ukládání dat. Teď localStorage, později jde vyměnit
// za Capacitor Preferences bez zásahu do zbytku hry.
// Když úložiště nejde (anonymní režim, zákaz), data se drží jen v paměti.

const PREFIX = 'kinzle:';
const memory = new Map();
let available = null;

function backend() {
  if (available === null) {
    try {
      const key = PREFIX + '__test';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      available = true;
    } catch {
      available = false;
    }
  }
  return available ? localStorage : null;
}

// Vrátí uloženou hodnotu, nebo fallback, když chybí nebo je poškozená
export function load(key, fallback = null) {
  try {
    const raw = memory.has(key) || !backend() ? memory.get(key) : localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  const raw = JSON.stringify(value);
  try {
    if (backend()) {
      localStorage.setItem(PREFIX + key, raw);
      return;
    }
  } catch {
    // plné úložiště – uložíme aspoň do paměti
  }
  memory.set(key, raw);
}

// true, když se data opravdu ukládají do zařízení
export function isPersistent() {
  return Boolean(backend());
}
