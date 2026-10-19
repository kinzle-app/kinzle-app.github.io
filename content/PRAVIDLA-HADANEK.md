# Pravidla hádanek Kinzle

Hra stojí a padá na kvalitě hádanek. Každá hádanka musí dávat smysl, mít **jediné správné řešení**
a být ověřená dřív, než ji uvidí autor ke schválení. Tato pravidla platí pro češtinu i angličtinu.

## 1. Formát souboru

Každá hádanka je jeden soubor `content/<jazyk>/<složka>/<id>.json`:

```json
{
  "id": "cs-0001",
  "language": "cs",
  "size": 4,
  "level": 3,
  "status": "draft",
  "author": "Kinzle",
  "createdAt": "2026-10-14",
  "teaser": "Zítra se podíváme do kuchyně.",
  "groups": [
    { "title": "…", "difficulty": 1, "words": ["…", "…", "…", "…"], "explanation": "…" }
  ]
}
```

| Pole | Význam |
|---|---|
| `id` | stabilní, nikdy se nemění: `cs-0001`, `en-0001`, … (pokrok hráčů se váže na id) |
| `size` | počet skupin: 3 (Lehká), 4 (Klasická), 5 (Těžká) |
| `level` | celková plánovaná obtížnost hádanky 1–5 (1 = nejlehčí), slouží pro rytmus týdne a Volnou hru |
| `tier` | jen angličtina: úroveň jazyka `easy` / `medium` / `hard` (povinná), viz kapitola 3a |
| `status` | `draft` (čeká na schválení, složka `drafts/`), `approved` (schválená, složka `puzzles/`) |
| `difficulty` | obtížnost skupiny 1–5; v hádance je každá obtížnost jen jednou (1–3, 1–4 nebo 1–5) |
| `teaser` | nepovinná upoutávka na zítřek, **nesmí prozradit řešení** |

Slova se zapisují malými písmeny (hra je zobrazí verzálkami), vlastní jména s velkým písmenem.
Slovo má nejvýš 12 znaků (jinak se nevejde na kostičku), víceslovné spojení výjimečně a jen krátké.

## 2. Pravidla pro obsah

- **Běžná slova**, která zná každý dospělý. Žádná odborná, nářeční, zastaralá ani vzácná slova, žádný slang ani vulgarity.
- **Základní tvar** (v češtině 1. pád jednotného čísla), pokud skupina výslovně nepracuje s tvarem slova.
- **Pestré typy skupin**, nejvýš 2 skupiny stejného typu v jedné hádance:
  - význam (druhy, části, vlastnosti: „Části jízdního kola“),
  - slovní hříčky (slova před/za společným slovem, skrytá slova, slova pozpátku, rýmy),
  - ustálená spojení a idiomy,
  - společná vlastnost („Dá se ladit“).
- **Název skupiny je přesný a jde přečíst jen jedním způsobem.** Hráč musí po vyřešení říct „aha, jasně“, ne „to je sporné“.
  - Ne „Zvířata“, ale „Zvířata, která přezimují ve spánku“.
  - **Slovní hříčka musí mít v názvu řečeno, s čím se pracuje.** Ne „Mořská…“ (dá se číst jako „věci související s mořem“ a pak sedí jen část slov), ale „Dají se doplnit slovem MOŘSKÁ“. Ne „Skrytá zvířata“, ale „Schovává se v nich zvíře“.
  - Název nesmí sedět i na jinou čtveřici slov z hádanky.
- **Skrytá slova a hříčky kontroluj u všech slov hádanky**, ne jen u skupiny. U „schovává se v nich zvíře“ hledej i krátká slova a mláďata (tele, sele, kotě, tur, sob, los, rys, kos, mol…): TELEfon by sem omylem patřil taky.
- **Pozor na druhé významy, které spojují slovo s jinou skupinou:** háček má očko, celer bývá i řapíkatý (roste nad zemí). Když druhý význam sedí na název jiné skupiny, slovo vyměň.
- **Záludná slova:** každá hádanka má 1–3 slova, která na první pohled sedí i jinam, ale podle přesného názvu skupiny jednoznačně nepatří. Celé rozdělení musí být přesto jediné možné.
- **Obtížnost odpovídá skutečnosti:** skupina 1 je vidět hned, nejtěžší skupina vyžaduje „aha moment“. Těžkost má plynout z chytrosti spojení, ne z neznámých slov.
- **Vysvětlení je fakticky pravdivé.** Fakt, který nejde ověřit, se nepíše; stačí jednoduché vysvětlení spojení.
- **Čeština a angličtina se vymýšlejí zvlášť**, nikdy se nepřekládají. Anglické hádanky musí být srozumitelné hráčům z různých zemí (žádné úzce americké nebo britské reálie, raději mezinárodní pravopis slov bez rozdílů US/UK).
- **Všechno je původní.** Nikdy nepřebírej ani nepřekládej hádanky z jiných her nebo jejich archivů.

## 2a. Obtížnost pro dospělé

První hádanky (cs-0001 až cs-0043) jsou pro dospělé příliš lehké: první dvě skupiny jsou holé kategorie (Ovoce, Barvy) a zbytek se dá vyřešit vylučováním. Čeština bude mít dvě úrovně – pro děti (dosavadní styl) a pro dospělé. Hádanka pro dospělé musí splnit všechno níže:

- **Žádná holá kategorie.** I nejlehčí skupina je zúžená nebo nečekaná („Mořské ryby“, ne „Ryby“; „Mají ostny“, ne „Zvířata“).
- **Nejméně dvě skupiny jsou hříčky nebo nečekaná spojení** (ustálené spojení, dvojí význam, skrytá slova, přesmyčka, předpona…).
- **Nejzjevnější téma má 5–6 kandidátů.** Slova, která na první pohled tvoří skupinu, jsou rozházená do víc skupin, takže vylučovací metoda nefunguje hned.
- **Aspoň jedna falešná stopa:** tři slova, která spolu zjevně souvisí, ale čtvrté k nim chybí (každé patří jinam).
- **Pořád platí jednoznačnost** (kapitola 4): falešná stopa nesmí vytvořit druhé platné řešení.
- **Slepý test měří i obtížnost:** řešitel u každé skupiny napíše, jak těžká mu připadala (1–5) a kolik slov ho mátlo. Hádanka pro dospělé má mít aspoň dvě skupiny s hodnocením 3 a víc a nejlehčí skupinu aspoň 2.

## 3. Rytmus týdne (denní hádanky)

| Den | Velikost | `level` |
|---|---|---|
| pondělí | 4×4 | 1–2 (lehčí) |
| úterý | 4×4 | 2–3 |
| středa | 4×4 | 2–4 |
| čtvrtek | 4×4 | 3–4 |
| pátek | 4×4 | 4–5 (nejtěžší) |
| sobota, neděle | 5×4 (víkendový speciál) | 3–5 |

`npm run validate` rytmus kontroluje. Velikost 3×4 se v denních hádankách nepoužívá (patří hlavně do Cesty).

## 3a. Úrovně angličtiny (Easy / Medium / Hard)

Anglické hádanky hrají i lidé, kteří se anglicky učí. Každá anglická hádanka má úroveň `tier` a každá úroveň má vlastní denní rozpis (`content/en/daily.json` → `{ "easy": {…}, "medium": {…}, "hard": {…} }`). Rytmus týdne (`level` 1–5) platí uvnitř každé úrovně zvlášť.

| Úroveň | Slovní zásoba | Typy skupin |
|---|---|---|
| **Easy** | základní slova, která zná začátečník (zhruba A2): jídlo, zvířata, barvy, rodina, škola, dům | jen podle významu a společné vlastnosti; žádné idiomy, frázová slovesa, skrytá slova ani slovní hříčky |
| **Medium** | běžná slova (zhruba B1–B2) | navíc jednoduchá složená slova a známá spojení (___BALL, BOOK___), občas běžné frázové sloveso; skrytá slova jen výjimečně a krátká |
| **Hard** | celá šíře jazyka pro rodilé mluvčí | idiomy, dvojí významy, skrytá slova, přesmyčky, slovní hříčky |

- Úroveň se pozná podle **nejtěžší skupiny**: i Easy hádanka má svou ★ nebo ◆ skupinu, ale těžká je chytrým spojením, ne slovem nebo hříčkou nad úroveň.
- Slepý test u Easy a Medium: subagent dostane i pokyn „řeš jako student angličtiny na úrovni A2 / B1“ a napíše, kterým slovům nerozumí. Neznámé slovo = vyměnit.
- Balíček má v `packs.json` také pole `tier`.

## 4. Povinný ověřovací postup (každá hádanka)

1. **Kontrola názvů:** u každé skupiny napiš, jak by název mohl pochopit někdo, kdo hádanku nezná. Pokud jde přečíst i jinak, než je myšleno, přepiš ho.
2. **Kontrola jednoznačnosti:** u každého slova vypiš všechny skupiny hádanky, do kterých by mohlo patřit. Pokud slovo sedí do dvou skupin stejně dobře, uprav název nebo vyměň slovo.
3. **Hledání alternativního řešení:** aktivně zkus najít jiné rozdělení všech slov, které by dávalo smysl. Pokud existuje, hádanku oprav.
4. **Slepý test:** samostatný subagent dostane **jen zamíchaná slova a počet skupin, bez názvů a řešení**, hádanku vyřeší a zdůvodní. Pokud najde jiné obhajitelné řešení nebo se zasekne kvůli nejasnosti (ne kvůli obtížnosti), hádanku oprav a test zopakuj s novým subagentem.
5. **Jazyková kontrola:** pravopis, diakritika, základní tvar, existence a běžnost slova. U českých slov v pochybnostech ověř v Internetové jazykové příručce (prirucka.ujc.cas.cz).
6. **Kontrola faktů** ve vysvětleních (na webu). Když fakt nejde spolehlivě ověřit, vysvětlení zjednoduš.
7. **`npm run validate`** (délka slov, duplicity, formát).

## 5. Schvalování

- Nové hádanky se ukládají se stavem `"status": "draft"` do `content/<jazyk>/drafts/`.
- Ke každé várce vznikne přehled `content/<jazyk>/drafts/REVIEW.md`: hádanka, řešení, záludná slova, výsledek slepého testu, co se při ověřování opravilo.
- Teprve **po schválení autorem** se hádanka přesune do `puzzles/` se stavem `"approved"` a smí do `daily.json` nebo balíčku. `npm run validate` neschválenou hádanku v rozpisu odmítne.
- Várky mají **nejvýš 5 hádanek**. Kvalita má přednost před množstvím.
