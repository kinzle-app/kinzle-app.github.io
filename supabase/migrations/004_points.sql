-- Kinzle: žebříček podle bodů (Lehká i Těžká denní hádanka + Cesta).
-- Spuštění: Supabase → ☰ → SQL Editor → New query → vložit celý soubor → Run (varování potvrdit).
--
-- Dnes   = body z dnešních denních hádanek (obě verze) + body, které dnes přibyly na Cestě.
-- Celkem = body ze všech denních hádanek + za každou úroveň Cesty její nejlepší výsledek.
-- Na Cestě se při zlepšení úrovně přičte jen rozdíl, takže opakováním se body nenasbírají.

-- Denní hádanka: jeden výsledek za den pro každou verzi (Lehká i Těžká)
alter table public.daily_results drop constraint daily_results_pkey;
alter table public.daily_results add primary key (user_id, lang, day, tier);

-- Nejlepší výsledek každé úrovně Cesty
create table public.path_scores (
  user_id uuid not null references public.players (id) on delete cascade,
  lang text not null,
  puzzle_id text not null,
  score int not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lang, puzzle_id)
);

-- Kolik bodů z Cesty hráči v který den přibylo (pro žebříček Dnes)
create table public.path_days (
  user_id uuid not null references public.players (id) on delete cascade,
  lang text not null,
  day date not null,
  points int not null,
  primary key (user_id, lang, day)
);

alter table public.path_scores enable row level security;
alter table public.path_days enable row level security;
revoke all on public.path_scores, public.path_days from anon, authenticated;

-- Vyhraná úroveň Cesty. day = den hry (starší výsledky se dopošlou se svým dnem, budoucí den nejde).
create or replace function public.submit_path(p_lang text, p_puzzle text, p_score int, p_day date)
returns int language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Europe/Prague')::date;
  best int;
  gain int;
begin
  if not exists (select 1 from public.players where id = auth.uid()) then raise exception 'no_player'; end if;
  if p_lang not in ('cs', 'en') or p_puzzle !~ ('^' || p_lang || '-[0-9]{4}$') then raise exception 'bad_value'; end if;
  if p_score not between 0 and 400 or p_day is null or p_day > today then raise exception 'bad_value'; end if;
  select score into best from public.path_scores where user_id = auth.uid() and lang = p_lang and puzzle_id = p_puzzle;
  gain := p_score - coalesce(best, 0);
  if gain <= 0 then return 0; end if;
  insert into public.path_scores (user_id, lang, puzzle_id, score) values (auth.uid(), p_lang, p_puzzle, p_score)
  on conflict (user_id, lang, puzzle_id) do update set score = excluded.score, updated_at = now();
  insert into public.path_days (user_id, lang, day, points) values (auth.uid(), p_lang, p_day, gain)
  on conflict (user_id, lang, day) do update set points = public.path_days.points + excluded.points;
  return gain;
end $$;

-- Žebříček podle bodů (celý, nebo jen parta). Řádek: body celkem, z toho denní a Cesta.
create or replace function public.leaderboard(p_lang text, p_kind text, p_party uuid default null)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Europe/Prague')::date;
  result json;
begin
  if p_lang not in ('cs', 'en') or p_kind not in ('today', 'total') then raise exception 'bad_value'; end if;
  if p_party is not null and not public.is_member(p_party) then raise exception 'not_member'; end if;
  with daily as (
    select r.user_id, sum(r.score)::int as points from public.daily_results r
    where r.lang = p_lang and (p_kind = 'total' or r.day = today) group by r.user_id
  ), path as (
    select d.user_id, sum(d.points)::int as points from public.path_days d
    where d.lang = p_lang and (p_kind = 'total' or d.day = today) group by d.user_id
  ), sums as (
    select p.id as user_id, p.nickname, coalesce(dl.points, 0) as daily, coalesce(pt.points, 0) as path
    from public.players p
    left join daily dl on dl.user_id = p.id
    left join path pt on pt.user_id = p.id
    where (dl.user_id is not null or pt.user_id is not null)
      and (p_party is null or p.id in (select m.user_id from public.party_members m where m.party_id = p_party))
  ), board as (
    select rank() over (order by s.daily + s.path desc) as rank, s.nickname, s.daily + s.path as points,
      s.daily, s.path, pp.level, pp.stars, s.user_id = auth.uid() as me
    from sums s left join public.path_progress pp on pp.user_id = s.user_id and pp.lang = p_lang
  )
  select json_build_object(
    'top', coalesce((select json_agg(x order by x.rank, x.nickname) from board x where x.rank <= 50), '[]'::json),
    'me', (select row_to_json(x) from board x where x.me),
    'count', (select count(*) from board)
  ) into result;
  return result;
end $$;

revoke execute on function public.submit_path(text, text, int, date) from public, anon;
grant execute on function public.submit_path(text, text, int, date) to authenticated;
