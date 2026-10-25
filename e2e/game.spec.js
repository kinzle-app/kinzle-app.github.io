// Klíčové průchody hrou na mobilu: návod, výhra, prohra, nápovědy, nastavení, tlačítko Zpět, malý displej.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { contentHash } from '../src/services/content-sync.js';

const puzzle = (id) => JSON.parse(readFileSync(`content/${id.slice(0, 2)}/puzzles/${id}.json`, 'utf8'));
const easy = puzzle('cs-0001');
const news = JSON.parse(readFileSync('content/cs/news.json', 'utf8'));

// Hráč, který už viděl návod; animace omezené, ať testy běží rychle.
// Den je pevně před začátkem rozpisu, aby testy nezávisely na dnešním datu (test si ho může přepsat).
async function setup(page, settings = {}) {
  await page.clock.setFixedTime(new Date('2026-10-10T08:00:00Z'));
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('init')) {
      localStorage.setItem('kinzle:settings', JSON.stringify({ lang: 'cs', onboarded: true, reduceMotion: true, newsSeen: { cs: s.news }, ...s }));
      sessionStorage.setItem('init', '1');
    }
  }, { news: news[0]?.id, ...settings });
}

async function pick(page, words) {
  for (const w of words) await page.getByRole('button', { name: w, exact: true }).click();
  await page.getByRole('button', { name: 'Odeslat skupinu' }).click();
}

test('první spuštění ukáže návod a pak výběr hádanky', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kinzle:settings', JSON.stringify({ lang: 'cs' })));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Najdi čtveřice' })).toBeVisible();
  await page.getByRole('button', { name: 'Další' }).click();
  await page.getByRole('button', { name: 'Další' }).click();
  await page.getByRole('button', { name: 'Jdeme hrát' }).click();
  await expect(page.getByRole('button', { name: 'Denní' })).toBeVisible();
});

test('výhra: skupiny se vyřeší a ukáže se skóre a Sdílet', async ({ page }) => {
  await setup(page);
  await page.goto('./#/hra/cs-0001');
  for (const g of easy.groups) await pick(page, g.words);
  await expect(page.getByRole('heading', { name: 'Výborně, všechny skupiny sedí!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sdílet výsledek' })).toBeVisible();
  await expect(page.locator('.end-points')).not.toHaveText('0');
});

test('těsně vedle, opakovaná kombinace a prohra s odkrytím skupin', async ({ page }) => {
  await setup(page);
  await page.goto('./#/hra/cs-0001');
  const [a, b, c] = easy.groups.map((g) => g.words);

  await pick(page, [a[0], a[1], a[2], b[0]]);
  await expect(page.getByText('Těsně vedle!')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Zbývají 3 pokusy' })).toBeVisible();

  await page.getByRole('button', { name: 'Zrušit výběr' }).click();
  await pick(page, [b[0], a[2], a[1], a[0]]); // stejná čtveřice v jiném pořadí
  await expect(page.getByText('Tuhle čtveřici už máš za sebou')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Zbývají 3 pokusy' })).toBeVisible();

  for (const extra of [b[1], b[2], c[0]]) {
    await page.getByRole('button', { name: 'Zrušit výběr' }).click();
    await pick(page, [a[0], a[1], c[1], extra]);
  }
  await expect(page.getByText('Tentokrát to nevyšlo')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.group')).toHaveCount(easy.groups.length);
});

test('nápovědy: název skupiny, dvojice slov, nejvýš dvě', async ({ page }) => {
  await setup(page);
  await page.goto('./#/hra/cs-0001');
  const easiest = easy.groups.find((g) => g.difficulty === 1);

  await page.getByRole('button', { name: 'Nápověda', exact: true }).click();
  await page.getByRole('button', { name: /Odhalit název skupiny/ }).click();
  await expect(page.getByText(`Nápověda: ${easiest.title}`)).toBeVisible();

  await page.getByRole('button', { name: 'Nápověda', exact: true }).click();
  await page.getByRole('button', { name: /Ukázat dvě slova/ }).click();
  await expect(page.locator('.tile.hinted')).toHaveCount(2);
  await expect(page.locator('.hint-card', { hasText: 'patří k sobě' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nápověda', exact: true })).toBeDisabled();
});

test('Zpět zavře okno nápovědy a hra zůstane', async ({ page }) => {
  await setup(page);
  await page.goto('./#/hra/cs-0001');
  await page.getByRole('button', { name: 'Nápověda', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/hra\/cs-0001$/);
});

test('rozehraná hra přežije návštěvu nastavení', async ({ page }) => {
  await setup(page);
  await page.goto('./#/hra/cs-0001');
  await pick(page, easy.groups[0].words);
  await page.getByRole('button', { name: 'Nastavení' }).click();
  await page.getByRole('button', { name: 'Zpět' }).click();
  await expect(page.locator('.group')).toHaveCount(1);
});

test('nastavení: angličtina a Denní stůl', async ({ page }) => {
  await setup(page);
  await page.goto('./#/nastaveni');
  await page.getByRole('button', { name: 'Denní' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-table', 'day');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.goto('./#/');
  await expect(page.getByRole('button', { name: 'Daily' })).toBeVisible();
});

test('malý displej 320 px: nic nepřetéká a slova se neořezávají', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 640 });
  for (const id of ['cs-0005', 'en-0002', 'cs-0040']) {
    await page.goto(`./#/hra/${id}`);
    await page.locator('.tile').first().waitFor();
    // počkat na písmo a přepočítání velikostí
    await page.evaluate(() => document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const problems = await page.evaluate(() => {
      const out = [];
      if (document.documentElement.scrollWidth > window.innerWidth) out.push('vodorovné přetečení stránky');
      for (const tile of document.querySelectorAll('.tile')) {
        const span = tile.firstElementChild;
        if (span.scrollWidth > tile.clientWidth || span.scrollHeight > tile.clientHeight) out.push(tile.dataset.word);
      }
      return out;
    });
    expect(problems, id).toEqual([]);
  }
});

test('denní hádanka: jednou denně, výsledek, váček a archiv', async ({ page }) => {
  await setup(page);
  await page.clock.setFixedTime(new Date('2026-10-12T08:00:00Z')); // pondělí 12. 10. v Praze
  await page.goto('./#/');
  await expect(page.getByText('Kinzle #1')).toBeVisible();
  await page.getByRole('button', { name: 'Hrát' }).click();
  for (const g of easy.groups) await pick(page, g.words);
  await expect(page.getByText('+4 semínka do váčku')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hrát znovu' })).toHaveCount(0); // denní jen jednou
  await page.getByRole('button', { name: 'Zpět na úvod' }).click();
  await expect(page.getByText('Vyřešeno')).toBeVisible();
  await expect(page.getByText('Další hádanka za')).toBeVisible();
  await expect(page.getByText('4 semínka')).toBeVisible();

  // druhý den je včerejší hádanka v archivu
  await page.clock.setFixedTime(new Date('2026-10-13T08:00:00Z'));
  await page.goto('./#/archiv');
  await expect(page.getByRole('button', { name: /Kinzle #1/ })).toContainText('✓'); // odehraná, s body
});

test('Cesta: úvod příběhu, výhra za hvězdy, odemčení další úrovně, zamčená úroveň', async ({ page }) => {
  await setup(page);
  const first = puzzle('cs-0006');
  await page.goto('./#/cesta/cs-0007'); // zamčená úroveň → zpět na plán
  await expect(page).toHaveURL(/#\/cesta$/);
  await expect(page.getByRole('heading', { name: 'U kuchyňského stolu' })).toBeVisible(); // úvod kapitoly
  await page.getByRole('button', { name: 'Vyrazit' }).click();
  await expect(page.getByRole('button', { name: /Úroveň 1, .*na řadě/ })).toBeVisible();
  await page.locator('.next').getByRole('button', { name: 'Hrát' }).click();
  // hrací plocha je mřížka po čtyřech (hlídá, aby ji nerozbily styly jiné obrazovky)
  expect(await page.locator('.board').evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(4);
  for (const g of first.groups) await pick(page, g.words);
  await expect(page.getByText('Získáváš 3 hvězdy')).toBeVisible();
  await page.getByRole('button', { name: 'Zpět na Cestu' }).click();
  await expect(page.getByRole('button', { name: /Úroveň 1, .*dohráno/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Úroveň 2, .*na řadě/ })).toBeVisible();
});

test('Volná hra: dohraná úroveň Cesty a starší denní, filtr obtížnosti', async ({ page }) => {
  await setup(page);
  await page.clock.setFixedTime(new Date('2026-10-13T08:00:00Z'));
  await page.goto('./#/cesta');
  await page.getByRole('button', { name: 'Vyrazit' }).click();
  await page.locator('.next').getByRole('button', { name: 'Hrát' }).click();
  for (const g of puzzle('cs-0006').groups) await pick(page, g.words);
  await expect(page.getByText('Získáváš 3 hvězdy')).toBeVisible();
  await page.goto('./#/volna');
  await expect(page.getByRole('button', { name: /Kinzle #1/ })).toBeVisible(); // včerejší denní
  await expect(page.getByRole('button', { name: /Cesta · úroveň 1/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Cesta · úroveň 2/ })).toHaveCount(0); // ještě nedohraná
  await page.getByRole('button', { name: 'těžké' }).click();
  await expect(page.getByText('V téhle obtížnosti tu zatím nic není.')).toBeVisible();
  await page.getByRole('button', { name: 'lehké' }).click();
  await page.getByRole('button', { name: /Cesta · úroveň 1/ }).click();
  await expect(page.locator('.tile')).toHaveCount(12);
});

test('Co je nového: ukáže se jednou, novému hráči až po další aktualizaci', async ({ page }) => {
  await setup(page, { news: 'starší' });
  await page.goto('./#/');
  await expect(page.getByRole('heading', { name: news[0].title })).toBeVisible();
  await page.getByRole('button', { name: 'Jdu hrát' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.waitForFunction(() => !history.state?.modal); // zavření okna vrací krok v historii
  await page.reload();
  await expect(page.getByRole('button', { name: 'Denní' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('obsah z webu: novější se stáhne a použije při dalším spuštění, bez internetu hra běží dál', async ({ page }) => {
  await setup(page);
  const changed = [{ ...news[0], id: 'web', title: 'Novinka z webu' }];
  await page.route('**/content/manifest.json', async (route) => {
    const manifest = await (await route.fetch()).json();
    await route.fulfill({ json: { version: '9999', files: { ...manifest.files, 'cs/news.json': contentHash(changed) } } });
  });
  await page.route('**/content/cs/news.json', (route) => route.fulfill({ json: changed }));
  await page.goto('./#/');
  await expect(page.getByRole('button', { name: 'Denní' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0); // stažené se uprostřed hraní neprojeví
  await expect.poll(() => page.evaluate(() => localStorage.getItem('kinzle:content'))).toContain('Novinka z webu');

  await page.unrouteAll();
  await page.route('**/content/**', (route) => route.abort()); // bez internetu
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Novinka z webu' })).toBeVisible();
});

test('angličtina: úroveň v nastavení, každá úroveň má svou denní hádanku', async ({ page }) => {
  await setup(page, { lang: 'en', tier: 'easy', newsSeen: {} });
  await page.clock.setFixedTime(new Date('2026-10-12T08:00:00Z'));
  await page.goto('./#/');
  // Easy zatím nemá denní hádanky; dnešní Hard je nabídnutá pod kartou
  await expect(page.getByText('Daily puzzles are on their way.')).toBeVisible();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await expect(page.getByText('Kinzle #1 · Hard')).toBeVisible();
  for (const g of puzzle('en-0001').groups) {
    for (const w of g.words) await page.getByRole('button', { name: w, exact: true }).click();
    await page.getByRole('button', { name: 'Submit group' }).click();
  }
  await page.getByRole('button', { name: 'Back to start' }).click();
  await expect(page.getByRole('button', { name: 'Hard ✓' })).toBeDisabled();

  // přepnutí na Hard v nastavení: na úvodu je odehraná hádanka s výsledkem
  await page.goto('./#/nastaveni');
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await page.goto('./#/');
  await expect(page.getByText('Kinzle #1 · Hard')).toBeVisible();
  await expect(page.getByText('Solved')).toBeVisible();
});

test('trénink bez prohry a Moje hry s pokusy po řadě', async ({ page }) => {
  await setup(page);
  await page.clock.setFixedTime(new Date('2026-10-13T08:00:00Z')); // cs-0001 je včerejší denní → v tréninku
  await page.goto('./#/volna');
  await page.getByRole('button', { name: /Kinzle #1/ }).click();
  await expect(page.getByText('Trénink: bez bodů a bez limitu chyb')).toBeVisible();
  const [a, b] = easy.groups.map((g) => g.words);
  for (const extra of b) { // 4 chyby by jinak znamenaly prohru
    await pick(page, [a[0], a[1], a[2], extra]);
    await page.getByRole('button', { name: 'Zrušit výběr' }).click();
  }
  await expect(page.getByText('Tentokrát to nevyšlo')).toHaveCount(0);
  for (const g of easy.groups) await pick(page, g.words);
  await expect(page.getByRole('heading', { name: 'Výborně, všechny skupiny sedí!' })).toBeVisible();
  await expect(page.locator('.end-points')).toHaveCount(0); // bez bodů

  await page.goto('./#/hry');
  await page.getByRole('button', { name: /Trénink · Kinzle #1/ }).click();
  await expect(page.locator('.attempt')).toHaveCount(4 + easy.groups.length);
  await expect(page.locator('.attempt').first()).toContainText('těsně vedle');
});

test('čeština: volba Lehká | Těžká na denní kartě, každá verze má svou denní hádanku', async ({ page }) => {
  await setup(page);
  await page.clock.setFixedTime(new Date('2026-10-20T08:00:00Z'));
  await page.goto('./#/');
  await expect(page.getByText('Kinzle #9')).toBeVisible(); // Lehká: bez přípony
  const choice = page.getByRole('group', { name: 'Verze denní hádanky' });
  await expect(choice.getByRole('button', { name: 'Lehká' })).toHaveAttribute('aria-pressed', 'true');
  await choice.getByRole('button', { name: 'Těžká' }).click();
  await expect(page.getByText('Kinzle #1 · Těžká')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Verze denní hádanky' }).getByRole('button', { name: 'Těžká' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByText('Kinzle #1 · Těžká')).toBeVisible(); // volba se pamatuje
});

test('žebříček: zápis přezdívkou, chybná přezdívka, Dnes a Celkem (server je simulovaný)', async ({ page }) => {
  await setup(page);
  const calls = [];
  // skutečný server se v testech nikdy nevolá
  await page.route('**/*.supabase.co/**', async (route) => {
    const url = route.request().url();
    const body = route.request().postDataJSON() || {};
    const name = url.split('/rpc/')[1];
    calls.push(name || 'auth');
    const json = (status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (!name) return json(200, { access_token: 't', refresh_token: 'r', expires_at: 4102444800 });
    if (name === 'set_nickname') {
      return body.p_nickname.includes('kokot') ? json(400, { code: 'P0001', message: 'nickname_bad' }) : json(200, body.p_nickname);
    }
    if (name === 'leaderboard') {
      const me = body.p_kind === 'today'
        ? { rank: 2, nickname: 'Syn', tier: 'easy', score: 160, seconds: 90, won: true, level: 12, stars: 30, me: true }
        : { rank: 1, nickname: 'Syn', seeds: 42, level: 12, stars: 30, me: true };
      const other = { rank: 1, nickname: 'Táta', tier: 'hard', score: 150, seconds: 200, won: true, level: 27, stars: 70, me: false };
      return json(200, { top: body.p_kind === 'today' ? [other, me] : [me], me, count: 2 });
    }
    return json(200, null);
  });
  await page.goto('./#/spolu');
  // záložka ukáže žebříček rovnou, i bez přezdívky; nad ním pozvánka k zápisu
  await expect(page.locator('.rank-list li').first()).toContainText('Táta');
  await page.locator('.join-card').getByRole('button', { name: 'Zapsat se' }).click();
  const nick = page.getByRole('textbox', { name: 'Přezdívka (3–16 znaků)' });
  await nick.fill('kokot');
  await page.getByRole('button', { name: 'Zapsat se' }).click();
  await expect(page.getByText('Tuhle přezdívku použít nejde')).toBeVisible();
  await nick.fill('Syn');
  await page.getByRole('button', { name: 'Zapsat se' }).click();
  await expect(page.locator('.rank-list li.me')).toContainText('160 b. · Lehká');
  await expect(page.locator('.rank-list li').first()).toContainText('Táta');
  await expect(page.locator('.rank-list li').first()).toContainText('úroveň 27 · ★ 70');
  await page.getByRole('button', { name: 'Celkem' }).click();
  await expect(page.locator('.rank-list li.me')).toContainText('42 semínek');
  expect(calls).toContain('set_path'); // odznak Cesty se poslal po zápisu
});

test('vlastní hádanka: složit, chyba ve formuláři, zahrát z odkazu, bez semínek, v Moje hry', async ({ page }) => {
  await setup(page);
  await page.goto('./#/spolu');
  await page.getByRole('button', { name: /Slož vlastní hádanku/ }).click();
  await page.getByRole('button', { name: 'Lehká 3×4' }).click();
  const groups = [['Ovoce', 'jablko', 'hruška', 'švestka', 'třešeň'], ['Zvířata', 'pes', 'kočka', 'kůň', 'kráva'], ['Barvy', 'modrá', 'žlutá', 'zelená', 'pes']];
  for (const [i, [title, ...words]] of groups.entries()) {
    await page.getByRole('textbox', { name: `Název skupiny ${i + 1}` }).fill(title);
    for (const [j, w] of words.entries()) await page.getByRole('textbox', { name: `Skupina ${i + 1}, slovo ${j + 1}`, exact: true }).fill(w);
  }
  await page.getByRole('textbox', { name: 'Tvoje jméno (uvidí ho hráč)' }).fill('Táta');
  await page.getByRole('button', { name: 'Vytvořit odkaz' }).click();
  await expect(page.getByText('Skupina 3: stejné slovo je v hádance dvakrát.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Skupina 3, slovo 4', exact: true }).fill('červená');
  await page.getByRole('button', { name: 'Vytvořit odkaz' }).click();
  await expect(page.getByRole('heading', { name: 'Hádanka je hotová!' })).toBeVisible();
  await page.getByRole('button', { name: 'Vyzkoušet hádanku' }).click();
  await expect(page).toHaveURL(/#\/h\/[\w-]+$/);
  await expect(page.getByText('Od: Táta')).toBeVisible();
  await pick(page, ['jablko', 'hruška', 'švestka', 'třešeň']);
  await pick(page, ['pes', 'kočka', 'kůň', 'kráva']);
  await pick(page, ['modrá', 'žlutá', 'zelená', 'červená']);
  await expect(page.getByRole('button', { name: 'Poslat výsledek autorovi' })).toBeVisible();
  await expect(page.locator('.seeds-note')).toHaveCount(0); // vlastní hádanka nedává semínka
  await page.goto('./#/hry');
  await expect(page.getByRole('button', { name: /Vlastní hádanka · Od: Táta/ })).toBeVisible();
  await page.goto('./#/h/poskozeny-odkaz');
  await expect(page.getByRole('heading', { name: 'Odkaz nefunguje' })).toBeVisible();
});

test('parta: zápis, založení, kód pro pozvání, kdo dnes hrál, hádanky party (server je simulovaný)', async ({ page }) => {
  await setup(page);
  const party = {
    id: '11111111-1111-1111-1111-111111111111', code: 'ABC234', name: 'Rodina', owner: true,
    members: [
      { id: 'a', nickname: 'Táta', me: true, owner: true, played: true, level: 27, stars: 70 },
      { id: 'b', nickname: 'Syn', me: false, owner: false, played: false, level: 12, stars: 30 }
    ],
    puzzles: []
  };
  const calls = [];
  await page.route('**/*.supabase.co/**', async (route) => {
    const name = route.request().url().split('/rpc/')[1];
    const body = route.request().postDataJSON() || {};
    calls.push(name || 'auth');
    const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    if (!name) return json({ access_token: 't', refresh_token: 'r', expires_at: 4102444800 });
    if (name === 'set_nickname') return json(body.p_nickname);
    if (name === 'my_parties') return json([]);
    if (name === 'create_party') return json({ id: party.id, code: party.code, name: body.p_name });
    if (name === 'party_detail') return json(party);
    if (name === 'leaderboard') return json({ top: [], me: null, count: 0 });
    return json(null);
  });
  await page.goto('./#/spolu');
  await page.getByRole('button', { name: /Založit nebo připojit partu/ }).click();
  await page.getByRole('textbox', { name: 'Přezdívka (3–16 znaků)' }).fill('Táta');
  await page.getByRole('button', { name: 'Zapsat se' }).click();
  await expect(page.getByText('Zatím nejsi v žádné partě.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Název party (např. Rodina)' }).fill('Rodina');
  await page.getByRole('button', { name: 'Založit' }).click();
  await expect(page.getByRole('heading', { name: 'Rodina' })).toBeVisible();
  await expect(page.getByText('ABC234')).toBeVisible();
  await expect(page.locator('.rank-list li').filter({ hasText: 'Syn' })).toContainText('ještě ne');
  await expect(page.locator('.rank-list li').filter({ hasText: 'Syn' }).getByRole('button', { name: 'Odebrat' })).toBeVisible();
  await expect(page.getByText('Zatím tu žádná hádanka není.')).toBeVisible();
  await page.getByRole('button', { name: 'Složit hádanku pro partu' }).click();
  await expect(page.getByRole('heading', { name: 'Hádanka pro partu' })).toBeVisible();
  expect(calls).toContain('leaderboard'); // žebříček party se načetl
});
