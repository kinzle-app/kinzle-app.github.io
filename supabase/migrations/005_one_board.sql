-- Kinzle: jeden žebříček – pořadí podle celkových bodů a u každého, kolik dnes přibylo.
-- Spuštění: Supabase → ☰ → SQL Editor → New query → vložit → Run.
-- p_kind zůstává kvůli starším verzím aplikace, ale odpověď je pro oba stejná.
create or replace function public.leaderboard(p_lang text, p_kind text, p_party uuid default null)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Europe/Prague')::date;
  result json;
begin
  if p_lang not in ('cs', 'en') then raise exception 'bad_value'; end if;
  if p_party is not null and not public.is_member(p_party) then raise exception 'not_member'; end if;
  with daily as (
    select r.user_id, sum(r.score)::int as total, coalesce(sum(r.score) filter (where r.day = today), 0)::int as today
    from public.daily_results r where r.lang = p_lang group by r.user_id
  ), path as (
    select d.user_id, sum(d.points)::int as total, coalesce(sum(d.points) filter (where d.day = today), 0)::int as today
    from public.path_days d where d.lang = p_lang group by d.user_id
  ), sums as (
    select p.id as user_id, p.nickname, coalesce(dl.total, 0) as daily, coalesce(pt.total, 0) as path,
      coalesce(dl.today, 0) + coalesce(pt.today, 0) as today
    from public.players p
    left join daily dl on dl.user_id = p.id
    left join path pt on pt.user_id = p.id
    where (dl.user_id is not null or pt.user_id is not null)
      and (p_party is null or p.id in (select m.user_id from public.party_members m where m.party_id = p_party))
  ), board as (
    select rank() over (order by s.daily + s.path desc) as rank, s.nickname, s.daily + s.path as points,
      s.daily, s.path, s.today, pp.level, pp.stars, s.user_id = auth.uid() as me
    from sums s left join public.path_progress pp on pp.user_id = s.user_id and pp.lang = p_lang
  )
  select json_build_object(
    'top', coalesce((select json_agg(x order by x.rank, x.nickname) from board x where x.rank <= 50), '[]'::json),
    'me', (select row_to_json(x) from board x where x.me),
    'count', (select count(*) from board)
  ) into result;
  return result;
end $$;
