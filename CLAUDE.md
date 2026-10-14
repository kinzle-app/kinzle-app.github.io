# CLAUDE.md

Tradeoff: Tato pravidla preferují opatrnost před rychlostí. U triviálních úkolů použij selský rozum.

## 1. Nejdřív přemýšlej, pak piš kód
Nepředpokládej. Neskrývej zmatek. Pojmenuj tradeoffy.

Před implementací:

* Své předpoklady řekni nahlas. Pokud si nejsi jistý, zeptej se.
* Pokud existuje víc možných výkladů, ukaž je — nevybírej potichu.
* Pokud existuje jednodušší cesta, řekni to. Když to dává smysl, oponuj.
* Pokud je něco nejasné, zastav se. Pojmenuj, co tě mate. Zeptej se.

## 2. Nejdřív jednoduchost
Minimum kódu, který řeší daný problém. Nic spekulativního.

* Žádné featury navíc, které nebyly zadány.
* Žádné abstrakce pro kód použitý jen jednou.
* Žádná „flexibilita" nebo „konfigurovatelnost", o kterou nikdo nepožádal.
* Žádné ošetření chyb pro scénáře, které nemůžou nastat.
* Pokud jsi napsal 200 řádek a šlo to na 50, přepiš to.

Zeptej se sám sebe: „Řekl by senior engineer, že je to zbytečně složité?" Pokud ano, zjednoduš.

## 3. Zásahy, opravy a updaty
Sahej jen na to, na co musíš. Uklízej jen po sobě.

Když upravuješ existující kód:

* „Nevylepšuj" sousední kód, komentáře ani formátování.
* Nerefaktoruj věci, které nejsou rozbité.
* Drž se stávajícího stylu, i kdybys to dělal jinak.
* Pokud si všimneš nesouvisejícího mrtvého kódu, zmiň ho — nemaž ho.

Když tvé změny vytvoří „osiřelý" kód:

* Smaž importy / proměnné / funkce, které tvé změny udělaly nepoužívanými.
* Nemaž mrtvý kód, který tu byl už předtím, pokud o to nikdo nepožádá.

Test: Každý změněný řádek by měl jít přímo dohledat k požadavku uživatele.

## 4. Exekuce podle cíle
Definuj kritéria úspěchu. Cyklicky ověřuj, dokud nesedí.

Z úkolů udělej ověřitelné cíle:

* „Přidej validaci" → „Napiš testy pro neplatné vstupy a pak je doveď k zelené."
* „Oprav ten bug" → „Napiš test, který bug reprodukuje, a pak ho doveď k zelené."
* „Zrefaktoruj X" → „Zkontroluj, že testy projdou před i po."

U vícekrokových úkolů sepiš krátký plán:

```
1. [Krok] → ověření: [kontrola]
2. [Krok] → ověření: [kontrola]
3. [Krok] → ověření: [kontrola]
```

Silná kritéria úspěchu ti umožní pracovat samostatně v cyklu. Slabá kritéria („udělej to, ať to funguje") vyžadují neustálé doptávání.

## Synchronizace přes GitHub (vždy dodržuj)
- Na začátku každé session, ještě před jakoukoli prací:
  1. Zkontroluj `git status` — pokud existují nekomitnuté změny, nejdřív se zeptej, co s nimi, než se pokračuje dál (slepý pull přes rozdělanou práci by ji mohl zkomplikovat).
  2. Spusť `git fetch` a `git pull --ff-only` hlavní větve main. Pokud fast-forward nejde (lokální a vzdálená větev se rozešly), nic nevynucuj ani neslučuj automaticky — zastav se a zeptej se.
  3. Zkontroluj, jestli na GitHubu nejsou nesloučené větve (např. `claude/...`) z práce na mobilu nebo v cloudu. Pokud ano, řekni mi o nich a zeptej se, jestli je mám sloučit do main.
- Po dokončení každého úkolu, který změnil soubory v repozitáři: commitni změny s krátkou výstižnou zprávou a pushni je do main.
- Pokud pushnout do main nejde (např. v cloudu), vytvoř pull request a slouč ho do main.
- Pokud nastane konflikt nebo hrozí přepsání cizích změn, nic nepřepisuj a zeptej se mě.

## Architektura Kinzle
- Zadání: veřejné v `docs/ZADANI.md`; úplné (s příběhem Cesty a plány po spuštění) jen lokálně v `ZADANI-KINZLE.md` a `docs/PO-SPUSTENI.md`, oba v `.gitignore`. Spoilery příběhu nikdy necommituj.
- Vite + čistý JS (ES moduly), testy Vitest (`npm test`), nasazení GitHub Actions → GitHub Pages při pushi do `main`.
- `src/game/` – herní logika bez UI (`engine.js` pravidla a nápovědy, `score.js` body, `timer.js` časovač, `puzzle.js` kontrola hádanky, `calendar.js` dny podle Europe/Prague, `daily.js` denní hádanka a repríza, `progress.js` historie her se schématem verze, přeskočené úrovně, přečtený příběh, zápisník, váček se semínky, statistiky, záloha; `path.js` stav úrovní a kapitol Cesty, hvězdy, přeskočení po 3 neúspěších, rozmístění plánu; `free.js` výběr a obtížnost Volné hry). Vše pokryté testy v `tests/`.
- `src/config/scoring.js` (body), `src/config/feel.js` (časy animací, zvuky, vibrace), `src/config/rhythm.js` (rytmus týdne), `src/config/remote.js` (adresa obsahu na webu), `src/config/tiers.js` (úrovně jazyka Easy / Medium / Hard – zatím jen angličtina; hádanka má pole `tier`, `daily.json` má rozpis pro každou úroveň, denní záznam v historii má `tier`, hráč volí v nastavení a na konci návodu; `activeTier()` v `content.js`) – ladicí čísla jen tady.
- `src/services/` – vrstvy vyměnitelné za Capacitor: `storage.js` (data, fallback do paměti), `i18n.js` + `typography.js` (texty, `Intl.PluralRules`, pevné mezery), `content.js` (veškerý obsah – jediné místo, kde se řeší jeho zdroj: zabalená kopie + stažená novější z webu přes `content-sync.js` a `content/manifest.json`, který vyrobí `scripts/content-files.js` při sestavení; nový obsah platí od dalšího spuštění), `entitlements.js` (odemčené balíčky, zatím vše), `debug.js` (testovací režim `?debug`: ve vývoji vždy, v nasazené verzi jen s `"debug": true` v `content/flags.json`), `settings.js`, `progress.js` (uložená historie), `backup.js` (záloha do souboru), `clock.js` (čas hry; ve vývoji a testovacím režimu `?datum=YYYY-MM-DD&cas=HH:MM`), `sound.js` (Web Audio), `haptics.js`, `share.js`.
- `src/ui/` – obrazovky (záložky `daily.js` / `path.js` / `more.js` přes `tabs.js`, dále `game.js`, `archive.js`, `bag.js`, `stats.js`, `settings.js`, `help.js`, `free.js`, `packs.js`, `news.js` okno „Co je nového“, `debug.js` panel testovacího režimu – jen česky, je to nástroj pro autora), `dom.js` (pomocník `h()`, `fitText` měří přes canvas), `anim.js` (WAAPI animace, respektují omezení animací), `modal.js` (dialog zavíratelný tlačítkem Zpět), `prefs.js` (promítnutí nastavení), `theme.js`. Obrazovky přes `#/` (Denní), `#/cesta`, `#/vice`, `#/denni/<datum>` (denní/archiv; u angličtiny i `#/denni/<datum>/<úroveň>` pro denní jiné úrovně), `#/hra/<id>` (volná hra), `#/cesta/<id>` (úroveň Cesty), `#/archiv`, `#/vacek`, `#/statistiky`, `#/zapisnik`, `#/nastaveni`, `#/navod`, `#/volna`, `#/balicky`, `#/balicek/<id>`, `#/balicek/<id>/<hádanka>`, `#/debug` v `main.js`; `history.state.depth` kvůli tlačítku Zpět. Rozehrané hry drží `game.js` v paměti (`sessions`, klíč režim:hádanka); po konci hry `onFinish` uloží výsledek do historie. Návrhy (`drafts/`) jsou vidět jen ve vývojové verzi (záložka Více).
- Testy: Vitest (`tests/`) a Playwright (`e2e/`, mobilní rozlišení; na Windows jen Chromium, v CI i WebKit). Playwright vždy sestaví čerstvou verzi na portu 4319.
- Barvy jen přes tokeny v `src/ui/styles/tokens.css` (Večerní = `:root`, Denní = `[data-table='day']`); test `tests/contrast.test.js` hlídá kontrast 4,5:1. Stůl se nastavuje před vykreslením skriptem v `index.html` (klíč `kinzle:settings`).
- Žádný text natvrdo: vše v `src/locales/<jazyk>.json`, oba soubory musí mít stejné klíče (hlídá test).
- Obsah: `content/<jazyk>/puzzles/<id>.json` (schválené), `drafts/` (návrhy), `daily.json` (datum → id), `packs.json` (návrh balíčku má `"draft": true` a je vidět jen ve vývoji), `news.json` (nejnovější první), `content/flags.json` (přepínače), `path.json` (dějství → kapitoly → úrovně, motiv plánu) a `story.json` (texty dějství a kapitol, střípky; rozuzlení nikdy do repozitáře). Hádanka na Cestě nesmí být v rozpisu denních (hlídá validate). Pravidla a ověřovací postup v `content/PRAVIDLA-HADANEK.md`, tvorba přes `/hadanky`, opravy `/oprav-hadanku`. `npm run validate` (`scripts/validate.js`) hlídá obsah, rytmus týdne, zásobu a texty. Den hádanky podle Europe/Prague (`src/game/calendar.js`).
- Editor hádanek: `npm run editor` (`tools/editor.html`, nenasazuje se). Zásady fair play: `docs/FAIR-PLAY.md`.
- Relativní cesty všude (`base: './'`), žádná závislost na adrese webu.

---

Tato pravidla fungují, když: v diffech je méně zbytečných změn, méně přepisování kvůli překomplikování, a doptávání přichází před implementací, ne až po chybách.
