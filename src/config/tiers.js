// Úrovně jazyka (Easy / Medium / Hard) – jen pro jazyky, které se hráči často učí.
// Úroveň určuje slovní zásobu a typ hříček; každá má vlastní denní hádanku. Čeština úrovně nemá.
export const TIERS = { en: ['easy', 'medium', 'hard'] };
export const DEFAULT_TIER = 'medium';

export function tiersOf(lang) {
  return TIERS[lang] || [];
}
