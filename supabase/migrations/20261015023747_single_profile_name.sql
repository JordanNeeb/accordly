-- Profiles store one name instead of separate first and last names. The name
-- is set at sign-up (email sign-up sends it; Google provides it) and stays
-- editable on the profile.

alter table public.profiles
  add column name text
    check (char_length(trim(name)) between 1 and 100);

-- Copy existing names before dropping the old columns. Fall back to the name
-- in sign-up metadata (Google's `name` or `full_name`). Every value is
-- trimmed and clipped, and a blank one becomes null, so it fits the check.
update public.profiles p
set name = coalesce(
  nullif(trim(left(trim(concat_ws(' ',
    nullif(trim(p.first_name), ''),
    nullif(trim(p.last_name), '')
  )), 100)), ''),
  nullif(trim(left(trim(u.raw_user_meta_data ->> 'name'), 100)), ''),
  nullif(trim(left(trim(u.raw_user_meta_data ->> 'full_name'), 100)), '')
)
from auth.users u
where u.id = p.id;

-- The column grants on first_name and last_name go with the columns.
alter table public.profiles
  drop column first_name,
  drop column last_name;

grant update (name) on public.profiles to authenticated;

-- Sign-up metadata is client-controlled (anyone can call sign-up with the
-- public key), so a missing, blank, or oversized name becomes null or is
-- clipped rather than failing the check and the whole sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_language text := new.raw_user_meta_data ->> 'language';
  requested_name text := coalesce(
    nullif(trim(left(trim(new.raw_user_meta_data ->> 'name'), 100)), ''),
    nullif(trim(left(trim(new.raw_user_meta_data ->> 'full_name'), 100)), '')
  );
begin
  insert into public.profiles (id, name, language)
  values (
    new.id,
    requested_name,
    case when requested_language in ('en', 'fr') then requested_language else 'en' end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
