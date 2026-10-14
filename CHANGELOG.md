# Changelog

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
