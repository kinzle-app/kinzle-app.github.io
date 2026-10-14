// Časovač hry, který jde pozastavit (při odchodu z aplikace).
// Hodiny se dají podstrčit kvůli testům.

export function createTimer(now = () => Date.now()) {
  let elapsed = 0;     // naměřené ms před posledním spuštěním
  let startedAt = null;

  return {
    start() {
      if (startedAt === null) startedAt = now();
    },
    pause() {
      if (startedAt !== null) {
        elapsed += now() - startedAt;
        startedAt = null;
      }
    },
    get running() {
      return startedAt !== null;
    },
    // uplynulý čas v celých sekundách
    seconds() {
      const ms = elapsed + (startedAt === null ? 0 : now() - startedAt);
      return Math.floor(ms / 1000);
    }
  };
}

// 161 → „2:41“
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}
