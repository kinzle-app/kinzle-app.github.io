// Co poslat do žebříčku – čistá logika bez sítě. Síť a přihlášení jsou v services/leaderboard.js.

// Denní hádanky daných dnů, které ještě nebyly odeslány: za každý den jedna za každou verzi (Lehká, Těžká),
// a to ta dohraná první. Záznamy bez verze patří k výchozí (fallback). sent = ['cs:2026-10-25:easy', …]
export function dailyToSend(history, lang, days, sent, fallback = null) {
  const out = new Map();
  history
    .filter((e) => e.mode === 'daily' && days.includes(e.date) && e.puzzleId.startsWith(`${lang}-`))
    .sort((a, b) => (a.finishedAt || '').localeCompare(b.finishedAt || ''))
    .forEach((e) => {
      const tier = e.tier || fallback;
      const key = `${lang}:${e.date}:${tier}`;
      if (!out.has(key) && !sent.includes(key)) out.set(key, { key, tier, entry: e });
    });
  return [...out.values()];
}

// Vyhrané úrovně Cesty s lepším výsledkem, než má server: [{ puzzleId, score, date }].
// sent = { 'cs-0006': 120, … } (nejlepší odeslané body)
export function pathToSend(history, lang, sent) {
  const best = new Map();
  for (const e of history) {
    if (e.mode !== 'path' || !e.won || !e.puzzleId.startsWith(`${lang}-`)) continue;
    if (!best.has(e.puzzleId) || e.score > best.get(e.puzzleId).score) best.set(e.puzzleId, { puzzleId: e.puzzleId, score: e.score, date: e.date });
  }
  return [...best.values()].filter((b) => b.score > (sent[b.puzzleId] || 0));
}

// Odznak Cesty: nejvyšší dohraná úroveň a součet hvězd. state = actState() z game/path.js
export function pathBadge(state) {
  const levels = state ? state.chapters.flatMap((c) => c.levels) : [];
  return {
    level: levels.reduce((max, l) => (l.state === 'done' ? Math.max(max, l.number) : max), 0),
    stars: levels.reduce((sum, l) => sum + l.stars, 0)
  };
}
