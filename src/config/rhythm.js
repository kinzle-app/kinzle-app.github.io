// Rytmus týdne denních hádanek: velikost a rozsah úrovně (level) podle dne (0 = neděle).
// Používá ho npm run validate (kontrola rozpisu) i výběr reprízy.
export const RHYTHM = {
  1: { size: 4, min: 1, max: 2 },
  2: { size: 4, min: 2, max: 3 },
  3: { size: 4, min: 2, max: 4 },
  4: { size: 4, min: 3, max: 4 },
  5: { size: 4, min: 4, max: 5 },
  6: { size: 5, min: 3, max: 5 },
  0: { size: 5, min: 3, max: 5 }
};

const everyDay = (rule) => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, rule]));

// Vlastní rytmus úrovně denní hádanky (jazyk:úroveň); ostatní používají RHYTHM.
// Čeština Lehká (děti, začátečníci): každý den 4×4 s úrovní 1–2, bez stoupání během týdne.
// Čeština Těžká (dospělí): po–pá 4×4 s úrovní 3–5 stoupající k pátku, víkend 5×4.
const TIER_RHYTHM = {
  'cs:easy': everyDay({ size: 4, min: 1, max: 2 }),
  'cs:hard': {
    1: { size: 4, min: 3, max: 3 },
    2: { size: 4, min: 3, max: 4 },
    3: { size: 4, min: 3, max: 4 },
    4: { size: 4, min: 4, max: 4 },
    5: { size: 4, min: 4, max: 5 },
    6: { size: 5, min: 3, max: 5 },
    0: { size: 5, min: 3, max: 5 }
  }
};

export function rhythmFor(lang, tier) {
  return TIER_RHYTHM[`${lang}:${tier}`] || RHYTHM;
}
