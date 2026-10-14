# Zadání: Kinzle – slovní hra o hledání souvislostí

> Veřejná verze zadání. Části o příběhu Cesty (dějství, rozuzlení) a plány na dobu po spuštění jsou záměrně jen v neveřejném zadání u autora, aby se hráčům nic nevyzradilo.

Ahoj Claude, postav mi webovou hru **Kinzle**. Než začneš psát kód, přečti si celé zadání, projdi soubor `design/reference.html` (vizuální předloha) a navrhni mi plán první fáze. Po každé fázi se zastav, abych mohl hru vyzkoušet.

Nejsem profesionální programátor, ale pokročilý začátečník. Piš proto čitelný kód s krátkými komentáři v češtině, nic zbytečně nekomplikuj a u každého kroku, který musím udělat sám (Supabase, GitHub, nastavení), mi napiš přesný postup krok za krokem.

---

## 1. O co jde

Hráč dostane mřížku slov (klasicky 16) a má je roztřídit do skupin po čtyřech podle toho, co mají společného. Skupiny mají různou obtížnost a hra obsahuje i záludná slova, která by se hodila do více skupin.

**Název:** Kinzle (kin = příbuzní + puzzle). V češtině i angličtině se jmenuje stejně.

### Právní pravidla (důležité, dodržuj ve všem)

Hra je inspirovaná žánrem slovních asociačních her, ale **nesmí kopírovat žádnou existující hru**:
- Nikde (kód, komentáře, texty, README, popisky) nezmiňuj New York Times, „Connections“ ani jiné konkrétní hry.
- Všechny hádanky musí být **původní**. Nikdy nepřebírej ani nepřekládej hádanky z jiných her nebo jejich archivů.
- Vlastní vizuální styl (viz kapitola 4), vlastní barvy obtížností, vlastní texty a hlášky, **vlastní formát sdílení výsledku**.
- Nepoužívej žlutou / zelenou / modrou / fialovou jako sadu barev obtížností.

---

## 2. Technologie a platformy

- **PWA** (Progressive Web App), mobil na prvním místě, musí výborně fungovat na iPhonu (Safari) i Androidu (Chrome), ale i na počítači.
- **Vite + čistý JavaScript (ES moduly)**, žádný velký framework. Testy přes **Vitest**.
- Hosting na **GitHub Pages**, nasazení přes GitHub Actions při pushi do `main`. Stejně jako u mých předchozích projektů (např. IMPOSTOR: organizace `Impostor-hra`, repozitář `impostor-hra.github.io`) má Kinzle **vlastní GitHub organizaci `kinzle-app`** (založím ji sám) a repozitář **`kinzle-app.github.io`**. Hra tak poběží přímo na adrese **`https://kinzle-app.github.io/`** (kořen, žádná podsložka). **Vlastní doména (např. kinzle.app) přijde později.** Nastav proto Vite a PWA s relativními cestami tak, aby přechod na doménu znamenal jen přidání souboru `CNAME` a úpravu nastavení v GitHubu. Do README napiš postup přechodu na doménu.
- Pozor: GitHub Pages není určené pro komerční prodej. Až zapneme placené balíčky, přesuneme hosting (např. na Cloudflare Pages). Nepoužívej proto nic, co by fungovalo jen na GitHub Pages.
- Backend pro žebříčky: **Supabase** (free plán).
- **Připravenost na pozdější zabalení přes Capacitor** do App Store a Google Play:
  - všechny cesty relativní, žádná závislost na adrese webu,
  - ukládání dat, vibrace, sdílení a zvuky dej za vlastní malé vrstvy (`storage.js`, `haptics.js`, `share.js`, `sound.js`), aby šlo později vyměnit webové API za Capacitor pluginy bez přepisování hry,
  - nespoléhej na funkce, které existují jen v prohlížeči (např. `beforeinstallprompt`) bez náhradního řešení.
- Pracuji **lokálně na svém PC**, nepoužívej cloudové sessions.

---

## 3. Jazyky (CZ / EN)

- Celé UI ve dvou jazycích, **připravené na přidání dalších** jen přidáním souboru.
- Všechny texty v `src/locales/cs.json` a `src/locales/en.json`. **Žádný text natvrdo v kódu.**
- Jazyk se při prvním spuštění zvolí podle prohlížeče, dá se přepnout v nastavení a volba se uloží.
- Data, čísla a časy formátuj přes `Intl`.
- **Hádanky jsou pro každý jazyk vlastní** (slovní hříčky se nedají překládat). Česká a anglická verze má vlastní denní hádanky, vlastní balíčky i vlastní žebříček.

---

## 4. Vizuální styl: „Deskovka“

Předloha je v `design/reference.html`, styl **„1 · Deskovka“** (v předloze je pracovní název „Spojky“, nahraď ho Kinzle; záložku „Nekonečná“ nahraď „Cesta“). Drž se jí co nejvěrněji a dotáhni ji do profesionální kvality.

Charakter: herní stůl se zeleným suknem, kostičky působí jako hmatatelné keramické kameny, které se po kliknutí zamáčknou. Uspokojivé animace a jemné zvuky.

### Barvy (design tokeny v CSS proměnných)

| Token | Hodnota | Použití |
|---|---|---|
| `--felt` | `#1E3A2C` | pozadí |
| `--felt-dark` | `#183024` | panely, lišty |
| `--felt-light` | `#2A4A3A` | tlačítka s ikonou, aktivní záložka |
| `--line` | `#4C6B5B` | obrysy vedlejších tlačítek |
| `--tile` | `#F4EBDD` | kostička |
| `--tile-shadow` | `#C9B99C` | spodní hrana kostičky |
| `--selected` | `#F2C46B` | vybraná kostička, hlavní tlačítko |
| `--selected-shadow` | `#B8873A` | spodní hrana vybrané |
| `--ink` | `#2B2A24` | text na kostičkách |
| `--text` | `#F4EBDD` | text na suknu |
| `--muted` | `#A9C2B4` | méně důležitý text |

**Barvy skupin podle obtížnosti** (vlastní paleta):
1. nejlehčí: šalvěj `#9CC59A`
2. střední: terakota `#E07A4F`
3. těžká: starorůžová `#C98A95`
4. nejtěžší: břidlicová `#8DB0CC`
5. (jen v režimu Těžká 5×4): vínová `#9A4F63` se světlým textem `#F4EBDD` (mech `#7C9A5E` se pro barvoslepé pletl s terakotou)

Každá skupina má i **symbol** (● ▲ ■ ◆ ★) kvůli barvoslepým hráčům. Ověř kontrast textu na každé barvě (min. 4,5:1) a uprav odstín textu, kde je potřeba.

### Dva stoly: Večerní (tmavý) a Denní (světlý, „Pergamen“)
Náhled obou je v `design/stoly.html` (přepínání stolu i obrazovek Hra / Cesta). Barvy výše tvoří **Večerní stůl**. **Denní stůl „Pergamen“** je světlý pergamen, na kterém leží **tmavě zelené panely** jako kousky sukna. Platí na **všech obrazovkách** (hra, Cesta, statistiky, žebříčky, party, nastavení, dialogy, onboarding).

Zaveď proto vedle tokenů výše i tokeny pro **panely** (horní lišta hry, karty, spodní menu, lišta „Další úroveň“ apod.), na Večerním stole odpovídají `--felt-dark`:

| Token | Večerní | Denní (Pergamen) |
|---|---|---|
| `--felt` (pozadí) | `#1E3A2C` | `#F3EFE2` |
| `--felt-light` (ikonová tlačítka, aktivní plochy na pozadí) | `#2A4A3A` | `#E2DCCB` |
| `--line` | `#4C6B5B` | `#C5BDA7` |
| `--tile` | `#F4EBDD` | `#FFFDF7` |
| `--tile-shadow` | `#C9B99C` | `#D6CDB6` |
| `--ink` / `--text` | `#2B2A24` / `#F4EBDD` | `#22302A` / `#22302A` |
| `--muted` | `#A9C2B4` | `#5F6B60` |
| `--panel` | `#183024` | `#2A4A3A` |
| `--panel-text` | `#F4EBDD` | `#F4EBDD` |
| `--panel-muted` | `#A9C2B4` | `#A9C2B4` |
| `--panel-active` (aktivní záložka v panelu) | `#2A4A3A` | `#3A5E4B` |
| `--map` (pozadí herního plánu Cesty) | `#183024` | `#EAE4D3` |
| `--track` / čárkování cesty | `#2F5442` / `#4C6B5B` | `#E7E0CE` / `#BDB49B` |
| `--star` / prázdná hvězda | `#F2C46B` / `#3B5A4A` | `#C98A1E` / `#D9D2BF` |

- **Hlavní tlačítko:** na pozadí stolu je na Denním stole tmavě zelené (`#1E3A2C`, text `#F4EBDD`, hrana `#0F2219`); **uvnitř tmavého panelu** (např. „Hrát“ v liště Další úroveň) je žluté jako na Večerním stole.
- Žlutý výběr kostiček a barvy skupin jsou na obou stolech stejné; ověř kontrast textu na všech plochách obou stolů (min. 4,5:1).
- V nastavení volba **Stůl: Večerní / Denní / Podle telefonu** (podle `prefers-color-scheme`, mění se živě).
- **Výchozí po instalaci je Večerní stůl**, „Podle telefonu“ si hráč zapne sám. Volba se ukládá.
- Stůl se nastaví **před prvním vykreslením** (žádné probliknutí jiné barvy), stejně tak barva lišty prohlížeče (`theme-color`) a splash.
- Obrázky ke sdílení se generují vždy ve Večerním stole, aby značka působila jednotně.

### Typografie a detaily

- Písmo **Bricolage Grotesque** (Google Fonts, váhy 500/700/800), uložené lokálně kvůli offline režimu.
- Kostička: zaoblení 12 px, „3D“ spodní hrana přes `box-shadow`, při výběru se posune dolů o 3 px.
- Dlouhá slova se musí vejít: automaticky zmenši písmo, nikdy neořezávej.
- Animace: výběr, zatřesení při chybě, spojení čtyř kostiček do vyřešené skupiny, konfety nebo podobný efekt při výhře. Respektuj `prefers-reduced-motion`.
- Zvuky (cvaknutí kostičky, úspěch, chyba) jsou krátké, jemné a v nastavení vypínatelné.
- Vibrace při výběru a chybě (Android přes `navigator.vibrate`, na iOS tiše nic).
- Minimální velikost dotykových prvků 44 px, plně ovladatelné i klávesnicí, správné `aria` popisky.

---

## 5. Pravidla hry

### Velikosti hry
- **Lehká:** 3 skupiny × 4 slova (12 kostiček)
- **Klasická:** 4 × 4 (16 kostiček), výchozí
- **Těžká:** 5 × 4 (20 kostiček)

### Průběh
- Hráč vybere 4 kostičky a stiskne „Odeslat“.
- Správně: kostičky se spojí do vyřešené skupiny nahoře, zobrazí se **název skupiny, slova a krátké vysvětlení nebo zajímavost**.
- Špatně: zatřesení, ubyde pokus. Pokusů jsou **4**.
- Pokud jsou 3 ze 4 slov správně, hra to naznačí vlastní hláškou (např. „Těsně vedle!“).
- Stejná kombinace odeslaná znovu se nepočítá jako chyba, jen se upozorní.
- Tlačítka: **Zamíchat**, **Zrušit výběr**, **Odeslat**.
- Po prohře se zbylé skupiny postupně odkryjí i s vysvětlením.

### Nápovědy (stojí body)
- **Odhalit název jedné skupiny** (−15 bodů)
- **Odhalit jedno slovo ze skupiny**: kostička dostane barevný okraj skupiny (−20 bodů)
- Max. 2 nápovědy na hru.

### Body a časovka
Celý výpočet bodů dej do jednoho konfiguračního souboru (`src/config/scoring.js`), abych ho mohl snadno ladit. Výchozí návrh:
- body za skupinu: 10 / 20 / 30 / 40 (/ 50) podle obtížnosti,
- **bonus za odvahu:** +10 za každou skupinu vyřešenou dřív než nějaká lehčí,
- **časový bonus:** až +50, klesá lineárně k nule za 5 minut,
- chyba −10, nápověda podle ceny výše,
- **čistá hra** (bez chyb a nápověd) +25.

Časovač běží viditelně, při odchodu z aplikace se pozastaví.

---

## 6. Herní režimy

1. **Denní hádanka:** stejná pro všechny hráče daného jazyka, mění se o půlnoci podle času Europe/Prague. Číslovaná (Kinzle #142). Hraje se jednou denně, výsledek jde do žebříčku.
2. **Cesta:** hlavní režim mimo denní hádanku, postupně odemykané úrovně na herním plánu, rozdělené do kapitol. Podrobně v kapitole 6a. Nejde do žebříčku.
3. **Volná hra:** hádanky, které hráč už na Cestě prošel (a starší denní), s filtrem **lehké / střední / těžké** podle skutečné obtížnosti z dat hráčů. Na začátku jen podle plánované obtížnosti. Nejde do žebříčku.
4. **Archiv:** dohrání starších denních hádanek (bez žebříčku).
5. **Balíčky:** tematické sady hádanek (viz kapitola 9, zatím všechny zdarma).
6. **Souboj:** hráč dohraje hádanku a pošle kamarádovi odkaz. Kamarád hraje stejnou hádanku a na konci vidí srovnání (body, čas, chyby). Funguje bez serveru, výsledek odesílatele je zakódovaný v odkazu.
7. **Vlastní hádanka:** hráč si v jednoduchém formuláři vytvoří hádanku (skupiny, slova, volitelné vysvětlení) a sdílí ji odkazem. Data jsou zakódovaná a zkomprimovaná v URL, bez serveru. Validace (počty slov, délky, žádná duplicitní slova) a hra je jasně označená jako „Hádanka od hráče“. Do žebříčku se nepočítá.

### 6a. Cesta úrovní: poctivě, ne lacině

Cesta musí působit jako **řemeslně postavená hra, ne jako automat na peníze**. Tyto zásady sepiš i do `docs/FAIR-PLAY.md` a dodržuj je ve všech budoucích úpravách (i až přijdou placené věci):

**Nikdy:**
- žádné životy, energie ani čekání („další hra za 30 minut“),
- žádné placené nápovědy, přeskakování ani zkratky v postupu,
- žádné umělé zdržování, odpočty „nabídka končí za…“, falešná naléhavost ani zbytečné notifikace,
- žádné reklamy, žádné loot boxy,
- hvězdy **nikdy nezamykají** postup (žádné „potřebuješ 25 hvězd na další kapitolu“).

**Vždy:**
- další úroveň se odemkne **dohráním** té předchozí, bez ohledu na počet hvězd,
- opakování úrovně je neomezené a okamžité,
- po 3 neúspěšných pokusech jde úroveň **přeskočit** a vrátit se k ní později; nikdo se nesmí zaseknout,
- hráč vždy vidí, co ho čeká: počet úrovní v kapitole, kolik kapitol existuje a kdy přibude další („Další kapitola brzy“), žádná skrytá počítadla.

**Herní plán:** (náhled v `design/cesta.html`)
- Ve stylu Deskovky: cesta po herním plánu, úrovně jako kostičky nebo políčka, kreslené přes SVG, žádné stažené obrázky. Na Večerním i Denním stole.
- **Kapitoly** po 10 úrovních s vlastním názvem a jemně odlišným motivem plánu (barva, ornament). Pořadí a složení kapitol je v `content/<jazyk>/path.json`, takže kapitolu přidám bez zásahu do kódu.
- **Křivka obtížnosti s oddechem:** obtížnost v kapitole stoupá, ale každá 4.–5. úroveň je lehčí „oddechovka“. Poslední úroveň kapitoly je **mistrovská** (těžká 5×4 nebo zvlášť chytrá).
- V kapitolách se střídají velikosti 3×4, 4×4 a 5×4 (Lehká a Těžká velikost se hrají hlavně tady).
- **Hvězdy 1–3** jen jako odměna: 3 = bez chyby a bez nápovědy, 2 = max. 1 chyba nebo nápověda, 1 = dohráno. Kapitola dokončená na všechny 3 hvězdy dostane na plánu ozdobu.
- **Dějství:** Cesta je rozdělená do **dějství** (podrobnosti v neveřejném zadání). Postup na Cestě je součástí zálohy i kódu pro obnovení.

**Pravidla pro všechna dějství:**
- Systém (`content/<jazyk>/story.json`, `path.json`) navrhni tak, aby se další dějství a jejich herní plány přidávaly **převážně obsahem a konfigurací**, ne přepisováním hry. Motiv herního plánu (barvy, směr cesty, ornament) je součástí dat kapitoly či dějství.
- **Kapitoly jsou volně tematické:** 2–3 hádanky z 10 sedí k místu kapitoly, ostatní jsou různé.
- **Příběh je lehký:** 1–2 věty na začátku a na konci kapitoly, vždy s tlačítkem Přeskočit, nikdy nezdržuje hraní.
- **Střípky a zápisník:** konec každé kapitoly odhalí střípek příběhu. Hráč si může do zápisníku zapsat svůj tip; tip se jen ukládá, nic se nehodnotí a jde sdílet jako obrázek.
- **Každý jazyk (CZ i EN) má vlastní příběh**, oba jazyky se plní souběžně, ne překladem.
- **Rozuzlení se do repozitáře nedává, dokud finální kapitola nevyjde** (obsah je veřejně čitelný). Zatím zástupný text. Názvy kapitol a střípky navrhuj ve várkách ke schválení do `REVIEW.md`.
- **Tempo vydávání:** cíl je nová kapitola zhruba **každé 2 týdny** v obou jazycích; každá nová kapitola se oznámí v okně „Co je nového“. Hlídání zásoby obsahu (kapitola 9) sleduje i Cestu: varuj, když do konce poslední vydané kapitoly zbývá většině hráčů méně než 2 týdny hraní.

**Váček se semínky (od prvního dne):**
- Každá vyřešená skupina kdekoli ve hře (denní, Cesta, Volná hra, balíčky) přidá do hráčova **váčku** semínko se slovy té skupiny. Čistá hra přidá vzácnější semínko, splněný týdenní cíl zlaté.
- Váček je vidět na úvodní obrazovce s počtem semínek a jde v něm listovat (skupina, slova, datum), takže slouží i jako sbírka vyřešených skupin.
- Data váčku se odvozují z lokální historie her a zálohují se se statistikami i kódem pro obnovení.
- Do Cesty patří jen hádanky, které nejsou v budoucím rozpisu denních hádanek, aby si hráč denní hádanku nevyzradil předem. Odehrané denní hádanky mohou později doplnit Volnou hru.

**Do budoucna (teď neprogramovat):** pokud někdy budou placené kapitoly, první kapitoly zůstanou navždy zdarma, placená kapitola bude jasně označená **před** vstupem a nikdy se nebude prodávat postup ani pomoc uvnitř kapitoly.

---

## 7. Žebříčky (Supabase)

- **Bez registrace:** hráč si při prvním odeslání výsledku zvolí přezdívku. Použij **anonymní přihlášení Supabase**, aby byl výsledek svázaný se zařízením.
- Přezdívka: 3–16 znaků, povolené znaky, filtr sprostých slov (CZ i EN), unikátní.
- Žebříčky: **dnešní denní hádanka**, **týden**, **celkově**, zvlášť pro CZ a EN. Zobraz top 50 a vlastní pozici hráče.
- **Ochrana proti podvádění (základní):**
  - výsledek se ukládá přes databázovou funkci (RPC), ne přímým zápisem do tabulky,
  - funkce kontroluje rozumné hodnoty (max. možné body, minimální čas),
  - jeden výsledek na hráče a denní hádanku (unikátní omezení),
  - Row Level Security zapnuté na všech tabulkách.
- **Offline:** když není připojení, výsledek se uloží do fronty a odešle se později.
- **Šetři limity free plánu:** žebříček načítej přes jednu RPC funkci (top 50 + pozice hráče v jedné odpovědi, jen potřebné sloupce), výsledek v aplikaci drž v mezipaměti aspoň 60 sekund a nenačítej ho automaticky na pozadí.
- V repozitáři smí být jen veřejný `anon` klíč, **nikdy** `service_role` klíč.
- Databázové změny piš jako SQL migrace ve složce `supabase/migrations/` a napiš mi přesně, jak je spustím v Supabase dashboardu.
- Na Supabase už mám jeden projekt (moje-knihovna). Pro Kinzle založíme nový projekt „kinzle“. Free plán dovoluje 2 aktivní projekty.

### Automatický ping proti uspání
Free projekt se po 7 dnech bez aktivity uspí. Přidej **GitHub Action**, která **každé 3 dny** pošle jednoduchý dotaz na Supabase (např. čtení z malé tabulky `ping`). URL a anon klíč ulož do **GitHub Secrets** (ne do kódu) a napiš mi návod, jak je tam nastavím.

### GDPR
- Ukládáme jen přezdívku, výsledky a anonymní ID, žádný e-mail.
- Stránka **Zásady ochrany soukromí** (CZ/EN): co ukládáme, proč a jak dlouho.
- V nastavení tlačítko **„Smazat moje data“** (smaže výsledky i přezdívku na serveru i v zařízení).

---

## 8. Statistiky, sdílení a další obrazovky

### Statistiky (lokálně v zařízení)
Odehrané hry, úspěšnost, týdenní cíl a kalendář s razítky (viz kapitola 14, žádné tvrdé série dní), rozložení chyb, průměrný čas, nejlepší skóre. Data ukládej s **číslem verze schématu**, aby se při budoucích úpravách nic neztratilo. Přidej **export a import zálohy** do souboru.

### Sdílení výsledku
- **Vlastní formát**, žádná mřížka barevných čtverečků. Text např.: `Kinzle #142 · 180 b. · 2:41 · 1 chyba` + odkaz.
- Navíc **obrázek s výsledkem** vygenerovaný přes canvas ve stylu Deskovky (pro Instagram stories a WhatsApp).
- Web Share API, jinak kopírování do schránky.

### Nahlášení hádanky
Na konci každé hry (a v menu během hry) tlačítko **„Nahlásit hádanku“**: hráč vybere důvod (nejasná skupina, slovo patří i jinam, překlep, nepravdivá zajímavost, jiné) a může připsat krátkou poznámku. Uloží se do tabulky `reports` v Supabase (id hádanky, jazyk, důvod, text, datum, anonymní id). Omez počet hlášení na hráče a den. Přidej mi jednoduchý způsob, jak hlášení procházet (SQL dotaz v README stačí).

### Počítání hráčů (bez cookies)
Napoj **GoatCounter** (bez cookies, zdarma pro rozumné použití) a počítej jen základní události: otevření hry, dohraná denní hádanka, dohraná jiná hra, sdílení. Žádná osobní data. Měření dej za vrstvu `analytics.js`, aby šlo snadno vypnout nebo vyměnit. Zmiň ho v Zásadách ochrany soukromí.

### Další obrazovky
- **Úvodní návod** při prvním spuštění (3 krátké obrazovky) + kdykoli dostupná nápověda.
- **Nastavení:** jazyk, stůl (Večerní / Denní / Podle telefonu), zvuky, vibrace, omezení animací, režim pro barvoslepé (symboly vždy viditelné), velikost písma.
- **O hře** a **Zásady ochrany soukromí**.

---

## 9. Obsah a jeho snadné rozšiřování (velmi důležité)

U své předchozí appky jsem pořád dodatečně přidával věci, které šly vyřešit hned na začátku. Proto chci, aby byl **obsah úplně oddělený od kódu** a jeho přidávání bylo snadné a bezpečné.

### Struktura dat
```
content/
  cs/
    puzzles/        – jednotlivé hádanky (JSON, každá se stabilním id)
    daily.json      – rozpis: datum → id hádanky
    packs.json      – balíčky: id, název, popis, seznam hádanek, cena, zamčeno
  en/
    (stejně)
```
Každá hádanka má: `id`, `language`, `size` (3/4/5 skupin), skupiny (`title`, `difficulty` 1–5, `words`, `explanation`), autora a datum vytvoření. Pokrok a statistiky se vážou na `id`, takže úprava obsahu nesmí smazat pokrok.

### Kontrolní skript
`npm run validate` zkontroluje všechny hádanky: počty slov, žádné duplicitní slovo v jedné hádance, unikátní id, vyplněná vysvětlení, délka slov (aby se vešla na kostičku), že každý den v `daily.json` odkazuje na existující **schválenou** hádanku a že se denní hádanky neopakují. Spouští se i v GitHub Actions před nasazením.

### Hlídání zásoby denních hádanek
- `npm run validate` vypíše, na kolik dní dopředu má každý jazyk naplánované denní hádanky, a **varuje, když zbývá méně než 14 dní**.
- GitHub Action jednou denně zkontroluje zásobu a při méně než 14 dnech **založí v repozitáři issue** (GitHub mi pošle e-mail). Stejná akce může běžet společně s pingem Supabase.
- Když denní hádanky přesto dojdou, hra **nikdy neukáže prázdnou obrazovku**: deterministicky (podle data, pro všechny stejně) vybere starší schválenou hádanku, označí ji jako „Repríza“ a žebříček funguje normálně.

### Editor hádanek (jen pro mě)
Samostatná stránka `tools/editor.html`, kterou spustím lokálně: formulář na vytvoření hádanky, živý náhled ve stylu hry, kontrola pravidel a uložení jako JSON soubor do správné složky. Není součástí nasazené hry.

### Návod pro mě
V README sekce „Jak přidat hádanky“: jak použít editor, jak požádat Claude o novou várku hádanek a jak je zkontrolovat.

### Tvorba hádanek: pravidla kvality (nejdůležitější část obsahu)

Hra stojí a padá na kvalitě hádanek. Každá hádanka musí dávat smysl, mít **jediné správné řešení** a být ověřená dřív, než ji uvidím. Sepiš proto pravidla do souboru `content/PRAVIDLA-HADANEK.md` a vždy podle nich postupuj.

**Pravidla pro obsah:**
- Slova, která zná běžný dospělý člověk. Žádná odborná, nářeční, zastaralá ani vzácná slova, žádný slang a vulgarity.
- Slova v základním tvaru (v češtině 1. pád jednotného čísla), pokud skupina výslovně nepracuje s tvarem slova.
- Pestré typy skupin, ne jen „druhy něčeho“: význam (druhy, části, vlastnosti), slovní hříčky (slova před/za společným slovem, skrytá slova, rýmy), ustálená spojení a idiomy, společná vlastnost („dá se ladit“). V jedné hádance max. 2 skupiny stejného typu.
- **Název skupiny je přesný.** Ne „Zvířata“, ale „Zvířata, která přezimují ve spánku“. Hráč musí po vyřešení říct „aha, jasně“, ne „to je sporné“.
- Každá hádanka má 1–3 **záludná slova**, která na první pohled sedí i jinam, ale při pozorném čtení názvu skupiny jednoznačně nepatří.
- Obtížnost skupin 1–4 (5) musí odpovídat skutečnosti: lehká skupina je vidět hned, nejtěžší vyžaduje „aha moment“.
- Vysvětlení nebo zajímavost u každé skupiny musí být **fakticky pravdivé**. Když si nejsi jistý, ověř to na webu, nebo napiš jen jednoduché vysvětlení bez faktu.
- České a anglické hádanky jsou **samostatně vymyšlené**, ne překlady. Anglické piš tak, aby byly srozumitelné hráčům z různých zemí (žádné úzce americké nebo britské reálie).
- Všechno původní, nikdy nepřebírej hádanky z jiných her.

**Povinný ověřovací postup pro každou hádanku:**
1. **Kontrola jednoznačnosti:** u každého ze všech slov vypiš, do kterých skupin hádanky by mohlo patřit. Pokud slovo sedí do dvou skupin stejně dobře, uprav název skupiny nebo vyměň slovo.
2. **Hledání alternativního řešení:** zkus aktivně najít jiné rozdělení slov, které by dávalo smysl. Pokud existuje, hádanka se musí opravit.
3. **Slepý test:** spusť samostatného subagenta, který dostane **jen zamíchaná slova bez řešení**, a nech ho hádanku vyřešit a zdůvodnit. Pokud najde jiné obhajitelné řešení nebo se zasekne kvůli nejasnosti (ne kvůli obtížnosti), hádanku oprav a test zopakuj.
4. **Jazyková kontrola:** pravopis, diakritika, základní tvar, existence a běžnost slova. U českých slov v pochybnostech ověř v Internetové jazykové příručce (prirucka.ujc.cas.cz).
5. **Kontrola faktů** ve vysvětleních.
6. **Kontrola délky** slov na kostičce (`npm run validate`).

**Schvalování:**
- Nové hádanky se ukládají se stavem `"status": "draft"` do `content/<jazyk>/drafts/`.
- Ke každé várce vytvoř **přehled pro mě** (`content/<jazyk>/drafts/REVIEW.md`): hádanka, řešení, záludná slova, výsledek slepého testu a co jsi během ověřování opravil.
- Teprve **po mém schválení** se hádanka přesune do `puzzles/` se stavem `"approved"` a smí do `daily.json` nebo balíčku. `npm run validate` odmítne neschválenou hádanku v rozpisu.
- Hádanky tvoř v **menších várkách (max. 5)**, kvalita má přednost před množstvím.

**Opakovatelný příkaz:** vytvoř vlastní příkaz pro Claude Code `.claude/commands/hadanky.md`, abych mohl později napsat např. `/hadanky cs 5` nebo `/hadanky en 3 téma: kuchyně` a celý postup výše (tvorba, ověření, slepý test, přehled) proběhl automaticky bez dalšího vysvětlování. Pokud hlášení hráčů (tabulka `reports`) ukáží na problémovou hádanku, chci i příkaz `/oprav-hadanku <id>`.

### Úvodní obsah
Úvodní sada má vystačit **na první měsíc** provozu. Podle postupu výše vytvoř pro každý jazyk:
- **30 denních hádanek (4×4)** rozplánovaných podle rytmu týdne; víkendový speciál ve velikosti 5×4,
- **1. kapitolu Cesty: 10 úrovní** s křivkou obtížnosti podle kapitoly 6a (mix 3×4, 4×4, 5×4, mistrovská úroveň na konci),
- **1 ukázkový balíček se 3 hádankami** (téma vyber sám).

Kvalita má přednost před rychlostí: tvoř ve várkách **po 5**, každou várku ověř a dej mi ke schválení, než začneš další. Nejdřív celou **českou** sadu, potom anglickou. Všechno nejdřív jako `draft` s přehledem pro mě. Další várky budu přidávat přes příkaz `/hadanky` (umí i `/hadanky cs kapitola 2`).

---

## 10. Příprava na peníze (zatím nic neprogramovat)

Hra bude zatím **úplně zdarma**. Později chci prodávat **tematické balíčky** (žádné reklamy). Připrav jen strukturu:
- balíčky mají pole `price` a `locked`,
- jeden modul `entitlements.js` s funkcí `isUnlocked(packId)`, která teď vždy vrací `true`,
- v UI se balíček dá zobrazit jako „zamčený“ (připravený vzhled, zatím nepoužitý).

Platby (Stripe / GoPay na webu, nákupy v aplikaci v obchodech) přijdou později.

---

## 11. PWA a offline

- Manifest, ikony (navrhni ikonu ve stylu Deskovky: 4 kostičky 2×2), splash barvy podle `--felt`.
- Service worker: hra (včetně hádanek) funguje **offline**, žebříček se při výpadku spojení schová nebo ukáže poslední stav.
- Když vyjde nová verze, ukaž nenápadnou hlášku „Je dostupná nová verze – obnovit“.
- Při každé změně obsahu nebo kódu se verze cache automaticky zvýší.
- Otestuj „Přidat na plochu“ na iOS i Androidu (správná ikona, celá obrazovka, žádné okraje kolem výřezu displeje).

---

## 12. Kvalita a struktura projektu

- Herní logika (vyhodnocení, body, generování denní hádanky, kódování odkazů) je oddělená od UI a pokrytá **testy ve Vitestu**.
- Přehledná struktura složek (`src/game`, `src/ui`, `src/services`, `src/locales`, `src/config`, `content`, `tools`, `supabase`).
- V kořeni projektu je můj `CLAUDE.md` s pracovními principy. Dodržuj ho a přidej do něj krátkou sekci o architektuře Kinzle, aby se v projektu vyznala každá další session.
- Veď `CHANGELOG.md`.
- Na konci každé fáze: Lighthouse kontrola (PWA, přístupnost, výkon) a krátký **testovací checklist pro mě** (co mám na mobilu vyzkoušet).

---

## 13. Postup po fázích

Po každé fázi se zastav, shrň, co je hotové, a dej mi checklist na testování. Kapitoly 15 a 16 platí průběžně pro všechny fáze.

1. **Základ hry:** `git init`, propojení s veřejným repozitářem `kinzle-app/kinzle-app.github.io` (organizaci a prázdný repozitář založím sám, ty mi jen řekni, kdy a jak; místní git nastav na jméno `Kinzle` a e-mail `kinzle-app@users.noreply.github.com` jako u Kasírky) a první push, aby fungovala synchronizace z mého CLAUDE.md; projekt, design Deskovky, mřížka, výběr, vyhodnocení, pokusy, vyřešené skupiny s vysvětlením, velikosti 3/4/5, CZ/EN, 5 testovacích hádanek, nasazení na GitHub Pages.
2. **Hratelnost:** body, časovač, nápovědy, animace, zvuky, vibrace, úvodní návod, nastavení.
3. **Režimy a obsah:** denní hádanka (včetně reprízy), Cesta úrovní (Dějství I) s kapitolami, hvězdami, příběhem, střípky a zápisníkem, systém dějství připravený na další obsah, **váček se semínky**, Volná hra s filtrem, archiv, balíčky, statistiky se zálohou, struktura obsahu, `npm run validate` s hlídáním zásoby, editor hádanek, `PRAVIDLA-HADANEK.md`, příkazy `/hadanky` a `/oprav-hadanku`, `docs/FAIR-PLAY.md`, úvodní obsah na první měsíc jako drafty k mému schválení.
4. **Žebříčky:** Supabase (migrace, RLS, RPC, anonymní přihlášení, přezdívky), žebříčky, offline fronta, nahlášení hádanky, GitHub Action s pingem a hlídáním zásoby hádanek, GDPR stránka a smazání dat.
5. **Sociální funkce:** souboj přes odkaz, vlastní hádanka přes odkaz, sdílení textu a obrázku.
6. **Dotažení:** PWA a offline, aktualizace verzí, ikony, GoatCounter, přístupnost, Lighthouse, příprava na Capacitor (kontrola vrstev), návod na přechod na vlastní doménu, finální README.
7. **Návraty** (až po odladění fází 1–6): vše z kapitoly 14.

---

## 14. Návraty hráčů (fáze 7)

Cíl: aby se lidi rádi vraceli, ale **bez trestání**. Hráč nikdy nesmí mít pocit, že vynecháním dne o něco přišel. Žádné odpočítávání ztráty, žádné výčitky v textech.

### Jemný denní návyk
- **Žádná klasická série dní.** Místo ní **týdenní cíl**: hráč si zvolí, kolik denních hádanek týdně chce zvládnout (3 / 5 / 7, výchozí 3). Počítá se, kolik **týdnů v řadě** cíl splnil. Vynechaný den nevadí, dokud stihne cíl za týden.
- **Kalendář s razítky:** každý odehraný den dostane razítko ve stylu Deskovky. Prázdný den je jen prázdný, nic se nemaže ani nezčervená.
- **Dohnání:** denní hádanky z **posledních 7 dní** jdou dohrát a počítají se do týdenního cíle (do denního žebříčku už ne).
- **Rytmus týdne:** pondělí lehčí, během týdne těžší, pátek nejtěžší, sobota a neděle „víkendový speciál“ ve velikosti 5×4. Promítni to do `PRAVIDLA-HADANEK.md`, do rozpisu `daily.json` a do kontroly v `npm run validate`.
- **Po dohrání:** odpočet do další hádanky a krátká upoutávka na zítřejší téma (pole `teaser` u hádanky, nepovinné, nesmí prozradit řešení).

### Pocit pokroku: váček se semínky
- V Dějství I ukazuje pokrok **váček se semínky** (viz kapitola 6a), který roste s každou vyřešenou skupinou.

### Sociální funkce
- **Soukromé party:** hráč založí partu (název, max. 30 členů) a dostane krátký kód a odkaz pro kamarády. Parta má vlastní žebříček (dnes / týden / celkem) a přehled, kdo dnes už hrál. Hráč může být ve více partách a z party odejít, zakladatel může člena odebrat. Vše přes Supabase s RLS: obsah party vidí jen její členové. Názvy part prochází stejným filtrem jako přezdívky.
- **Statistika dne po dohrání:** kolik procent hráčů dnešní hádanku vyřešilo, průměrný počet chyb, nejtěžší a nejlehčí skupina a kolik hráčů ji vyřešilo bez chyby. Počítej v databázi jednou funkcí z uložených výsledků a v aplikaci drž v mezipaměti, ať se šetří limity.
- **Hádanka týdne od hráče:** u vlastní hádanky tlačítko **„Navrhnout do hry“**. Hádanka se uloží do Supabase se stavem `pending` a hráč musí odsouhlasit, že ji smíme použít a upravit. Já návrhy schvaluji (stačí SQL dotaz nebo jednoduchý příkaz v README). Schválená hádanka projde **stejným ověřovacím postupem** jako ostatní (kapitola 9), dostane se do obsahu jako „Hádanka týdne od hráče“ s přezdívkou autora a autor to uvidí v aplikaci.

### Ohlédnutí
- **Měsíční souhrn:** první otevření v novém měsíci ukáže souhrn minulého měsíce: počet her, splněné týdenní cíle, nejlepší skóre, nejrychlejší hra, oblíbený a nejsilnější typ skupin, pozice v partách. Počítá se z lokálních statistik. Přidej i počet nových semínek ve váčku a postup na Cestě.
- Souhrn jde **sdílet jako obrázek** ve stylu Deskovky (stejný generátor jako u sdílení výsledku). Starší souhrny jdou zobrazit ve statistikách.

### Úpravy jinde
- Zásady ochrany soukromí doplň o party a návrhy hádanek.
- „Smazat moje data“ maže i členství v partách a navržené hádanky.
- Do GoatCounteru přidej události: splněný týdenní cíl, založení party, připojení k partě, odeslaný návrh hádanky, sdílení souhrnu.

---

## 15. Dlouhodobost a připravenost na prodej (průběžně ve fázích 1–6)

Tyto body zapracuj do příslušných fází, ne až na konec. U každého uveď, ve které fázi ho uděláš.

### Obsah nezávislý na vydání aplikace
- Hádanky, rozpis `daily.json`, balíčky a přepínače funkcí se **stahují z webu** (`content/manifest.json` s verzí a seznamem souborů). Aplikace si při spuštění zkontroluje novou verzi obsahu a stáhne jen změny.
- V aplikaci je vždy **zabalená záložní kopie obsahu**, takže hra funguje offline i při prvním spuštění bez internetu.
- Platí to i pro budoucí verzi zabalenou přes Capacitor: nové hádanky se **nikdy nesmí** vázat na vydání nové verze v App Store nebo Google Play. Adresu obsahu měj na jednom místě v konfiguraci.

### Hlídání chyb
- Napoj **Sentry** (free plán) přes vrstvu `monitoring.js`: zachytávání chyb JavaScriptu a neúspěšných volání Supabase, s verzí aplikace.
- **Žádná osobní data**: neposílej přezdívky, IP adresy ani obsah hádanek hráčů. Zmiň Sentry v Zásadách ochrany soukromí.
- V README napiš, jak se do Sentry dívám a jak si nastavím upozornění e-mailem.

### Záloha databáze
- GitHub Action **jednou týdně** udělá zálohu databáze Supabase (`pg_dump` přes connection string uložený v GitHub Secrets).
- Repozitář je veřejný, proto zálohu před uložením **zašifruj** (heslo v GitHub Secrets) a ulož ji jako artefakt workflow s maximální dobou uchování.
- V README postup, jak zálohu stáhnu, rozšifruji a obnovím.

### Vzdálené přepínače funkcí
- Soubor `content/flags.json` (stahuje se s obsahem): zapnutí a vypnutí funkcí bez nového vydání (např. `leaderboards`, `parties`, `playerSubmissions`, `sentry`). Když je funkce vypnutá, UI ji čistě schová.
- Kód čte přepínače jen přes jeden modul `flags.js`.

### Připravenost na prodej nebo předání projektu
- Stránka **Podmínky použití** (CZ/EN) vedle Zásad ochrany soukromí: pravidla pro přezdívky a názvy part, licence k hádankám navrženým hráči (hráč souhlasí, že je smíme použít a upravit), vyloučení odpovědnosti. Na první obrazovce před odesláním výsledku do žebříčku krátký souhlas s odkazem na obě stránky.
- **Předávací dokumentace** `docs/PROVOZ.md`: seznam všech služeb a účtů (GitHub organizace, Supabase, Sentry, GoatCounter, doména), co kde běží, které secrets existují a kde se nastavují, jak vydat novou verzi, jak přidat obsah, jak obnovit zálohu a jak celý projekt předat novému majiteli.
- Žádná služba nesmí být napojená na můj osobní účet, vše přes účty projektu Kinzle.
- **Doložitelná čísla:** návod pro mě (`docs/METRIKY.md` popisuje, kde najdu počty hráčů, návraty a dohrané hry v GoatCounteru a Supabase), aby šla doložit historie růstu.

### Placené funkce
Zatím se **nic placeného nepřipravuje** nad rámec kapitoly 10. Rozhodne se, až bude hra vychytaná.

---

## 16. Top kvalita (průběžně ve všech fázích)

### Pocit ze hry
Specifikuj a dolaď každou interakci jako u prémiové hry. Všechny časy a intenzity dej do `src/config/feel.js`, ať je můžu ladit:
- **Kostička:** zamáčknutí do 80 ms, jemné cvaknutí a krátká vibrace; zrušení výběru o něco tlumenější.
- **Správná skupina:** čtyři kostičky se postupně (s malým odstupem) „sletí“ k sobě, spojí se do pruhu barvy skupiny a pruh vyjede nahoru; teprve pak se objeví vysvětlení.
- **Chyba:** krátké zatřesení vybraných kostiček a zhasnutí jedné tečky pokusů; u „těsně vedle“ jiná, přátelštější animace.
- **Výhra:** nejhezčí obrazovka celé hry, protože tady lidi sdílejí. Postupné odhalení skóre (body naskakují), čas, počet chyb, nové semínko ve váčku a velké tlačítko **Sdílet**. Jemné konfety ve stylu Deskovky (kousky kostiček, ne generické konfety).
- **Prohra:** žádné výčitky; skupiny se klidně odkryjí jedna po druhé s vysvětlením a povzbudivou větou.
- Při `prefers-reduced-motion` všechno zkrácené na jednoduché prolnutí.

### Hádanky se zlepšují z dat
- Ke každému výsledku ulož do Supabase i **průběh hry**: pořadí řešení skupin, chybné pokusy (která slova hráč spojil) a použité nápovědy. Jen anonymně, bez přezdívky.
- Databázová funkce spočítá pro každou hádanku a skupinu: úspěšnost, průměrné pořadí, nejčastější chybné kombinace a **skutečnou obtížnost** v porovnání s plánovanou.
- Příkaz `/hadanky` si před tvorbou nové várky tyhle údaje načte (přes skript `npm run puzzle-stats`) a podle nich **kalibruje obtížnost a záludná slova**. Do přehledu pro mě napiš, co se z dat naučil.
- Příkaz `/oprav-hadanku` použije i nejčastější chybné kombinace, aby našel, kde je hádanka nejasná.

### Odolnost: hraniční situace
Každou situaci níže ošetři a pokryj testem (Vitest pro logiku, **Playwright** v mobilním rozlišení pro klíčové průchody hrou).

**Čas a datum**
- **Půlnoc během hry:** rozehraná hádanka zůstane, dohraje se a výsledek se počítá ke dni, kdy začala. Nová hádanka se nabídne až po dokončení.
- **Špatně nastavené hodiny v telefonu:** když je připojení, aktuální den určuje čas serveru (Supabase), ne telefon. Server navíc při ukládání výsledku kontroluje, že datum hádanky odpovídá.
- Přechod na letní a zimní čas, cestování mezi časovými pásmy, první spuštění bez internetu.

**Data v zařízení**
- **iPhone maže data webů,** které 7 dní nikdo neotevřel a nejsou na ploše. Proto:
  - **Kód pro obnovení:** 6 slov (v jazyce hráče), kterým si hráč obnoví přezdívku, statistiky, postup na Cestě, váček se semínky, party a nastavení na stejném i novém zařízení. Postup se průběžně ukládá jako malá záloha v Supabase k anonymnímu profilu. Kód se v databázi ukládá jen jako hash, pokusy o obnovení jsou omezené. Po 3. dohrané hře jemná výzva „Ulož si kód pro obnovení“, kód je vždy dostupný v nastavení.
  - Jemná, odložitelná výzva **„Přidej si Kinzle na plochu“** s návodem pro iOS i Android (po 2. hře, max. jednou za 14 dní, nikdy nainstalovaným hráčům).
- **Anonymní režim prohlížeče** nebo zakázané úložiště: hra jede v paměti a nenápadně upozorní, že se postup neuloží.
- **Plné úložiště** a **poškozená data:** ověření struktury při načtení; rozbitá část se opraví nebo vynuluje, hra nikdy nespadne. Migrace mezi verzemi schématu dat pokryté testy.

**Víc karet a zařízení**
- Stejná hra otevřená ve dvou kartách se synchronizuje (`BroadcastChannel`); denní výsledek se do žebříčku započítá jen jednou.

**Síť a služby**
- Časový limit a opakování s prodlevou u všech volání; offline fronta je **idempotentní** (výsledek se nikdy neuloží dvakrát).
- Uspaná nebo nedostupná Supabase: hra jde hrát dál, žebříček a party ukážou „momentálně nedostupné“ a poslední známý stav.
- Selhání stahování obsahu: nový obsah se použije jen celý najednou, jinak zůstane předchozí verze. Poškozená hádanka se přeskočí a nahlásí do Sentry.

**Aktualizace aplikace**
- Nová verze se nikdy nenačte uprostřed hry, nabídne se až po dohrání.
- Obsah má verzi schématu; starší kód nový obsah, kterému nerozumí, ignoruje bez pádu.

**Ovládání a zobrazení**
- Rychlé dvojí klepnutí, klepání během animace, Zamíchat uprostřed animace.
- Tlačítko Zpět na Androidu zavírá dialogy a obrazovky, aplikaci neopustí nečekaně.
- Otočení na šířku, malé displeje (šířka 320 px), tablety a počítač, velké systémové písmo, výřezy displeje (safe areas), klávesnice ve formuláři vlastní hádanky.
- Neplatné nebo poškozené odkazy na souboj nebo vlastní hádanku, odkaz na hádanku v jiném jazyce: přátelská hláška, ne chyba.
- Sdílení: když nejde Web Share, zkopíruje se do schránky; když nejde ani schránka, zobrazí se text k ručnímu zkopírování.

### Testovací režim
- Zapíná se parametrem `?debug` jen ve vývojové verzi nebo s tajným přepínačem v `flags.json`.
- Panel umožní: nastavit libovolné datum a čas (i těsně před půlnocí), simulovat offline a nedostupnou Supabase, vynulovat data, naplnit váček libovolným počtem semínek, skočit na libovolnou kapitolu nebo dějství, vyvolat měsíční souhrn, reprízu, okno „Co je nového“ a výzvy (plocha, kód pro obnovení, hodnocení).
- V testovacím režimu se **nic neodesílá do žebříčků ani statistik**.

### Čeština na profi úrovni
- Všechny počty přes `Intl.PluralRules` (1 hra, 2 hry, 5 her; 1 semínko, 3 semínka, 7 semínek), v překladových souborech tvary pro všechny kategorie.
- Pevné mezery po jednopísmenných předložkách a spojkách (v, k, s, z, o, u, a, i) a mezi číslem a jednotkou; pomocná funkce, která to dělá automaticky u všech textů.
- České uvozovky „takhle“, pomlčka – místo spojovníku tam, kde patří, správný formát data (11. 10. 2026) a času.
- `npm run validate` kontroluje i texty v `cs.json` (rovné uvozovky, chybějící tvary množného čísla).

### Komunikace s hráči
- **„Co je nového“:** po aktualizaci s novinkami krátké okno (nadpis, 1–3 body, volitelně obrázek). Obsah v `content/<jazyk>/news.json`, takže ho přidám bez zásahu do kódu. Opravy chyb se neoznamují.
- **Prosba o sdílení nebo hodnocení:** jen po 5. výhře, nikdy po prohře, maximálně jednou za 30 dní a nikdy, když hráč dvakrát odmítl. Na webu „Pošli Kinzle kamarádovi“, ve verzi z obchodů později systémové hodnocení. Řízeno přepínačem v `flags.json`.

### Test na živých lidech
- Po dokončení **fáze 3** se zastav a připomeň mi test se skutečnými hráči podle `docs/PLAYTEST.md`. Další fázi začni až poté, co mi pomůžeš zapracovat zjištění.

---

## 17. Po spuštění

Věci na dobu po spuštění jsou v neveřejném dokumentu u autora. **Teď je nedělej.** Po dokončení fáze 6 a fáze 7 mi je připomeň.

Začni prosím tím, že si přečteš `CLAUDE.md` a `design/reference.html` a navrhneš plán fáze 1. Pokud ti v zadání něco chybí nebo je nejasné, zeptej se mě dřív, než začneš.
