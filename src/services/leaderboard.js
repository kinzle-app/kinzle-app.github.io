// Žebříčky přes Supabase: anonymní přihlášení, přezdívka, odeslání výsledků a načtení pořadí.
// Bez knihovny – jen fetch na rozhraní Supabase. Když server nejde (offline, uspaný), hra běží dál
// a neodeslané výsledky se pošlou příště (co je odeslané, si pamatuje uložený stav).
import { BACKEND } from '../config/backend.js';
import { load, save } from './storage.js';
import { flags, currentAct } from './content.js';
import { isDebug } from './debug.js';
import { clockShifted, today } from './clock.js';
import { getProgress } from './progress.js';
import { getLanguage } from './i18n.js';
import { defaultTier } from '../config/tiers.js';
import { addDays } from '../game/calendar.js';
import { actState } from '../game/path.js';
import { dailyToSend, pathToSend, pathBadge } from '../game/leaderboard.js';

const cache = new Map();
let syncing = null;

// Žebříček jde použít: zapnutý v content/flags.json, ne v testovacím režimu a ne s posunutými hodinami
export function leaderboardEnabled() {
  return flags().leaderboards !== false && !isDebug() && !clockShifted;
}

// Uložený stav: přezdívka a co už je na serveru (aby se nic neposílalo dvakrát)
function state() {
  return { nickname: null, sentDaily: [], sentPath: {}, path: {}, ...load('leaderboard', {}) };
}

function update(changes) {
  save('leaderboard', { ...state(), ...changes });
}

export function nickname() {
  return state().nickname;
}

// Volání serveru; chyba ze serveru má status (např. obsazená přezdívka), výpadek sítě ne
async function request(path, body, token) {
  const res = await fetch(BACKEND.url + path, {
    method: 'POST',
    headers: { apikey: BACKEND.key, 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(data?.message || data?.msg || `http_${res.status}`), { status: res.status });
  return data;
}

// Anonymní přihlášení (zařízení = hráč); token se sám obnovuje
async function session() {
  const saved = load('auth');
  if (saved && saved.expiresAt > Date.now() / 1000 + 60) return saved;
  let data;
  try {
    data = saved
      ? await request('/auth/v1/token?grant_type=refresh_token', { refresh_token: saved.refreshToken })
      : await request('/auth/v1/signup', {});
  } catch (error) {
    // neplatné přihlášení (např. po smazání údajů) → příště začne hráč znovu
    if (saved && error.status >= 400 && error.status < 500) forgetLocal();
    throw error;
  }
  const auth = { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: data.expires_at };
  save('auth', auth);
  return auth;
}

async function rpc(name, args) {
  const auth = await session();
  return request(`/rest/v1/rpc/${name}`, args, auth.accessToken);
}

// Zápis do žebříčku s přezdívkou; potom se pošle všechno, co hráč už nahrál
export async function join(name) {
  const saved = await rpc('set_nickname', { p_nickname: name });
  update({ nickname: saved });
  await sync();
  return saved;
}

// Pošle neodeslané výsledky (po každé hře a při otevření žebříčku). Chyby sítě tiše přeskočí.
export function sync() {
  if (!nickname() || !leaderboardEnabled()) return Promise.resolve();
  syncing ||= send().catch(() => {}).finally(() => { syncing = null; });
  return syncing;
}

// Chyba ze serveru (nesmyslná hodnota, starý den) se už neopakuje; výpadek sítě ano
async function tolerant(call) {
  try {
    await call();
  } catch (error) {
    if (!error.status) throw error;
  }
}

async function send() {
  const lang = getLanguage();
  const progress = getProgress();

  // denní hádanky: Lehká i Těžká (u jazyka bez verzí výchozí 'medium')
  const days = [addDays(today(), -1), today()];
  for (const { key, tier, entry: e } of dailyToSend(progress.history, lang, days, state().sentDaily, defaultTier(lang) || 'medium')) {
    await tolerant(() => rpc('submit_daily', {
      p_lang: lang, p_day: e.date, p_tier: tier, p_puzzle: e.puzzleId,
      p_score: e.score, p_seconds: e.seconds, p_mistakes: e.mistakes, p_hints: e.hints, p_won: e.won
    }));
    update({ sentDaily: [...state().sentDaily, key] });
  }

  // Cesta: nejlepší výsledek každé vyhrané úrovně (server přičte jen zlepšení)
  for (const p of pathToSend(progress.history, lang, state().sentPath)) {
    await tolerant(() => rpc('submit_path', { p_lang: lang, p_puzzle: p.puzzleId, p_score: p.score, p_day: p.date }));
    update({ sentPath: { ...state().sentPath, [p.puzzleId]: p.score } });
  }

  const act = currentAct(lang);
  const badge = pathBadge(act && actState(act, progress));
  const last = state().path[lang];
  if (!last || last.level !== badge.level || last.stars !== badge.stars) {
    await tolerant(() => rpc('set_path', { p_lang: lang, p_level: badge.level, p_stars: badge.stars }));
    update({ path: { ...state().path, [lang]: badge } });
  }
  cache.clear();
}

// Žebříček (celý, nebo jen parta): { top: [...], me, count }. Drží se minutu v paměti.
export async function board(party = null) {
  const lang = getLanguage();
  const key = `${lang}:${party}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < BACKEND.cacheSeconds * 1000) return hit.data;
  await sync();
  const data = await rpc('leaderboard', { p_lang: lang, p_kind: 'total', ...(party && { p_party: party }) });
  cache.set(key, { at: Date.now(), data });
  return data;
}

// ---------- party ----------
export const myParties = () => rpc('my_parties', {});
export const createParty = (name) => rpc('create_party', { p_name: name });
export const joinParty = (code) => rpc('join_party', { p_code: code });
export const partyDetail = (id) => rpc('party_detail', { p_party: id, p_lang: getLanguage() });
export const postPartyPuzzle = (id, code) => rpc('post_party_puzzle', { p_party: id, p_lang: getLanguage(), p_code: code });
export const deletePartyPuzzle = (puzzleId) => rpc('delete_party_puzzle', { p_id: puzzleId });
export const removeMember = (id, user) => rpc('remove_member', { p_party: id, p_user: user });

export async function leaveParty(id) {
  await rpc('leave_party', { p_party: id });
  cache.clear();
}

// Smazání všech údajů hráče na serveru i v zařízení (přezdívka, výsledky, semínka)
export async function forget() {
  await rpc('delete_me', {});
  forgetLocal();
}

function forgetLocal() {
  save('auth', null);
  save('leaderboard', {});
  cache.clear();
}
