-- Kinzle: oprava posílání hádanky partě (Postgres nedovolí v regulárním výrazu opakování {20,6000}).
-- Spuštění: Supabase → ☰ → SQL Editor → New query → vložit → Run.
create or replace function public.post_party_puzzle(p_party uuid, p_lang text, p_code text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_member(p_party) then raise exception 'not_member'; end if;
  if p_lang not in ('cs', 'en') or char_length(coalesce(p_code, '')) not between 20 and 6000
     or p_code !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'bad_value';
  end if;
  if (select count(*) from public.party_puzzles where party_id = p_party and author = auth.uid()
      and created_at > now() - interval '1 day') >= 10 then
    raise exception 'too_many_puzzles';
  end if;
  insert into public.party_puzzles (party_id, author, lang, code) values (p_party, auth.uid(), p_lang, p_code);
end $$;
