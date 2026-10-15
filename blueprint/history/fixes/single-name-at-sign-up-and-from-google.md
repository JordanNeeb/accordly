# Fix: Single name at sign-up and from Google

**Type:** Fix
**Status:** verified
**Branch:** fix/single-name-at-sign-up-and-from-google

## The problem

New parents start with no name: they have to find the profile page and add it
before they can invite a co-parent (feature 5).

- **Email sign-up** (`components/auth/sign-up-form.tsx`, `signUp` in
  `app/(auth)/actions.ts`) asks only for email and password.
- **Google sign-up** ignores the name Google already provides.
  `public.handle_new_user()` (last replaced in
  `supabase/migrations/20261013164832_profile_names.sql`) inserts only `id` and
  `language`.
- **Storage:** profiles store `first_name` and `last_name` separately. The
  product now wants one **name**.

Both plans describe separate first and last names given after sign-up, so they
change too.

## The fix

**Database** (one new migration; the old ones are already pushed and must not
be edited):

1. Add `public.profiles.name text`, with
   `check (char_length(trim(name)) between 1 and 100)`. It stays nullable.
2. **Backfill.** Set `name` from the existing names: the trimmed first and last
   name joined by one space, ignoring blanks. Where that gives nothing, use the
   `auth.users.raw_user_meta_data` keys `name`, then `full_name`. Every value
   is sanitised as `nullif(trim(left(trim(value), 100)), '')`.
3. Drop `first_name` and `last_name`, only after the backfill in the same
   migration. The data is copied first, so nothing is lost beyond the split
   between first and last.
4. `grant update (name) on public.profiles to authenticated`. The old column
   grants go away with the dropped columns.
5. Replace `public.handle_new_user()`:
   - New profiles get `name` from metadata `name`, then `full_name`.
     - Email sign-up sends `name`.
     - Google provides `name` / `full_name`. Before relying on these, confirm
       which keys a local Google user actually has (Studio, or
       `select raw_user_meta_data from auth.users`).
   - Use the same sanitising. Sign-up metadata is client-controlled, because
     anyone can call Supabase sign-up directly with the public key, so a bad
     value becomes `null` instead of breaking the `check` constraint and
     failing the whole sign-up.
   - Keep the language handling, `security definer`, `set search_path = ''`
     and the revoked execute grants exactly as they are.
6. Regenerate `packages/shared/src/database.types.ts`.

**Web:**
- **Messages** (`lib/auth/messages.ts`):
  - Replace `fields.firstName` / `fields.lastName` with `fields.name: "Name"`.
  - Replace `errors.firstNameLength` / `errors.lastNameLength` with
    `errors.nameLength: "Enter a name of up to 100 characters."`.
  - `profile.completePrompt` becomes "Add your name. Your co-parent will see
    it on invites, messages, and exported records."
- **Validation** (`lib/auth/validation.ts`): `AuthField` and `values` use
  `name` instead of `firstName` / `lastName`. `validateName` keeps its 1–100
  rule.
- **Sign-up:**
  - A required **Name** field (`autoComplete="name"`) above Email. It shows
    the `nameLength` error, takes focus on error, and keeps the typed value.
    Passwords are never re-shown.
  - `signUp` validates it and passes `options.data.name`.
- **Profile:**
  - `profile/page.tsx` selects `name`.
  - `ProfileForm` takes `name`, with one Name field in place of two. The
    prompt shows when `name` is empty.
  - `profile/actions.ts` validates and updates `name`.
- **Dashboard:** `dashboard/page.tsx` selects `name` and falls back to the email
  when it is empty.

**Plans:**
- `blueprint/project-plan.md`:
  - The sign-up bullet becomes: "Sign-up asks for name, email and password;
    Google sign-up uses the name from Google. Parents can change their name on
    their profile; a name is required before sending a co-parent invite.
    Language is chosen with an EN/FR toggle, not a form field."
  - The data bullet "first and last name" becomes "name".
- `project-overview.md`: profiles becomes
  `name` (text, nullable, 1–100 characters), set at sign-up or from Google and
  editable on the profile, required before sending an invite (feature 5).
  Recompute `blueprint:source-hash`.

**Must not break:**
- email confirmation and the "check your email" notice, which still never
  reveals whether an account exists
- the rate-limit and weak-password errors
- Google sign-in for existing accounts (linking an identity doesn't insert a
  user)
- editing a name on the profile page
- the dashboard's name display

## Build steps

- [x] **1. Migration and types**
  - Run `npx supabase@latest migration new single_profile_name`, write steps 1–5
    above, then regenerate the types.
  - Done when:
    - `npx supabase@latest db reset` and `npx supabase@latest db lint` succeed
    - a seeded or hand-inserted profile with a first and last name ends up with
      the joined `name` and no first or last columns
    - a raw `insert` into `auth.users` with blank, whitespace-only or
      150-character metadata `name` still creates a profile, with a `null` or
      clipped name
    - `npm run typecheck` then fails only in the web files listed under Web
- [x] **2. Web: messages, validation, profile and dashboard**
  - Move the messages, validation, profile page, form and action, and dashboard
    to the single `name`.
  - Done when: `npm run typecheck` and `npm run lint:web` pass, and saving a
    blank or 101-character name on `/profile` shows `nameLength` while a valid
    name saves.
- [x] **3. Web: name on sign-up**
  - Add the Name field to `sign-up-form.tsx` and the validation and
    `options.data.name` to `signUp`.
  - Done when: a blank or 101-character name shows the field error, focuses
    it, and keeps the typed values. Valid input reaches the "check your email"
    notice. Typecheck and lint pass.
- [x] **4. Plans and overview**
  - Make the plan and overview edits above.
  - Done when: the plan, overview and fingerprint agree, and
    `npm run build:web` passes.

## Verify

1. Run `npx supabase@latest db reset`, then `npm run dev:web`.
2. **Email sign-up:** at http://localhost:3000/sign-up, leave Name blank. The
   error shows and Name is focused. Fill it in, sign up, and confirm through
   Mailpit (http://127.0.0.1:54324). The dashboard shows your name at the top
   right, and `/profile` shows it with no "add your name" prompt.
3. **Profile:** change the name on `/profile` and save. The dashboard shows the
   new name.
4. **Google sign-up:** sign up with a new Google account. The dashboard and
   `/profile` show the Google name. Requires the Google OAuth setup in
   `supabase/.env`.

## Notes

- **Staging:** pushing the migration to staging (`npx supabase@latest db push`)
  is a remote change that drops the two columns there. It needs its own
  explicit approval and is not part of this fix.
- **F-07** (the "add your name" prompt reappears after a failed save) is in
  `profile-form.tsx`, which this fix rewrites. The single-field rewrite keeps
  the same props-based logic, so F-07 stays open unless it is fixed separately.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7069,"specSha256":"64fd2ce0f47130720102cc04ffc4c735d607385a2bdc71450e14edd190d517ff","branch":"refs/heads/fix/single-name-at-sign-up-and-from-google","head":"ad2b8c39705c0213120c828fd69466c9d9fca892","baseRef":"refs/heads/dev","baseCommit":"bc8b2656590f5d55794f3ecfa50872f86c8ce54c","sourceTree":"0275d64c402816bddd555283b2e8eabc30f58153","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** ad2b8c39705c0213120c828fd69466c9d9fca892
**Base commit:** bc8b2656590f5d55794f3ecfa50872f86c8ce54c
**Base ref:** origin/dev
**Spec hash:** 64fd2ce0f47130720102cc04ffc4c735d607385a2bdc71450e14edd190d517ff
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-15T02:40:05Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-15T02:44:00Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD` / `git merge-base origin/dev HEAD` / `shasum -a 256 blueprint/context/current-feature.md` / `git status --porcelain --untracked-files=all`: pass (all match the request; only review.md differed)
- `npx supabase@latest db lint`: pass (no schema errors)
- `docker exec -i supabase_db_tango psql -U postgres` (read-only catalog queries for columns, constraints, column grants, function ACL and config, trigger, RLS policies, applied migrations): pass
- `docker exec -i supabase_db_tango psql -U postgres` (rolled-back transaction re-creating first_name/last_name, running the migration file verbatim, then raw `auth.users` inserts exercising the trigger): pass; rollback confirmed (0 test users left, old columns absent)
- `npx supabase@latest gen types typescript --local` diffed against `packages/shared/src/database.types.ts`: pass (identical)
- `npm run typecheck`: pass
- `npm run lint:web`: pass
- `npm run build:web`: pass
- Overview source-hash recomputed per the overview skill rule: pass (matches b2335a4d...)

## Evidence

- Backfill: "  Ann " + "  Lee  " -> "Ann Lee"; last-name-only -> "Solo"; empty names fall back to metadata `name`, then `full_name`; blank metadata -> null; first and last columns dropped after the copy.
- Trigger: blank, whitespace-only, and missing metadata -> null name with sign-up succeeding; 150-char name clipped to 100; `full_name` used when `name` is blank; language handling preserved.
- Function keeps `security definer`, `search_path=""`, and execute only for postgres and service_role; authenticated has column UPDATE on only `name` and `language`; RLS policies unchanged.
- Sign-up action validates the name server-side (1-100 after trim) before sending `options.data.name`; profile update derives the row id from verified claims and updates only `name`; no remaining code references to `first_name`/`last_name` outside migrations.

## Findings

- F-08 [P3] open - name sanitising strips only spaces, so visually blank names pass (new)
- F-06 [P3] open, F-07 [P3] open - re-examined, unchanged by this delta
- No P0 or P1 findings

## Remaining risk

- Backfill clips a combined first and last name over 100 characters, dropping the tail (spec-mandated sanitising); staging data was not inspected.
- Staging `db push` (drops the two columns) is not covered and needs its own approval.
- Google metadata keys were verified only by the trigger test; no local Google user exists, so the real provider payload and the Verify browser flows were not exercised (Check not required).
- No unit or browser test command is configured, so the name validation and sign-up flow have no automated tests.
- Re-submitting sign-up for an unconfirmed email with a different name does not update the profile (trigger runs on insert only); unverified edge case.

## Try it now

1. With Supabase running locally (after this fix's `db reset`, earlier local accounts are gone), start `npm run dev:web` and open http://localhost:3000/sign-up in a private window.
2. Leave **Name** blank and submit. "Enter a name of up to 100 characters." appears, Name is focused, and the typed email stays filled in.
3. Enter a name, email and password, then sign up. Confirm through Mailpit (http://127.0.0.1:54324). The dashboard shows your name at the top right, and `/profile` shows it with no "Add your name" prompt.
4. On `/profile`, change the name and save. `/dashboard` shows the new name. Saving a blank name shows the error.
5. Sign out, then sign up with Google. The dashboard and `/profile` show your Google name.
