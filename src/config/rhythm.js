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
