-- Kinzle: party (soukromé skupiny s vlastním žebříčkem a hádankami).
-- Spuštění: Supabase → ☰ → SQL Editor → New query → vložit celý soubor → Run (varování potvrdit).
-- Stejně jako 001: tabulky jen přes funkce, RLS zapnuté bez pravidel.

-- ---------- tabulky ----------

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,            -- kód pro pozvání (6 znaků)
  name text not null,
  owner uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.party_members (
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.players (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id)
);
create index party_members_user on public.party_members (user_id);

-- Vlastní hádanky poslané partě (kód z odkazu #/h/<kód>)
create table public.party_puzzles (
  id bigint generated always as identity primary key,
  party_id uuid not null references public.parties (id) on delete cascade,
  author uuid not null references public.players (id) on delete cascade,
  lang text not null,
  code text not null,
  created_at timestamptz not null default now()
);
create index party_puzzles_party on public.party_puzzles (party_id, created_at desc);

alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.party_puzzles enable row level security;
revoke all on public.parties, public.party_members, public.party_puzzles from anon, authenticated;

-- ---------- pomocné funkce ----------

-- Název (přezdívka, parta) bez sprostých slov; stejný seznam pro obojí
create or replace function public.clean_name(p_name text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  plain text := translate(lower(p_name), 'áäčďéěíĺľňóôöŕřšťúůüýž01345 _.-', 'aacdeeillnooorrstuuuyzoieas');
  word text;
begin
  foreach word in array array[
    'kurv', 'prdel', 'pica', 'pice', 'picu', 'kokot', 'curak', 'debil', 'zmrd', 'hovno', 'sracka', 'mrdat', 'mrdk',
    'jebat', 'jebe', 'kunda', 'buzna', 'hajzl', 'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'nigg', 'fagg',
    'whore', 'slut', 'porn', 'hitler', 'nazi'
  ] loop
    if position(word in plain) > 0 then return false; end if;
  end loop;
  return true;
end $$;

create or replace function public.is_member(p_party uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.party_members where party_id = p_party and user_id = auth.uid())
$$;

-- ---------- funkce pro aplikaci ----------

-- Založení party: název 3–24 znaků, nejvýš 5 vlastních part. Zakladatel je rovnou členem.
create or replace function public.create_party(p_name text)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  new_code text;
  new_id uuid;
begin
  if not exists (select 1 from public.players where id = auth.uid()) then raise exception 'no_player'; end if;
  if char_length(v_name) not between 3 and 24 then raise exception 'party_name_length'; end if;
  if v_name !~ '^[A-Za-z0-9áäčďéěíĺľňóôöŕřšťúůüýžÁÄČĎÉĚÍĹĽŇÓÔÖŔŘŠŤÚŮÜÝŽ _.!-]+$' then raise exception 'party_name_chars'; end if;
  if not public.clean_name(v_name) then raise exception 'party_name_bad'; end if;
  if (select count(*) from public.parties where owner = auth.uid()) >= 5 then raise exception 'too_many_parties'; end if;
  loop
    new_code := (select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '') from generate_series(1, 6));
    exit when not exists (select 1 from public.parties where code = new_code);
  end loop;
  insert into public.parties (code, name, owner) values (new_code, v_name, auth.uid()) returning id into new_id;
  insert into public.party_members (party_id, user_id) values (new_id, auth.uid());
  return json_build_object('id', new_id, 'code', new_code, 'name', v_name);
end $$;

-- Připojení kódem: nejvýš 30 členů v partě a 10 part na hráče
create or replace function public.join_party(p_code text)
returns json language plpgsql security definer set search_path = '' as $$
declare
  party public.parties;
begin
  if not exists (select 1 from public.players where id = auth.uid()) then raise exception 'no_player'; end if;
  select * into party from public.parties where code = upper(btrim(coalesce(p_code, '')));
  if party.id is null then raise exception 'party_not_found'; end if;
  if not public.is_member(party.id) then
    if (select count(*) from public.party_members where party_id = party.id) >= 30 then raise exception 'party_full'; end if;
    if (select count(*) from public.party_members where user_id = auth.uid()) >= 10 then raise exception 'too_many_parties'; end if;
    insert into public.party_members (party_id, user_id) values (party.id, auth.uid());
  end if;
  return json_build_object('id', party.id, 'code', party.code, 'name', party.name);
end $$;

-- Odchod z party. Odejde-li zakladatel, partu převezme nejdéle přítomný člen; prázdná parta zanikne.
create or replace function public.leave_party(p_party uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  next_owner uuid;
begin
  delete from public.party_members where party_id = p_party and user_id = auth.uid();
  if exists (select 1 from public.parties where id = p_party and owner = auth.uid()) then
    select user_id into next_owner from public.party_members where party_id = p_party order by joined_at limit 1;
    if next_owner is null then delete from public.parties where id = p_party;
    else update public.parties set owner = next_owner where id = p_party;
    end if;
  end if;
end $$;

-- Zakladatel může odebrat člena (ne sebe)
create or replace function public.remove_member(p_party uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.parties where id = p_party and owner = auth.uid()) then raise exception 'not_owner'; end if;
  if p_user = auth.uid() then raise exception 'bad_value'; end if;
  delete from public.party_members where party_id = p_party and user_id = p_user;
end $$;

-- Moje party
create or replace function public.my_parties()
returns json language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(x order by x.name), '[]'::json) from (
    select p.id, p.code, p.name, p.owner = auth.uid() as owner,
      (select count(*) from public.party_members m2 where m2.party_id = p.id) as members
    from public.parties p join public.party_members m on m.party_id = p.id and m.user_id = auth.uid()
  ) x
$$;

-- Detail party: členové (kdo dnes hrál, odznak Cesty) a posledních 30 hádanek v daném jazyce
create or replace function public.party_detail(p_party uuid, p_lang text)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Europe/Prague')::date;
  result json;
begin
  if not public.is_member(p_party) then raise exception 'not_member'; end if;
  select json_build_object(
    'id', p.id, 'code', p.code, 'name', p.name, 'owner', p.owner = auth.uid(),
    'members', (select coalesce(json_agg(x order by x.played desc, x.nickname), '[]'::json) from (
      select pl.id, pl.nickname, pl.id = auth.uid() as me, pl.id = p.owner as owner,
        exists (select 1 from public.daily_results r where r.user_id = pl.id and r.lang = p_lang and r.day = today) as played,
        pp.level, pp.stars
      from public.party_members m join public.players pl on pl.id = m.user_id
      left join public.path_progress pp on pp.user_id = pl.id and pp.lang = p_lang
      where m.party_id = p.id
    ) x),
    'puzzles', (select coalesce(json_agg(y order by y.created_at desc), '[]'::json) from (
      select z.id, z.code, z.created_at, pl.nickname as author, z.author = auth.uid() as mine
      from public.party_puzzles z join public.players pl on pl.id = z.author
      where z.party_id = p.id and z.lang = p_lang
      order by z.created_at desc limit 30
    ) y)
  ) into result
  from public.parties p where p.id = p_party;
  return result;
end $$;

-- Poslání vlastní hádanky partě (nejvýš 10 za den od jednoho hráče do jedné party)
create or replace function public.post_party_puzzle(p_party uuid, p_lang text, p_code text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_member(p_party) then raise exception 'not_member'; end if;
  if p_lang not in ('cs', 'en') or p_code !~ '^[A-Za-z0-9_-]{20,6000}$' then raise exception 'bad_value'; end if;
  if (select count(*) from public.party_puzzles where party_id = p_party and author = auth.uid()
      and created_at > now() - interval '1 day') >= 10 then
    raise exception 'too_many_puzzles';
  end if;
  insert into public.party_puzzles (party_id, author, lang, code) values (p_party, auth.uid(), p_lang, p_code);
end $$;

-- Smazání hádanky z party: autor nebo zakladatel party
create or replace function public.delete_party_puzzle(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.party_puzzles z where z.id = p_id
    and (z.author = auth.uid() or exists (select 1 from public.parties p where p.id = z.party_id and p.owner = auth.uid()));
end $$;

-- Žebříček nově i pro partu (p_party): jen její členové. Bez party jako dřív.
drop function public.leaderboard(text, text);
create or replace function public.leaderboard(p_lang text, p_kind text, p_party uuid default null)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Europe/Prague')::date;
  result json;
begin
  if p_lang not in ('cs', 'en') then raise exception 'bad_value'; end if;
  if p_party is not null and not public.is_member(p_party) then raise exception 'not_member'; end if;
  if p_kind = 'today' then
    with ranked as (
      select r.user_id, p.nickname, r.tier, r.score, r.seconds, r.won,
        cume_dist() over (partition by r.tier order by r.won, r.score, -r.seconds) as pct
      from public.daily_results r join public.players p on p.id = r.user_id
      where r.lang = p_lang and r.day = today
        and (p_party is null or r.user_id in (select m.user_id from public.party_members m where m.party_id = p_party))
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
      select s.user_id, count(*)::int as seeds from public.seeds s
      where s.lang = p_lang
        and (p_party is null or s.user_id in (select m.user_id from public.party_members m where m.party_id = p_party))
      group by s.user_id
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

-- ---------- oprávnění ----------
revoke execute on function public.clean_name(text), public.is_member(uuid) from public, anon, authenticated;
revoke execute on function public.create_party(text), public.join_party(text), public.leave_party(uuid),
  public.remove_member(uuid, uuid), public.my_parties(), public.party_detail(uuid, text),
  public.post_party_puzzle(uuid, text, text), public.delete_party_puzzle(bigint), public.leaderboard(text, text, uuid)
  from public, anon;
grant execute on function public.create_party(text), public.join_party(text), public.leave_party(uuid),
  public.remove_member(uuid, uuid), public.my_parties(), public.party_detail(uuid, text),
  public.post_party_puzzle(uuid, text, text), public.delete_party_puzzle(bigint), public.leaderboard(text, text, uuid)
  to authenticated;
