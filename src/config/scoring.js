// Všechna čísla pro výpočet bodů na jednom místě. Ladit se dá jen tady.

export const SCORING = {
  // body za vyřešenou skupinu podle obtížnosti 1–5
  groupPoints: { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 },

  // bonus za odvahu: za každou skupinu vyřešenou dřív než nějaká lehčí
  braveryBonus: 10,

  // časový bonus (jen při výhře): až timeBonusMax, klesá lineárně k nule za timeBonusSeconds
  timeBonusMax: 50,
  timeBonusSeconds: 5 * 60,

  // srážky
  mistakePenalty: 10,
  hintCost: { title: 15, pair: 20 }, // odhalení názvu skupiny / dvou slov, která patří k sobě

  maxHints: 2,

  // čistá hra (výhra bez chyby a bez nápovědy)
  cleanBonus: 25
};
