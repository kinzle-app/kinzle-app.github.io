// Server pro žebříčky (Supabase). Adresa a veřejný (publishable) klíč smí být v kódu –
// data chrání pravidla v databázi (supabase/migrations). Tajný klíč (secret / service_role) sem nikdy nepatří.
export const BACKEND = {
  url: 'https://xqtglcgmjplgshjlxvso.supabase.co',
  key: 'sb_publishable_nz41UbtVyzVyQ2YbtpodyA_pCkleDHW',
  cacheSeconds: 60 // žebříček se znovu načte nejdřív po minutě (šetří limity free plánu)
};
