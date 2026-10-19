---
description: Vytvoří várku nových hádanek Kinzle (tvorba, ověření, slepý test, přehled ke schválení)
argument-hint: <cs|en> <počet 1–5> [téma: …] | <cs|en> kapitola <N> | <cs|en> denní <od YYYY-MM-DD>
---

Vytvoř várku hádanek Kinzle podle zadání: **$ARGUMENTS**

Příklady: `cs 5`, `en 3 téma: kuchyně`, `cs kapitola 2`, `cs denní od 2026-11-02`.

## 0. Příprava
1. Přečti `content/PRAVIDLA-HADANEK.md` celé. Jeho pravidla platí bez výjimky.
2. Projdi existující hádanky daného jazyka v `content/<jazyk>/puzzles/` a `drafts/` (názvy skupin a slova), aby se témata, slova ani typy skupin zbytečně neopakovaly.
3. Pokud existuje `npm run puzzle-stats`, spusť ho a podle skutečné úspěšnosti skupin a nejčastějších chybných kombinací kalibruj obtížnost a záludná slova. Co ses z dat naučil, napiš do přehledu.
4. Urči, co várka potřebuje:
   - **denní** (`denní od <datum>`): pro každý den velikost a úroveň podle rytmu týdne z pravidel (po–pá 4×4 se stoupající úrovní, víkend 5×4),
   - **kapitola N**: 10 úrovní Cesty (mix 3×4, 4×4, 5×4, každá 4.–5. úroveň oddechová, poslední mistrovská 5×4), 2–3 hádanky volně k tématu kapitoly; tvoř po 5,
   - jinak počet a téma podle zadání.
   - **čeština pro dospělé**: navíc pravidla z kapitoly 2a (žádná holá kategorie, 2+ hříčky, falešná stopa, 5–6 kandidátů na nejzjevnější téma).
   - **angličtina**: každá hádanka má úroveň `tier` (easy / medium / hard) podle kapitoly 3a pravidel. Když úroveň v zadání chybí (např. `/hadanky en denní od 2026-10-26 easy`), zeptej se. Denní rozpis je pro každou úroveň zvlášť.
   Várka má **nejvýš 5 hádanek**. Když je jich potřeba víc, udělej prvních 5 a zastav se.
5. Id: další volné číslo v jazyce (`cs-0001`, `cs-0002`, …), nikdy nepoužij id znovu.

## 1. Tvorba
Pro každou hádanku napiš návrh podle pravidel: přesné názvy skupin (slovní hříčka musí mít v názvu, s čím se pracuje), běžná slova v základním tvaru, pestré typy skupin, 1–3 záludná slova, pravdivá vysvětlení.

## 2. Ověření (u každé hádanky, nic nepřeskakuj)
1. **Kontrola názvů:** jak by název pochopil někdo, kdo hádanku nezná? Dá se přečíst i jinak? → přepiš.
2. **Kontrola jednoznačnosti:** tabulka slovo → všechny skupiny, kam by mohlo patřit.
3. **Hledání alternativního řešení:** aktivně zkus najít jiné rozdělení všech slov.
4. **Slepý test:** spusť nového subagenta (nástroj Agent) a dej mu **jen** tento úkol se zamíchanými slovy, bez názvů a řešení:
   > Tady je N×4 slov ze slovní hry (jazyk: …). Rozděl je do N skupin po čtyřech, kde mají slova ve skupině něco společného. Spojení mohou být i slovní hříčky. U každé skupiny napiš, co mají slova společného, a jak moc si jsi jistý. Pak vypiš všechna slova, která by podle tebe mohla patřit i do jiné skupiny, a jakékoli jiné rozdělení, které by taky dávalo smysl. Nakonec u každé skupiny napiš, jak těžká ti připadala (1 = hned vidět, 5 = až na konec) a kolik slov tě u ní mátlo. Slova: …
   Pokud subagent najde jiné obhajitelné řešení nebo se zasekne kvůli nejasnosti (ne kvůli obtížnosti), hádanku oprav a test zopakuj s **novým** subagentem. Do přehledu zapiš, jak test dopadl (i neúspěšné pokusy).
5. **Jazyková kontrola:** pravopis, diakritika, základní tvar, běžnost slova; u češtiny v pochybnostech Internetová jazyková příručka (prirucka.ujc.cas.cz).
6. **Kontrola faktů** ve vysvětleních na webu. Neověřitelný fakt vyhoď a napiš jen jednoduché vysvětlení.
7. Ulož hádanky jako `content/<jazyk>/drafts/<id>.json` se `"status": "draft"` a spusť `npm run validate`, dokud neprojde bez chyb.

## 3. Přehled pro autora
Do `content/<jazyk>/drafts/REVIEW.md` přidej na začátek novou várku (starší nech pod ní):

```
## Várka <datum> – <co to je>

### <id> · <velikost> · úroveň <level> · <plánované použití, např. denní po 2. 11.>
| Obtížnost | Název | Slova | Vysvětlení |
|---|---|---|---|
| ● 1 | … | … | … |
**Záludná slova:** … (proč vypadají, že patří jinam, a proč nepatří)
**Slepý test:** vyřešil správně / napoprvé našel …, opraveno …
**Opraveno při ověřování:** …
**Ověřené fakty:** … (zdroj)
```

## 4. Zastav se
Nic necommituj do `puzzles/` ani do `daily.json`. Shrň várku a požádej autora o schválení. Napiš mu, jak odpovědět, např. „schvaluji cs-0001, cs-0003; cs-0002 oprav: …“.

## Po schválení (až autor napíše, které hádanky schvaluje)
1. Schválené přesuň z `drafts/` do `puzzles/` a nastav `"status": "approved"` (id se nemění).
2. Denní hádanky zapiš do `content/<jazyk>/daily.json` (datum → id) podle rytmu týdne, kapitolu do `path.json`, balíček do `packs.json`.
3. V `REVIEW.md` u hádanky poznač „schváleno <datum>“.
4. `npm run validate` a `npm test` musí projít. Pak commit a push podle CLAUDE.md.
5. Hádanky k opravě oprav, znovu ověř (včetně nového slepého testu) a předlož znovu.
