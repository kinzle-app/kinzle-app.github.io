// Úrovně denní hádanky. Každá úroveň má vlastní denní hádanku (vlastní rozpis v daily.json).
// list = úrovně, default = výchozí, pick = kde se úroveň volí:
//  'settings' – v nastavení a na konci návodu (angličtina: slovní zásoba pro studenty i rodilé mluvčí),
//  'card'     – přepínačem „Těžká“ přímo na kartě denní hádanky; jen kdo chce (čeština: lehká a těžká pro dospělé).
export const TIERS = {
  en: { list: ['easy', 'medium', 'hard'], default: 'medium', pick: 'settings' },
  cs: { list: ['easy', 'hard'], default: 'easy', pick: 'card' }
};

export function tiersOf(lang) {
  return TIERS[lang]?.list || [];
}

export function defaultTier(lang) {
  return TIERS[lang]?.default || null;
}

export function tierPick(lang) {
  return TIERS[lang]?.pick || null;
}
