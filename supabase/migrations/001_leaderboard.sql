-- Kinzle: žebříčky (fáze 4).
-- Spuštění: Supabase → ☰ → SQL Editor → New query → vložit celý soubor → Run. Stačí jednou.
--
-- Bezpečnost: všechny tabulky mají zapnuté Row Level Security bez jediného pravidla,
-- takže do nich z aplikace nikdo nesáhne přímo. Čte se a zapisuje jen přes funkce níže
-- (security definer), které kontrolují hodnoty. Hráč je anonymně přihlášený (role authenticated).

-- ---------- tabulky ----------

-- Hráč: jen přezdívka (žádný e-mail ani jiné osobní údaje)
create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now()
);
create unique index players_nickname_unique on public.players (lower(nickname));

-- Výsledek dnešní denní hádanky: jeden na hráče, jazyk a den (počítá se první odeslaný)
create table public.daily_results (
  user_id uuid not null references public.players (id) on delete cascade,
  lang text not null,
  day date not null,
  tier text not null,
  puzzle_id text not null,
  score int not null,
  seconds int not null,
  mistakes int not null,
  hints int not null,
  won boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, lang, day)
);
create index daily_results_board on public.daily_results (lang, day);

-- Semínka: vyřešené skupiny ('cs-0006#2' = hádanka a obtížnost skupiny), každá jen jednou
create table public.seeds (
  user_id uuid not null references public.players (id) on delete cascade,
  lang text not null,
  seed text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, lang, seed)
);

-- Postup na Cestě pro odznak u přezdívky (nejvyšší dohraná úroveň a hvězdy)
create table public.path_progress (
  user_id uuid not null references public.players (id) on delete cascade,
  lang text not null,
  level int not null,
  stars int not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lang)
);

alter table public.players enable row level security;
alter table public.daily_results enable row level security;
alter table public.seeds enable row level security;
alter table public.path_progress enable row level security;
revoke all on public.players, public.daily_results, public.seeds, public.path_progress from anon, authenticated;

-- ---------- funkce ----------

-- Přezdívka: 3–16 znaků (písmena i s diakritikou, číslice, mezera, _ . -), unikátní, bez sprostých slov
create or replace function public.set_nickname(p_nickname text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  nick text := btrim(regexp_replace(coalesce(p_nickname, ''), '\s+', ' ', 'g'));
  plain text;
  word text;
  bad text[] := array[
    'kurv', 'prdel', 'pica', 'pice', 'picu', 'kokot', 'curak', 'debil', 'zmrd', 'hovno', 'sracka', 'mrdat', 'mrdk',
    'jebat', 'jebe', 'kunda', 'buzna', 'hajzl', 'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'nigg', 'fagg',
    'whore', 'slut', 'porn', 'hitler', 'nazi', 'admin', 'kinzle'
  ];
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if char_length(nick) not between 3 and 16 then raise exception 'nickname_length'; end if;
  if nick !~ '^[A-Za-z0-9áäčďéěíĺľňóôöŕřšťúůüýžÁÄČĎÉĚÍĹĽŇÓÔÖŔŘŠŤÚŮÜÝŽ _.-]+$' then raise exception 'nickname_chars'; end if;
  -- bez diakritiky, mezer a „leet“ záměn, aby filtr nešel snadno obejít
  plain := translate(lower(nick), 'áäčďéěíĺľňóôöŕřšťúůüýž01345 _.-', 'aacdeeillnooorrstuuuyzoieas');
  foreach word in array bad loop
    if position(word in plain) > 0 then raise exception 'nickname_bad'; end if;
  end loop;
  insert into public.players (id, nickname) values (auth.uid(), nick)
  on conflict (id) do update set nickname = excluded.nickname;
  return nick;
exception when unique_violation then
  raise exception 'nickname_taken';
end $$;

-- Výsledek denní hádanky. Den určuje čas serveru (Europe/Prague): dnešek, nebo včerejšek kvůli půlnoci.
create or replace function public.submit_daily(
  p_lang text, p_day date, p_tier text, p_puzzle text,
  p_score int, p_seconds int, p_mistakes int, p_hints int, p_won boolean
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Europe/Prague')::date;
begin
  if not exists (select 1 from public.players where id = auth.uid()) then raise exception 'no_player'; end if;
  if p_lang not in ('cs', 'en') or p_tier not in ('easy', 'medium', 'hard') then raise exception 'bad_value'; end if;
  if p_puzzle !~ ('^' || p_lang || '-[0-9]{4}$') then raise exception 'bad_value'; end if;
  if p_day is null or p_day not between today - 1 and today then raise exception 'bad_day'; end if;
  -- rozumné hodnoty: nejvyšší možný počet bodů je kolem 270, chyby nejvýš 4, nápovědy nejvýš 2
  if p_score not between 0 and 400 or p_seconds not between 1 and 86400
     or p_mistakes not between 0 and 4 or p_hints not between 0 and 2 then
    raise exception 'bad_value';
  end if;
  if p_won and p_seconds < 10 then raise exception 'too_fast'; end if;
  insert into public.daily_results (user_id, lang, day, tier, puzzle_id, score, seconds, mistakes, hints, won)
  values (auth.uid(), p_lang, p_day, p_tier, p_puzzle, p_score, p_seconds, p_mistakes, p_hints, p_won)
  on conflict do nothing;
  return found;
end $$;

-- Semínka (najednou nejvýš 1000); stejné semínko se znovu nezapočítá
create or replace function public.add_seeds(p_lang text, p_seeds text[])
returns int language plpgsql security definer set search_path = '' as $$
declare
  added int;
begin
  if not exists (select 1 from public.players where id = auth.uid()) then raise exception 'no_player'; end if;
  if p_lang not in ('cs', 'en') then raise exception 'bad_value'; end if;
  if coalesce(array_length(p_seeds, 1), 0) > 1000 then raise exception 'too_many'; end if;
  insert into public.seeds (user_id, lang, seed)
  select auth.uid(), p_lang, s from unnest(p_seeds) as s
  where s ~ ('^' || p_lang || '-[0-9]{4}#[1-5]$')
  on conflict do nothing;
  get diagnostics added = row_count;
  return added;
end $$;

-- Odznak Cesty: nejvyšší dohraná úroveň a počet hvězd
create or replace function public.set_path(p_lang text, p_level int, p_stars int)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.players where id = auth.uid()) then raise exception 'no_player'; end if;
  if p_lang not in ('cs', 'en') or p_level not between 0 and 10000 or p_stars not between 0 and p_level * 3 then
    raise exception 'bad_value';
  end if;
  insert into public.path_progress (user_id, lang, level, stars) values (auth.uid(), p_lang, p_level, p_stars)
  on conflict (user_id, lang) do update set level = excluded.level, stars = excluded.stars, updated_at = now();
end $$;

-- Žebříček v jedné odpovědi: top 50 + vlastní řádek hráče + počet hráčů.
-- 'today': dnešní denní hádanka. Lehká a Těžká v jednom žebříčku: pořadí podle toho, jak hráč dopadl
--          proti ostatním ve své úrovni (podíl hráčů své úrovně, které porazil nebo dorovnal),
--          při shodě rozhodnou body a čas. Dítě tak může férově soutěžit s dospělým.
-- 'total': všechna nasbíraná semínka (bez nulování).
create or replace function public.leaderboard(p_lang text, p_kind text)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Europe/Prague')::date;
  result json;
begin
  if p_lang not in ('cs', 'en') then raise exception 'bad_value'; end if;
  if p_kind = 'today' then
    with ranked as (
      select r.user_id, p.nickname, r.tier, r.score, r.seconds, r.won,
        cume_dist() over (partition by r.tier order by r.won, r.score, -r.seconds) as pct
      from public.daily_results r join public.players p on p.id = r.user_id
      where r.lang = p_lang and r.day = today
    ), ordered as (
      select ranked.*, rank() over (order by pct desc, score desc, seconds) as rank from ranked
    ), board as (
      select o.rank, o.nickname, o.tier, o.score, o.seconds, o.won, pp.level, pp.stars, o.user_id = auth.uid() as me
      from ordered o left join public.path_progress pp on pp.user_id = o.user_id and pp.lang = p_lang
    )
    select json_build_object(
      'top', coalesce((select json_agg(x order by x.rank, x.nickname) from board x where x.rank <= 50), '[]'::json),
      'me', (select row_to_json(x) from board x where x.me),
      'count', (select count(*) from board)
    ) into result;
  elsif p_kind = 'total' then
    with totals as (
      select s.user_id, count(*)::int as seeds from public.seeds s where s.lang = p_lang group by s.user_id
    ), board as (
      select rank() over (order by t.seeds desc) as rank, p.nickname, t.seeds, pp.level, pp.stars,
        t.user_id = auth.uid() as me
      from totals t join public.players p on p.id = t.user_id
      left join public.path_progress pp on pp.user_id = t.user_id and pp.lang = p_lang
    )
    select json_build_object(
      'top', coalesce((select json_agg(x order by x.rank, x.nickname) from board x where x.rank <= 50), '[]'::json),
      'me', (select row_to_json(x) from board x where x.me),
      'count', (select count(*) from board)
    ) into result;
  else
    raise exception 'bad_value';
  end if;
  return result;
end $$;

-- Smazání všech údajů hráče (přezdívka, výsledky, semínka) i jeho anonymního účtu
create or replace function public.delete_me()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  delete from public.players where id = auth.uid();
  begin
    delete from auth.users where id = auth.uid();
  exception when others then
    null; -- údaje ve hře jsou smazané i tak
  end;
end $$;

-- Ping pro GitHub Action, aby se projekt na free plánu neuspal
create or replace function public.ping()
returns text language sql stable as $$ select 'ok'::text $$;

-- ---------- oprávnění ----------
revoke execute on function public.set_nickname(text), public.submit_daily(text, date, text, text, int, int, int, int, boolean),
  public.add_seeds(text, text[]), public.set_path(text, int, int), public.leaderboard(text, text), public.delete_me()
  from public, anon;
grant execute on function public.set_nickname(text), public.submit_daily(text, date, text, text, int, int, int, int, boolean),
  public.add_seeds(text, text[]), public.set_path(text, int, int), public.leaderboard(text, text), public.delete_me()
  to authenticated;
grant execute on function public.ping() to anon, authenticated;
