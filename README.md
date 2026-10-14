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
| `npm test` | testy (herní logika, překlady, kontrast barev, kontrola všech hádanek) |
| `npm run build` | sestavení hry do složky `dist/` |
| `npm run preview` | spuštění sestavené verze z `dist/` |

## Struktura projektu

```
content/<jazyk>/puzzles/   hádanky (JSON), každá se stabilním id
src/game/                  herní logika bez UI (pravidla, kontrola hádanky)
src/services/              úložiště, překlady, typografie, načítání obsahu, nastavení
src/ui/                    obrazovky a styly (tokens.css = barvy obou stolů)
src/locales/               texty: cs.json, en.json
tests/                     testy ve Vitestu
design/                    náhledy vzhledu (předloha)
docs/                      dokumentace a veřejné zadání
```

## Nasazení

Každý push do větve `main` spustí GitHub Action **Nasazení** (`.github/workflows/deploy.yml`):
testy → build → GitHub Pages. Když testy selžou, nic se nenasadí.
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
