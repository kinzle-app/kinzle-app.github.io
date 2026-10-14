// Typografické úpravy textů. V češtině pevná mezera po jednopísmenných
// předložkách a spojkách (v, k, s, z, o, u, a, i) a mezi číslem a jednotkou.

const NBSP = ' ';

export function typography(text, lang) {
  if (lang !== 'cs') return text;
  return text
    // „v lese“ → „v⍽lese“ (opakovaně kvůli „a v lese“)
    .replace(/(^|[\s(„])([vkszouaiVKSZOUAI]) /g, `$1$2${NBSP}`)
    .replace(/(^|[\s(„])([vkszouaiVKSZOUAI]) /g, `$1$2${NBSP}`)
    // „4 slova“, „120 b.“ → pevná mezera za číslem
    .replace(/(\d) (?=\p{L})/gu, `$1${NBSP}`);
}
