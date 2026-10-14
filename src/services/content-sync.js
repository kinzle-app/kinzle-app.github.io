// Stahování obsahu z webu: content/manifest.json má verzi a otisk (hash) každého souboru.
// Stáhnou se jen soubory, které se od zabalené kopie nebo od posledního stažení změnily.
// Nový obsah se použije až při dalším spuštění, takže nic nezmizí uprostřed rozehrané hry.
// Bez internetu, při chybě nebo poškozeném souboru zůstane obsah, který hra už má.

// Otisk obsahu souboru (FNV-1a). Počítá se z dat, ne z textu, aby nevadilo formátování.
export function contentHash(data) {
  let h = 0x811c9dc5;
  for (const ch of JSON.stringify(data)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// bundled = { version, files: { 'cs/daily.json': data } } – kopie zabalená v aplikaci
// stored = { version, hashes: { cesta: otisk }, data: { cesta: data } } – stažené (data jen u souborů, které se od zabalených liší)
// Vrací { version, files } obsahu, se kterým se hraje.
export function activeContent(bundled, stored) {
  if (!stored || !(stored.version > bundled.version)) return bundled;
  const files = {};
  for (const [path, hash] of Object.entries(stored.hashes)) {
    if (path in stored.data) files[path] = stored.data[path];
    else if (path in bundled.files && contentHash(bundled.files[path]) === hash) files[path] = bundled.files[path];
  }
  return { version: stored.version, files };
}

// Zkontroluje web a vrátí nový záznam ke stažení (stored), nebo null, když není co měnit.
// fetchJson(cesta) vrací data souboru; při chybě vyhodí výjimku.
export async function syncContent(bundled, stored, fetchJson) {
  const active = activeContent(bundled, stored);
  const manifest = await fetchJson('manifest.json');
  if (!manifest || typeof manifest.version !== 'string' || !(manifest.version > active.version)) return null;

  const hashes = manifest.files || {};
  const data = {};
  for (const [path, hash] of Object.entries(hashes)) {
    if (path in bundled.files && contentHash(bundled.files[path]) === hash) continue; // zabalená kopie stačí
    const known = active.files[path];
    const file = known !== undefined && contentHash(known) === hash ? known : await fetchJson(path);
    if (contentHash(file) !== hash) throw new Error(`Soubor ${path} neodpovídá manifestu`);
    data[path] = file;
  }
  return { version: manifest.version, hashes, data };
}
