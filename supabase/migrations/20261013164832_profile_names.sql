-- Profiles store first and last name, set by the parent after sign-up, in
-- place of a single display name chosen at sign-up.

alter table public.profiles
  add column first_name text
    check (char_length(trim(first_name)) between 1 and 100),
  add column last_name text
    check (char_length(trim(last_name)) between 1 and 100);

alter table public.profiles drop column display_name;

grant update (first_name, last_name) on public.profiles to authenticated;

-- Sign-up only collects email and password now; names start empty and
-- language comes from metadata when present.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_language text := new.raw_user_meta_data ->> 'language';
begin
  insert into public.profiles (id, language)
  values (
    new.id,
    case when requested_language in ('en', 'fr') then requested_language else 'en' end
  );
  return new;
end;
$$;
