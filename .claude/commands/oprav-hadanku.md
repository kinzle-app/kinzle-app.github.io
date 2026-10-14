---
description: Najde a opraví problém v hádance Kinzle (podle hlášení hráčů a dat ze hry)
argument-hint: <id hádanky> [co je špatně]
---

Oprav hádanku Kinzle: **$ARGUMENTS**

1. Přečti `content/PRAVIDLA-HADANEK.md` a hádanku `content/<jazyk>/puzzles/<id>.json` (případně `drafts/`).
2. Zjisti, co je špatně:
   - popis od autora v zadání příkazu,
   - hlášení hráčů z tabulky `reports` v Supabase (SQL dotaz v README, sekce o hlášení), pokud už existuje,
   - nejčastější chybné kombinace z `npm run puzzle-stats`, pokud už existuje: kde hráči opakovaně spojují slova jinak, je hádanka nejspíš nejasná.
3. Najdi příčinu: nepřesný nebo dvojznačný název skupiny, slovo patřící i jinam, překlep, nepravdivé vysvětlení, neodpovídající obtížnost.
4. Navrhni co nejmenší opravu. **Id se nikdy nemění** (váže se na něj pokrok hráčů a archiv).
5. Opravenou hádanku ověř celým postupem z pravidel (kontrola názvů, jednoznačnost, alternativní řešení, **nový slepý test** subagentem, jazyk, fakty, `npm run validate`).
6. Do `content/<jazyk>/drafts/REVIEW.md` přidej záznam „Oprava <id>“: co bylo špatně, co se změnilo (před → po), výsledek slepého testu.
7. Zastav se a požádej autora o schválení. Teprve po něm změnu ulož do `puzzles/`, spusť `npm run validate` a `npm test`, commitni a pushni.

Pokud hádanka už byla denní hádankou (je v minulosti v `daily.json`), upozorni autora, že oprava změní i její podobu v archivu.
