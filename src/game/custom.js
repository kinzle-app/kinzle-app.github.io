// Vlastní hádanka od hráče: celá je zakódovaná v odkazu (#/h/<kód>), žádný server.
// Skupiny jsou seřazené od nejlehčí (obtížnost 1) po nejtěžší.
import { SIZES, MAX_WORD_LENGTH } from './puzzle.js';

export const CUSTOM_LIMITS = { title: 40, word: MAX_WORD_LENGTH, explanation: 120, author: 16 };

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

// Chyby návrhu pro formulář: [{ error, group, word }]. Prázdný seznam = jde vytvořit odkaz.
// draft = { lang, author, groups: [{ title, words: [4×], explanation }] }
export function customErrors(draft) {
  const errors = [];
  if (!SIZES.includes(draft.groups?.length)) return [{ error: 'size' }];
  const seen = new Map();
  draft.groups.forEach((g, group) => {
    const title = clean(g.title);
    if (!title) errors.push({ error: 'title', group });
    else if (title.length > CUSTOM_LIMITS.title) errors.push({ error: 'titleLong', group });
    if (clean(g.explanation).length > CUSTOM_LIMITS.explanation) errors.push({ error: 'explanationLong', group });
    (g.words || []).forEach((w, word) => {
      const value = clean(w);
      const key = value.toLocaleLowerCase(draft.lang);
      if (!value) errors.push({ error: 'word', group, word });
      else if (value.length > CUSTOM_LIMITS.word) errors.push({ error: 'wordLong', group, word });
      else if (seen.has(key)) errors.push({ error: 'duplicate', group, word });
      else seen.set(key, true);
    });
    if ((g.words || []).length !== 4) errors.push({ error: 'word', group });
  });
  if (clean(draft.author).length > CUSTOM_LIMITS.author) errors.push({ error: 'authorLong' });
  return errors;
}

// Text → base64url (bezpečné v adrese) a zpět, s diakritikou přes UTF-8
function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code) {
  const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

// Kód do odkazu. Předpokládá návrh bez chyb (customErrors).
export function encodeCustom(draft) {
  const data = {
    v: 1,
    l: draft.lang,
    ...(clean(draft.author) && { a: clean(draft.author) }),
    g: draft.groups.map((g) => [clean(g.title), ...g.words.map(clean), ...(clean(g.explanation) ? [clean(g.explanation)] : [])])
  };
  return toBase64Url(JSON.stringify(data));
}

// Krátké stabilní id hádanky z kódu (pro historii a rozehranou hru)
export function customId(code) {
  let hash = 2166136261;
  for (let i = 0; i < code.length; i++) hash = Math.imul(hash ^ code.charCodeAt(i), 16777619);
  return `u-${(hash >>> 0).toString(36)}`;
}

// Hádanka z kódu, nebo null, když je odkaz poškozený či neplatný
export function decodeCustom(code) {
  let data;
  try {
    data = JSON.parse(fromBase64Url(code));
  } catch {
    return null;
  }
  if (data?.v !== 1 || typeof data.l !== 'string' || !Array.isArray(data.g)) return null;
  if (!data.g.every((g) => Array.isArray(g) && g.length >= 5 && g.length <= 6 && g.every((x) => typeof x === 'string'))) return null;
  const draft = {
    lang: data.l,
    author: typeof data.a === 'string' ? data.a : '',
    groups: data.g.map(([title, ...rest]) => ({ title, words: rest.slice(0, 4), explanation: rest[4] || '' }))
  };
  if (customErrors(draft).length) return null;
  return {
    id: customId(code),
    language: draft.lang,
    size: draft.groups.length,
    level: 3,
    author: draft.author,
    custom: true,
    groups: draft.groups.map((g, i) => ({ title: g.title, difficulty: i + 1, words: g.words, explanation: g.explanation }))
  };
}
