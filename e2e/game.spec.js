// Klíčové průchody hrou na mobilu: návod, výhra, prohra, nápovědy, nastavení, tlačítko Zpět, malý displej.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const puzzle = (id) => JSON.parse(readFileSync(`content/${id.slice(0, 2)}/puzzles/${id}.json`, 'utf8'));
const easy = puzzle('cs-0001');

// Hráč, který už viděl návod; animace omezené, ať testy běží rychle
async function setup(page, settings = {}) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('init')) {
      localStorage.setItem('kinzle:settings', JSON.stringify({ lang: 'cs', onboarded: true, reduceMotion: true, ...s }));
      sessionStorage.setItem('init', '1');
    }
  }, settings);
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

test('nápovědy: název skupiny, barevný okraj, nejvýš dvě', async ({ page }) => {
  await setup(page);
  await page.goto('./#/hra/cs-0001');
  const easiest = easy.groups.find((g) => g.difficulty === 1);

  await page.getByRole('button', { name: 'Nápověda', exact: true }).click();
  await page.getByRole('button', { name: /Odhalit název skupiny/ }).click();
  await expect(page.getByText(`Nápověda: ${easiest.title}`)).toBeVisible();

  await page.getByRole('button', { name: 'Nápověda', exact: true }).click();
  await page.getByRole('button', { name: /Odhalit jedno slovo/ }).click();
  await expect(page.locator('.tile.hinted')).toHaveCount(1);
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
  for (const id of ['cs-0005', 'en-test-04', 'en-test-05']) {
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
  await page.clock.setFixedTime(new Date('2026-10-19T08:00:00Z')); // pondělí 19. 10. v Praze
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
  await page.clock.setFixedTime(new Date('2026-10-20T08:00:00Z'));
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
  for (const g of first.groups) await pick(page, g.words);
  await expect(page.getByText('Získáváš 3 hvězdy')).toBeVisible();
  await page.getByRole('button', { name: 'Zpět na Cestu' }).click();
  await expect(page.getByRole('button', { name: /Úroveň 1, .*dohráno/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Úroveň 2, .*na řadě/ })).toBeVisible();
});
