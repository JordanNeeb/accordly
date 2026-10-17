-- Professional accounts: one row per professional, the record that the
-- professional portal's grants will reference. Professionals have no type;
-- they are all the same. The row is created by the database whenever a
-- profile's account type becomes professional, so clients never write it.

create table public.professional_accounts (
  user_id uuid primary key references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.professional_accounts enable row level security;

create policy "Professionals can read their own account"
  on public.professional_accounts for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.professional_accounts from anon, authenticated;
grant select on public.professional_accounts to authenticated;

-- Covers both ways a type is set: the sign-up trigger (email) and
-- set_account_type (Google). The type is set once, so this runs at most once
-- per profile; the conflict clause keeps it safe regardless.
create function public.handle_professional_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.professional_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_professional_account() from public, anon, authenticated;

create trigger on_profile_professional
  after insert or update of account_type on public.profiles
  for each row
  when (new.account_type = 'professional')
  execute function public.handle_professional_account();

-- Professionals who signed up before this table existed.
insert into public.professional_accounts (user_id)
select id from public.profiles where account_type = 'professional'
on conflict (user_id) do nothing;
