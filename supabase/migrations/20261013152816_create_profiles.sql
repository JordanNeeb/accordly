-- Profiles: one row per auth user, created by the sign-up trigger.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  display_name text not null
    check (char_length(trim(display_name)) between 1 and 100),
  language text not null default 'en'
    check (language in ('en', 'fr')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Only display_name and language are editable; profiles are created by the
-- trigger and never deleted by clients.
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name, language) on public.profiles to authenticated;

-- Creates the profile from sign-up metadata. Bad or missing metadata falls back
-- to safe values so sign-up never fails here.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text := trim(left(trim(new.raw_user_meta_data ->> 'display_name'), 100));
  requested_language text := new.raw_user_meta_data ->> 'language';
  email_name text := trim(left(trim(split_part(coalesce(new.email, ''), '@', 1)), 100));
begin
  insert into public.profiles (id, display_name, language)
  values (
    new.id,
    coalesce(nullif(requested_name, ''), nullif(email_name, ''), 'Parent'),
    case when requested_language in ('en', 'fr') then requested_language else 'en' end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
