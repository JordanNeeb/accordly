# Feature: Supabase foundation

**From build-plan:** feature 2
**Build attempt:** 1
**Branch:** feature/supabase-foundation
**Status:** verified

## Goal

Get the Supabase backend running locally and on a staging project in
`ca-central-1`, with the first migrations: `profiles` (created automatically at
sign-up), `families`, and `family_members`, all protected by row-level security
scoped to the signed-in user and their family membership. Later features
(3 auth, 5 pairing, 6+ family data) build on this schema and its membership
check.

Decisions from the planning conversation (2026-10-13):

- A parent can belong to **multiple families from the start** (no one-family UI
  limit).
- Creating a family and inviting the co-parent is **one step**. The `families`
  row is created only when the invite is **accepted**, so every family has both
  parents from the moment it exists. That makes the overview's
  `families.status` (`pending | active`) unnecessary, so it is dropped.
- A duplicate pairing is detected per pair of parents (feature 5).
- `children` moves to feature 5.

## In scope

- A running local Supabase stack (`npx supabase@latest start`, Docker).
- Migration 1: `profiles`, the `auth.users` sign-up trigger, and profile RLS.
- Migration 2: `families`, `family_members`, a private membership helper, and
  family RLS. Co-parents can read each other's profiles.
- A staging Supabase project in `ca-central-1`, linked to the CLI, with both
  migrations pushed.
- `AGENTS.md` Commands updated with the Supabase commands this feature uses.
- `blueprint/build-plan.md` feature 2 line updated (children removed). Already
  approved.

## Out of scope

- Sign-up, sign-in, or profile UI. The Supabase client in `apps/web`, env files,
  and email confirmation settings (feature 3).
- `family_invites`, creating families, the pair-duplicate rules, accepting an
  invite, and `children` (feature 5).
- Generated database types in `@accordly/shared` (feature 3, when the first
  consumer exists).
- A production Supabase project (`/release`).
- A database test runner (pgTAP / `supabase test db`). Testing is opt-in through
  `/tests`.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`.
Implement all steps and verify each step's Done when before moving on. Then
present one feature-level review packet. There are no checkpoint commits;
`/complete` creates the final feature commit.

Step 4 changes a remote service. It needs the user's account actions (`supabase
login`, creating the project) and a **separate explicit yes in chat before
`db push`**. Stop there and ask.

## Build steps

- [x] 1. **Branch and local stack**
  - Create `feature/supabase-foundation` from `dev` (`be81624`, same commit as
    `main` today). Work is based on `dev` by the user's choice.
  - The user starts Docker Desktop. Run `npx supabase@latest start` from the
    repo root and confirm that `supabase/config.toml` (Postgres 17) loads
    without config errors from the newer CLI. If the CLI rejects a key,
    fix only that key.
  - **Done when:** `npx supabase@latest status` lists the API, DB, Studio, and
    Inbucket/Mailpit URLs, and `npx supabase@latest db reset` succeeds with no
    migrations. Typecheck still passes.

- [x] 2. **Profiles and sign-up trigger**
  - `npx supabase@latest migration new create_profiles`.
  - Create the `profiles` table (contract below). Enable RLS.
  - Add the trigger function `public.handle_new_user()` (`security definer`,
    `set search_path = ''`) and an `after insert on auth.users` trigger that
    inserts the profile from `raw_user_meta_data`.
  - Policies: `select` own row. `update` own row (`using` and `with check`
    `id = (select auth.uid())`). No `insert` or `delete` policy.
  - Column privileges: revoke `update` on `profiles` from `authenticated`, then
    grant `update (display_name, language)` only. Revoke all from `anon`.
  - **Done when:** `db reset` applies the migration. A sign-up through the local
    Auth API (`POST /auth/v1/signup` with `data: {display_name, language}`)
    creates one matching profile row. A sign-up without metadata still succeeds,
    with the fallback values. As that user, through the REST API with their
    access token: they read only their own profile, can change
    `display_name`/`language`, get an error changing `id` or `created_at` or
    setting `language = 'de'`, and cannot insert or delete. An anon request returns
    no rows.

- [x] 3. **Families, membership, and family RLS**
  - `npx supabase@latest migration new create_families`.
  - Create `families` and `family_members` (contract below). Enable RLS on both.
  - Create the `private` schema (not exposed through the API) and
    `private.is_family_member(family_id uuid)` and
    `private.shares_family(other_user_id uuid)`. Both are `security definer`,
    `stable`, `set search_path = ''`, and keyed on `auth.uid()`, so policies
    don't recurse through `family_members` RLS. Grant `usage` on the schema and
    `execute` on the functions to `authenticated` only.
  - Policies:
    - `families`: `select` when `private.is_family_member(id)`.
    - `family_members`: `select` when `private.is_family_member(family_id)`, so
      a member sees both rows of their families.
    - `profiles`: add `select` when `private.shares_family(id)` (co-parent's
      name and language).
    - No `insert`, `update`, or `delete` policies on `families` or
      `family_members`. Feature 5 writes them through a server-side function.
  - Revoke all on both tables from `anon`.
  - **Done when:** `db reset` applies both migrations. Using three local users
    A, B, and C, with families A+B and A+C inserted as `postgres` (a
    fixture, never committed as seed), each check below is shown through the
    REST API with each user's token:
    - A sees both families, all four membership rows, and B's and C's profiles.
    - B sees only the A+B family and its two membership rows, A's profile, and
      not C's profile.
    - C sees only A+C and not B.
    - Insert, update, or delete on `families` or `family_members` by any user
      affects nothing or errors.
    - An anon request returns no rows.

- [x] 4. **Staging project and commands**
  - The user creates the staging project in the Supabase dashboard: region
    `ca-central-1`, Postgres 17, name chosen by the user. The user runs
    `! npx supabase@latest login`.
  - `npx supabase@latest link --project-ref <ref>`. Confirm the remote major
    version matches `major_version = 17`.
  - **Stop and ask for a yes**, then `npx supabase@latest db push`.
  - Update the `AGENTS.md` Backend commands: start/stop/status, `db reset`,
    `migration new <name>`, `link`, `db push` (remote, approval required).
    Remove the "first used in feature 2" note.
  - **Done when:** `npx supabase@latest migration list` shows both migrations
    applied locally and remotely, and staging's Table Editor shows RLS enabled on
    all three tables. No project ref, keys, or database password are committed
    (`supabase/.temp/` stays ignored).

## Files / areas

- `supabase/migrations/<timestamp>_create_profiles.sql` (new)
- `supabase/migrations/<timestamp>_create_families.sql` (new)
- `supabase/config.toml`: only if the current CLI rejects a key
- `AGENTS.md`: Commands > Backend
- `blueprint/build-plan.md`: feature 2 line (children removed)

## Data / contracts

All ids are `uuid` and all timestamps are `timestamptz not null default now()`,
set by the server. Clients never supply ids or timestamps here.

### `public.profiles`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | `references auth.users(id) on delete restrict` |
| `display_name` | text not null | `check (char_length(trim(display_name)) between 1 and 100)` |
| `language` | text not null default `'en'` | `check (language in ('en', 'fr'))` |
| `created_at` | timestamptz | server default |

The sign-up trigger sets:

- `display_name`: the trimmed `raw_user_meta_data->>'display_name'`. If it is
  missing or blank, the part of the email before `@`, truncated to 100.
- `language`: `raw_user_meta_data->>'language'` if it is `en` or `fr`,
  otherwise `en`.

A bad metadata value must never make sign-up fail.

`on delete restrict`: deleting an auth user who has a profile fails until
record retention is decided (overview open question). Shared history is never
silently cascaded away.

### `public.families`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | `default gen_random_uuid()` |
| `time_zone` | text not null | IANA name. Validated by the feature 5 creation function. |
| `created_at` | timestamptz | server default |

There is no `status` column, because a family exists only after the invite is
accepted.

### `public.family_members`

| Column | Type | Rules |
|---|---|---|
| `family_id` | uuid | `references families(id) on delete restrict` |
| `user_id` | uuid | `references profiles(id) on delete restrict` |
| `joined_at` | timestamptz | server default |

- Primary key (`family_id`, `user_id`), plus an index on `user_id` for the
  membership lookup.
- Exactly two parents per family is enforced by feature 5's creation function,
  the only write path.

### Access summary

| Table | anon | authenticated read | authenticated write |
|---|---|---|---|
| profiles | none | own, plus co-members | update own `display_name`, `language` |
| families | none | families they belong to | none (feature 5 function) |
| family_members | none | rows of families they belong to | none (feature 5 function) |

The actor always comes from `auth.uid()`, never from a client-supplied id.

## Testing

No test command is configured, so unit tests are not a gate. The evidence for
each step is the Done-when checks, run against the local stack: real REST/Auth
API calls with each user's JWT, so RLS applies as it will for the apps. Record
the commands and results in the review packet. `npm run typecheck` must still
pass. Do not add pgTAP or another runner in this feature.

## Notes for the AI

- Use `npx supabase@latest` for every CLI call, never the Homebrew v1 binary.
- Create migrations with `migration new`. Never edit the remote database by hand.
  After step 4, never edit a migration that has been pushed; add a new one.
- `security definer` functions: `set search_path = ''`, schema-qualify
  everything, keep them in `private` (helpers) or `public` (trigger only). Do not
  expose `private` in `config.toml` `api.schemas`.
- Wrap `auth.uid()` as `(select auth.uid())` in policies (Supabase's
  per-statement caching guidance).
- Three-user fixtures for step 3 are inserted ad hoc on the local DB and wiped by
  `db reset`. Don't add them to `supabase/seed.sql`.
- Pushing to staging is a remote change. It needs the user's explicit yes in chat
  at that moment, even though the spec is approved.
- RLS and auth make this feature sensitive. With `independentReview:
  when-sensitive`, expect independent review to be selected before `/complete`.
- The planning docs still say "v1 UI limits each parent to one family", "active
  once both have joined", and children in feature 2. They are updated separately
  (see the review handoff), not by `/implement`.

## Open questions

Non-blocking. The spec uses the proposed answer unless the user changes it.

1. **Display name fallback.** If sign-up metadata has no display name, the
   trigger uses the email's local part. Feature 3's form will always send one,
   so this only covers dashboard-created or malformed sign-ups. The alternative
   is failing that sign-up.
2. **Staging project name.** The user's choice when creating it, for example
   `accordly-staging`.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":11669,"specSha256":"dbaf4369317931da64c3a232818ab1acae2423a33d60ac781358a967b3e492fb","branch":"refs/heads/feature/supabase-foundation","head":"de0c6c3a43e6651005acb3131211a74166fc3ddc","baseRef":"refs/heads/dev","baseCommit":"be816240e3e822af07585d90def06fbcb1f806be","sourceTree":"2f558358189d1db1401021b041d816fa748b4a26","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** de0c6c3a43e6651005acb3131211a74166fc3ddc
**Base commit:** be816240e3e822af07585d90def06fbcb1f806be
**Base ref:** main
**Spec hash:** dbaf4369317931da64c3a232818ab1acae2423a33d60ac781358a967b3e492fb
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-10-13T15:39:50Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-13T15:41:42Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `be816240e3e822af07585d90def06fbcb1f806be..de0c6c3a43e6651005acb3131211a74166fc3ddc` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `npm run typecheck`: pass
- `npm run lint:web`: pass
- `npx supabase@latest db lint --local`: pass (no schema errors in extensions, private, public)
- Read-only catalog queries on local DB (migrations, roles, function ACLs/owners/search_path, table and column grants, policies): pass
- RLS and trigger behavior probes as postgres/authenticated/anon inside one rolled-back transaction: pass

### Evidence

- Preflight: HEAD = target, `git merge-base main HEAD` = base, spec SHA-256 matches (tracked spec), only `blueprint/context/review.md` dirty.
- Delta reviewed: AGENTS.md (Backend commands), blueprint/build-plan.md (feature 2 line), blueprint/context/current-feature.md, supabase/migrations/20261013152816_create_profiles.sql, supabase/migrations/20261013152920_create_families.sql.
- Sign-up trigger: trimmed name and `fr` kept; blank name and `de` fall back to email local part and `en`; null metadata, null email, and non-string JSON values never fail insert; 150-char name truncated to 100.
- Three-user fixture (A+B, A+C): A sees 2 families, 4 member rows, profiles A/B/C; B sees 1 family, 2 rows, profiles A/B only; C sees profiles A/C and 1 family; helpers return false for non-member targets.
- Writes: own display_name update succeeds; update of another user's profile affects 0 rows; `id` update, insert into family_members, and profile delete are permission denied; `language = 'de'` violates check.
- anon: permission denied on profiles and on schema private. Deleting an auth user with a profile is blocked by the restrict FK.
- Helper functions: owner postgres (bypassrls), security definer, `search_path=""`, execute granted only to authenticated; private schema usage only for authenticated and not in `api.schemas`. `handle_new_user` execute only postgres/service_role.

### Findings

- F-01 [P3] open - authenticated keeps TRUNCATE, TRIGGER, REFERENCES on the three RLS tables (not reachable via API today)
- F-02 [P3] unverified - profiles select policy evaluates shares_family per row on unfiltered reads

### Remaining risk

- No test command is configured; no committed, repeatable RLS tests (pgTAP is out of scope by spec), so the access matrix is guarded only by ad hoc probes.
- No browser test command is configured.
- Staging push (step 4) was not verified: the reviewer did not access the linked remote project by instruction.
- Behavior probes used SQL role switching with JWT claims, not the REST/Auth HTTP API; PostgREST surfaces anon access as an error rather than empty rows.
- Mobile lint is not configured.
