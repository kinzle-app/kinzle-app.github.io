// Co poslat do žebříčku – čistá logika bez sítě. Síť a přihlášení jsou v services/leaderboard.js.
import { seeds } from './progress.js';

// Denní hádanky daných dnů, které ještě nebyly odeslány. Za den se počítá jen první dohraná
// (u jazyka s úrovněmi ta, kterou hráč dohrál dřív). sent = ['cs:2026-10-25', …]
export function dailyToSend(history, lang, days, sent) {
  return days.flatMap((day) => {
    if (sent.includes(`${lang}:${day}`)) return [];
    const first = history
      .filter((e) => e.mode === 'daily' && e.date === day && e.puzzleId.startsWith(`${lang}-`))
      .sort((a, b) => (a.finishedAt || '').localeCompare(b.finishedAt || ''))[0];
    return first ? [first] : [];
  });
}

// Semínka jazyka, která server ještě nemá. Trénink se nepočítá.
export function seedsToSend(history, lang, sent) {
  const known = new Set(sent);
  return seeds({ history: history.filter((e) => e.mode !== 'free') })
    .map((s) => s.key)
    .filter((key) => key.startsWith(`${lang}-`) && !known.has(key));
}

// Odznak Cesty: nejvyšší dohraná úroveň a součet hvězd. state = actState() z game/path.js
export function pathBadge(state) {
  const levels = state ? state.chapters.flatMap((c) => c.levels) : [];
  return {
    level: levels.reduce((max, l) => (l.state === 'done' ? Math.max(max, l.number) : max), 0),
    stars: levels.reduce((sum, l) => sum + l.stars, 0)
  };
}
