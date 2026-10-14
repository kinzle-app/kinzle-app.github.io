# Kinzle

Slovní hra o hledání souvislostí: roztřiď kostičky se slovy do skupin po čtyřech.
Hraje se na **https://kinzle-app.github.io/**.

## Spuštění na počítači

Potřebuješ [Node.js](https://nodejs.org/) (verze 22 nebo novější).

```bash
npm install
```

```bash
npm run dev
```

Otevři adresu, kterou příkaz vypíše (obvykle http://localhost:5173).

**Na mobilu ve stejné Wi-Fi:** spusť `npm run dev -- --host` a otevři v telefonu adresu
u řádku `Network`. Windows se může zeptat na firewall, povol privátní síť.

## Příkazy

| Příkaz | Co dělá |
|---|---|
| `npm run dev` | vývojový server s automatickým obnovením |
| `npm test` | testy (herní logika, body, překlady, kontrast barev, kontrola všech hádanek) |
| `npm run test:e2e` | průchody hrou v prohlížeči v mobilním rozlišení (Playwright; poprvé `npx playwright install chromium`) |
| `npm run build` | sestavení hry do složky `dist/` |
| `npm run preview` | spuštění sestavené verze z `dist/` |

## Struktura projektu

```
content/<jazyk>/puzzles/   hádanky (JSON), každá se stabilním id
src/game/                  herní logika bez UI (pravidla, kontrola hádanky)
src/services/              úložiště, překlady, typografie, načítání obsahu, nastavení
src/ui/                    obrazovky a styly (tokens.css = barvy obou stolů)
src/locales/               texty: cs.json, en.json
src/config/scoring.js      výpočet bodů (ladění)
src/config/feel.js         časy a intenzity animací, zvuků a vibrací (ladění)
e2e/                       testy průchodů hrou (Playwright)
tests/                     testy ve Vitestu
design/                    náhledy vzhledu (předloha)
docs/                      dokumentace a veřejné zadání
```

## Nasazení

Každý push do větve `main` spustí GitHub Action **Nasazení** (`.github/workflows/deploy.yml`):
testy → průchody hrou (Playwright) → build → GitHub Pages. Když testy selžou, nic se nenasadí.
Průběh je vidět v repozitáři v záložce **Actions**.

Jednorázové nastavení: repozitář → **Settings** → **Pages** → *Source*: **GitHub Actions**.

## Přechod na vlastní doménu

Hra používá jen relativní cesty, takže v kódu se nic měnit nemusí.

1. U registrátora domény nastav DNS:
   - pro hlavní doménu (`kinzle.app`) čtyři záznamy **A**: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`,
   - pro `www` záznam **CNAME** na `kinzle-app.github.io`.
2. V repozitáři → **Settings** → **Pages** → *Custom domain* zadej `kinzle.app` a ulož.
3. Počkej, až GitHub ověří DNS (minuty až hodiny), a zaškrtni **Enforce HTTPS**.
4. Pro pořádek přidej soubor `public/CNAME` s jedním řádkem `kinzle.app`.
   (Při nasazování přes GitHub Actions rozhoduje nastavení v kroku 2, soubor slouží jako záznam v repozitáři.)

Adresa `kinzle-app.github.io` pak bude automaticky přesměrovávat na novou doménu.

## Jak přidat hádanky

Pravidla kvality a ověřovací postup jsou v [content/PRAVIDLA-HADANEK.md](content/PRAVIDLA-HADANEK.md).
Nová hádanka je vždy nejdřív návrh (`content/<jazyk>/drafts/`, `"status": "draft"`) a do hry se dostane až po schválení.

**Várka od Claude:** v Claude Code napiš například

- `/hadanky cs 5` – pět českých hádanek,
- `/hadanky en 3 téma: kuchyně` – tři anglické na téma,
- `/hadanky cs denní od 2026-11-02` – denní hádanky podle rytmu týdne,
- `/hadanky cs kapitola 2` – úrovně 2. kapitoly Cesty.

Claude hádanky vytvoří, ověří (včetně slepého testu samostatným subagentem) a připraví přehled
`content/<jazyk>/drafts/REVIEW.md`. Projdi ho a odpověz třeba „schvaluji cs-0001, cs-0003; cs-0002 oprav: …“.
Schválené hádanky Claude přesune do `puzzles/`, zapíše do rozpisu a nasadí.

**Vlastní hádanka v editoru:** `npm run editor` otevře formulář s živým náhledem a kontrolou pravidel.
Hádanku ulož do `content/<jazyk>/drafts/` a požádej Claude o ověření a zařazení.

**Kontrola:** `npm run validate` zkontroluje všechny hádanky, rozpis denních hádanek (jen schválené, bez opakování,
rytmus týdne), balíčky a texty a vypíše, na kolik dní dopředu jsou denní hádanky naplánované
(varuje pod 14 dní). Běží i v GitHub Actions před každým nasazením.

**Oprava hádanky:** `/oprav-hadanku cs-0007 skupina Ovoce je sporná` – najde příčinu, opraví, znovu ověří a předloží ke schválení.
