-- Account type, chosen before sign-up. Null means none was chosen (a new Google
-- account created from the sign-in page). Every existing account is a parent.
-- There is no client update grant on the column; only the sign-up trigger and
-- set_account_type write it.
alter table public.profiles
  add column account_type text check (account_type in ('parent', 'professional'));

update public.profiles set account_type = 'parent';

-- Sign-up metadata is client-controlled, so an unknown account type becomes
-- null rather than failing the whole sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_language text := new.raw_user_meta_data ->> 'language';
  requested_account_type text := new.raw_user_meta_data ->> 'account_type';
  requested_name text := coalesce(
    nullif(trim(left(trim(new.raw_user_meta_data ->> 'name'), 100)), ''),
    nullif(trim(left(trim(new.raw_user_meta_data ->> 'full_name'), 100)), '')
  );
begin
  insert into public.profiles (id, name, language, account_type)
  values (
    new.id,
    requested_name,
    case when requested_language in ('en', 'fr') then requested_language else 'en' end,
    case when requested_account_type in ('parent', 'professional') then requested_account_type end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Google sign-up can't carry metadata, so the OAuth callback sets the type
-- chosen before sign-up. It only fills a type that is still null, so an
-- existing account keeps its type.
create function public.set_account_type(requested text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if requested is null or requested not in ('parent', 'professional') then
    raise exception 'invalid account type' using errcode = '22023';
  end if;
  update public.profiles
  set account_type = requested
  where id = auth.uid() and account_type is null;
end;
$$;

revoke execute on function public.set_account_type(text) from public, anon;
grant execute on function public.set_account_type(text) to authenticated;
