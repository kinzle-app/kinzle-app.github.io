// Kontrola struktury hádanky. Vrací seznam chyb (prázdný = v pořádku).
// Použije ji hra při načítání i testy nad všemi soubory v content/.

export const SIZES = [3, 4, 5];          // počet skupin
export const MAX_WORD_LENGTH = 12;       // delší slovo se na kostičku nevejde ani zmenšené
export const STATUSES = ['draft', 'approved', 'test']; // test = zkušební hádanky z fází 1–2

export function validatePuzzle(p) {
  const errors = [];
  if (!p || typeof p !== 'object') return ['hádanka není objekt'];

  for (const field of ['id', 'language', 'author', 'createdAt', 'status']) {
    if (typeof p[field] !== 'string' || !p[field]) errors.push(`chybí pole ${field}`);
  }
  if (!SIZES.includes(p.size)) errors.push(`neplatná velikost ${p.size}`);
  if (p.status && !STATUSES.includes(p.status)) errors.push(`neplatný stav ${p.status}`);
  // plánovaná obtížnost celé hádanky 1–5 (rytmus týdne, Volná hra); zkušební hádanky ji nemají
  if (p.status !== 'test' && !(Number.isInteger(p.level) && p.level >= 1 && p.level <= 5)) {
    errors.push(`neplatná úroveň (level) ${p.level}`);
  }
  if (p.teaser !== undefined && (typeof p.teaser !== 'string' || !p.teaser)) errors.push('upoutávka (teaser) musí být text');
  if (!Array.isArray(p.groups)) return [...errors, 'chybí skupiny'];
  if (p.groups.length !== p.size) errors.push(`počet skupin ${p.groups.length} neodpovídá velikosti ${p.size}`);

  const seen = new Set();
  const difficulties = new Set();
  p.groups.forEach((g, i) => {
    const name = `skupina ${i + 1}`;
    if (!g.title) errors.push(`${name}: chybí název`);
    if (!g.explanation) errors.push(`${name}: chybí vysvětlení`);
    if (!Number.isInteger(g.difficulty) || g.difficulty < 1 || g.difficulty > 5) {
      errors.push(`${name}: neplatná obtížnost ${g.difficulty}`);
    } else if (difficulties.has(g.difficulty)) {
      errors.push(`${name}: obtížnost ${g.difficulty} je už u jiné skupiny`);
    }
    difficulties.add(g.difficulty);
    if (!Array.isArray(g.words) || g.words.length !== 4) {
      errors.push(`${name}: musí mít přesně 4 slova`);
      return;
    }
    for (const w of g.words) {
      const key = String(w).toLocaleLowerCase(p.language);
      if (!w || typeof w !== 'string') errors.push(`${name}: prázdné slovo`);
      else if (w.length > MAX_WORD_LENGTH) errors.push(`${name}: slovo „${w}“ je delší než ${MAX_WORD_LENGTH} znaků`);
      if (seen.has(key)) errors.push(`slovo „${w}“ je v hádance dvakrát`);
      seen.add(key);
    }
  });
  // obtížnosti skupin jsou přesně 1 až počet skupin (barvy a symboly)
  if (p.size && [...difficulties].sort().join() !== Array.from({ length: p.size }, (_, i) => i + 1).join()) {
    errors.push(`obtížnosti skupin musí být 1 až ${p.size}`);
  }
  return errors;
}
