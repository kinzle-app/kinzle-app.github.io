# Žebříček (Supabase)

## Co kde je
- Projekt Supabase **kinzle** v organizaci Kinzle (region Frankfurt, free plán).
- Adresa a veřejný klíč: `src/config/backend.js`. Tajný klíč (secret / service_role) do repozitáře **nikdy**.
- Databáze: `supabase/migrations/` – tabulky `players`, `daily_results`, `seeds`, `path_progress` a funkce
  `set_nickname`, `submit_daily`, `add_seeds`, `set_path`, `leaderboard`, `delete_me`, `ping`.
- Aplikace: `src/services/leaderboard.js` (síť), `src/game/leaderboard.js` (co poslat), `src/ui/leaderboard.js` (obrazovka `#/zebricek`).
- Party: `supabase/migrations/002_party.sql` – tabulky `parties`, `party_members`, `party_puzzles`; obrazovky `src/ui/party.js` (`#/parta`, `#/parta/<id>`, pozvánka `#/parta/pripojit/<kód>`). Žebříček party je stejná funkce `leaderboard` s parametrem `p_party`.
- Vlastní hádanka: celá v odkazu `#/h/<kód>` (`src/game/custom.js`, `src/ui/custom.js`), server ji potřebuje jen pro hádanky party. Nepočítá se do semínek, statistik ani žebříčku.
- Vypnutí bez nového vydání: `"leaderboards": false` v `content/flags.json`.

## Pravidla
- Hráč se zapíše přezdívkou (anonymní přihlášení Supabase, žádný e-mail).
- **Dnes**: dnešní denní hádanka, za den se počítá první dohraná. Lehká a Těžká v jednom žebříčku –
  pořadí podle toho, jak hráč dopadl proti hráčům své úrovně, při shodě body a čas.
- **Celkem**: semínka (vyřešené skupiny) ze všech her kromě tréninku, každá skupina jednou, bez nulování.
- U přezdívky odznak Cesty: nejvyšší dohraná úroveň a hvězdy.
- V testovacím režimu (`?debug`) a s posunutými hodinami (`?datum`) se nic neodesílá.

## Nová migrace
Supabase → ☰ → **SQL Editor** → **New query** → vložit soubor z `supabase/migrations/` → **Run**
(varování „Potential issue detected“ potvrdit, pokud jde o `revoke`).

## Budíček proti uspání (GitHub Action `ping.yml`)
Každé 3 dny zavolá `ping()`. Potřebuje dvě GitHub Secrets:
GitHub → repozitář → **Settings → Secrets and variables → Actions → New repository secret**
- `SUPABASE_URL` = adresa z `src/config/backend.js`
- `SUPABASE_KEY` = veřejný klíč z `src/config/backend.js`

Ručně spustit: GitHub → **Actions → Ping Supabase → Run workflow**.

## Užitečné dotazy (SQL Editor)
```sql
-- hráči a jejich semínka
select p.nickname, count(s.seed) as seeds from players p left join seeds s on s.user_id = p.id group by p.nickname order by seeds desc;
-- dnešní výsledky
select p.nickname, r.tier, r.score, r.seconds, r.won from daily_results r join players p on p.id = r.user_id
where r.day = (now() at time zone 'Europe/Prague')::date order by r.tier, r.score desc;
-- přejmenování nevhodné přezdívky
update players set nickname = 'Hráč 123' where nickname = '…';
```
