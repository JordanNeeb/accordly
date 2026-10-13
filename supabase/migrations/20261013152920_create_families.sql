-- Families and membership. A family row is created only when a co-parent
-- invite is accepted (feature 5), so every family has both parents.

create table public.families (
  id uuid primary key default gen_random_uuid(),
  time_zone text not null,
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create index family_members_user_id_idx on public.family_members (user_id);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

-- Membership helpers live outside the exposed API schemas. They run as the
-- owner so policies can check family_members without recursing through its RLS.
create schema private;

create function private.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = target_family_id
      and user_id = (select auth.uid())
  );
$$;

create function private.shares_family(other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_members mine
    join public.family_members theirs on theirs.family_id = mine.family_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = other_user_id
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke execute on all functions in schema private from public;
grant execute on function private.is_family_member(uuid) to authenticated;
grant execute on function private.shares_family(uuid) to authenticated;

create policy "Members can read their families"
  on public.families for select
  to authenticated
  using (private.is_family_member(id));

create policy "Members can read their families' members"
  on public.family_members for select
  to authenticated
  using (private.is_family_member(family_id));

create policy "Users can read co-parents' profiles"
  on public.profiles for select
  to authenticated
  using (private.shares_family(id));

-- Clients only read. Feature 5's server-side function is the write path.
revoke all on public.families from anon;
revoke all on public.family_members from anon;
revoke insert, update, delete on public.families from authenticated;
revoke insert, update, delete on public.family_members from authenticated;
