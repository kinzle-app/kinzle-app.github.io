# Changelog

## Nevydáno – Fáze 3 (průběžně)

- Pravidla hádanek, `npm run validate` (obsah, rytmus týdne, zásoba, texty), editor hádanek, příkazy `/hadanky` a `/oprav-hadanku`, `docs/FAIR-PLAY.md`.
- Prvních 5 schválených denních hádanek (cs-0001 až cs-0005).
- Nová úvodní obrazovka se záložkami Denní / Cesta / Více.
- Denní hádanka podle času Europe/Prague s číslem (Kinzle #N), jednou denně, po dohrání výsledek a odpočet do další; když rozpis dojde, repríza starší hádanky (pro všechny stejná).
- Archiv starších denních hádanek.
- Historie her se schématem verze; poškozená data hru neshodí.
- Váček se semínky: každá vyřešená skupina = semínko, čistá hra = vzácné ✦.
- Statistiky a záloha postupu do souboru (export a import).
- Cesta (Dějství I): herní plán kapitoly ve stylu Deskovky (SVG), úrovně se odemykají dohráním, hvězdy 1–3 jen jako odměna, po 3 neúspěších jde úroveň přeskočit, oddechové a mistrovské úrovně, ozdoba za kapitolu na všechny hvězdy.
- Příběh: úvod dějství a kapitoly (s tlačítkem Přeskočit), konec kapitoly se střípkem o Praslovu, zápisník s vlastním tipem.
- 1. kapitola „U kuchyňského stolu“ s 10 schválenými úrovněmi.
- Volná hra: dohrané úrovně Cesty a starší denní hádanky, filtr lehké / střední / těžké (zatím podle plánované úrovně).
- Balíčky: seznam, postup v balíčku, připravený vzhled zamčeného balíčku, `entitlements.js` (zatím vše odemčené).
- Okno „Co je nového“ podle `content/<jazyk>/news.json` (jednou po aktualizaci).
- Obsah se stahuje z webu (`content/manifest.json`, jen změněné soubory) a použije se při dalším spuštění; zabalená kopie funguje offline.
- Nápověda „Ukázat dvě slova, která patří k sobě“ místo jednoho slova; nápovědy se ukazují jako trvalý řádek nad kostičkami, označené kostičky mají výrazný pruh, u každé volby je vysvětlení.
- Váček se semínky má novou podobu: semínka jako barevná zrnka v mřížce karet, přehled podle obtížnosti a krátké vysvětlení, k čemu jsou.
- Moje hry: seznam odehraných her po dnech s filtrem a detail s pokusy po řadě (ukládají se od této verze) a všemi skupinami s vysvětlením.
- Volná hra je teď Trénink: bez bodů, časomíry a limitu chyb, nápovědy zdarma; do statistik se nepočítá.
- Angličtina má úrovně Easy / Medium / Hard: volba na konci návodu a v nastavení, každá úroveň má vlastní denní hádanku, na úvodu odkazy na dnešní hádanky ostatních úrovní; archiv a Volná hra podle zvolené úrovně, balíček se štítkem úrovně.
- Česká sada na první měsíc: 30 denních hádanek (12. 10. – 10. 11.), 1. kapitola Cesty (10 úrovní), balíček „V dílně“. Anglicky prvních 5 denních hádanek (Hard).
- Oprava: na posledním kroku návodu se místo skrytého tlačítka vypisovalo „false“.
- Testovací režim `?debug`: posun data a času, simulace offline, odemčení Cesty, semínka, vynulování, repríza, „Co je nového“.

## 0.2.0 – Fáze 2: hratelnost (2026-10-14)

- Body podle `src/config/scoring.js`: skupiny podle obtížnosti, bonus za odvahu, časový bonus, čistá hra, srážky za chyby a nápovědy. Po prohře zůstanou body za vyřešené skupiny.
- Viditelný časovač, který se při odchodu z aplikace (i do nastavení) pozastaví.
- Nápovědy (max. 2): název nejlehčí nevyřešené skupiny (−15) nebo jedno její slovo s barevným okrajem (−20).
- Animace: zamáčknutí kostičky, zatřesení při chybě, přátelské poskočení u „těsně vedle“, sletění kostiček do pruhu skupiny, plynulé míchání, konfety z kostiček, naskakující body. Vše zkrácené při omezení animací.
- Jemné zvuky (Web Audio, bez souborů) a vibrace na Androidu. Všechny časy a intenzity v `src/config/feel.js`.
- Výherní obrazovka s rozpisem bodů a tlačítkem Sdílet (text, případně schránka).
- Úvodní návod (3 obrazovky) při prvním spuštění, kdykoli dostupný přes ikonu otazníku.
- Nastavení jako samostatná obrazovka: jazyk, stůl, velikost písma, zvuky, vibrace, omezení animací, režim pro barvoslepé.
- Tlačítko Zpět na Androidu zavírá okna a vrací mezi obrazovkami; rozehraná hra přežije návštěvu nastavení.
- Starší vyřešené skupiny sbalí vysvětlení (klepnutím se rozbalí), aby se hra vešla na displej.
- Opravy: dlouhá slova se měří přes canvas a na Androidu už nepřetékají; prohlížeč na mobilu sám nezvětšuje písmo.
- Testy průchodů hrou v Playwrightu (mobilní rozlišení, na GitHubu i WebKit jako iPhone).

## 0.1.0 – Fáze 1: základ hry (2026-10-14)

- Projekt Vite + čistý JavaScript, testy ve Vitestu, nasazení na GitHub Pages přes GitHub Actions.
- Herní logika: výběr 4 kostiček, vyhodnocení, 4 pokusy, hláška „Těsně vedle“ při 3 ze 4,
  opakovaná kombinace se nepočítá, výhra a prohra s postupným odkrytím zbylých skupin.
- Velikosti 3×4, 4×4 a 5×4.
- Vzhled Deskovka: Večerní a Denní stůl („Pergamen“), volba Podle telefonu, stůl se nastaví před prvním vykreslením.
- Barvy skupin se symboly ● ▲ ■ ◆ ★, 5. obtížnost vínová místo mechové (lepší rozlišení pro barvoslepé).
- Dlouhá slova se zmenší, na úzkém displeji se rozdělí na dva řádky. Nikdy se neořezávají.
- Čeština a angličtina, jazyk podle prohlížeče, pevné mezery po jednopísmenných předložkách.
- Písmo Bricolage Grotesque uložené v aplikaci.
- 5 zkušebních hádanek pro každý jazyk.
