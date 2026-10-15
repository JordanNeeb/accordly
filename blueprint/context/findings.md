# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P3] open - authenticated keeps TRUNCATE, TRIGGER, REFERENCES on RLS tables

**File:** supabase/migrations/20261013152920_create_families.sql:81
**Found:** 2026-10-13 by /audit independent (scope: current; lens: security)
**Why it matters:** The migrations revoke only `insert, update, delete` from `authenticated` (also profiles migration line 28), so Supabase's default grants leave `TRUNCATE`, `TRIGGER`, and `REFERENCES` on `profiles`, `families`, and `family_members` (confirmed in `information_schema.role_table_grants` on the local DB). `TRUNCATE` bypasses RLS; `TRUNCATE public.family_members` as `authenticated` would wipe every family's membership. Not reachable today: PostgREST and pg_graphql expose no truncate and no public SQL-executing RPC exists, so this is defense in depth for permanent, court-relevant data.
**Suggested fix:** In a new migration (these are already pushed to staging), `revoke truncate, trigger, references on public.profiles, public.families, public.family_members from authenticated;`. No current requirement is lost.
**Resolution:**

### F-02 [P3] unverified - profiles select policy calls shares_family per row

**File:** supabase/migrations/20261013152920_create_families.sql:73
**Found:** 2026-10-13 by /audit independent (scope: current; lens: performance)
**Why it matters:** `EXPLAIN` of an unfiltered `select * from public.profiles` as `authenticated` is a seq scan with filter `id = auth.uid() OR private.shares_family(id)`, so the security definer function runs once per profile row. Fine with an `id` filter (PK lookup) and at current scale; could matter if a client lists profiles unfiltered once user count grows. No profiling evidence.
**Suggested fix:** Keep client queries filtered by `id`; if needed later, rewrite as `id in (select private.co_member_ids())` set-returning helper so it evaluates once per statement.
**Resolution:**

### F-04 [P3] open - Proxy redirects drop refreshed session cookies

**File:** apps/web/src/proxy.ts:57
**Found:** 2026-10-13 by /audit independent (scope: current; lens: quality, security)
**Why it matters:** `getClaims()` may refresh the session and `setAll` writes the new cookies and cache headers onto `response`, but the redirect branch returns a fresh `NextResponse.redirect(url)` without them. A signed-in parent with an expired access token who opens `/sign-in` or `/sign-up` keeps the rotated-out refresh token. Today it is masked by `refresh_token_reuse_interval = 10`, because the follow-up request reuses the token within 10 seconds. A cleared session on the signed-out branch is likewise not cleared until the next request. This departs from the `@supabase/ssr` rule to always return the response that carries the refreshed cookies (spec Notes for the AI).
**Suggested fix:** Before returning the redirect, copy `response.cookies.getAll()` onto it (and the cache headers passed to `setAll`). No current requirement is lost.
**Resolution:** Re-examined 2026-10-15 (target 5a668a0): still open, now at line 57. The delta widens its reach: signed-in visits to `/` (the most common entry point) and signed-out visits to `/dashboard` now take the redirect branch. Still masked by the 10-second reuse interval, so severity stays P3. Re-examined 2026-10-15 (target 8f6565b): unchanged, still open at line 57. Re-examined 2026-10-15 (target 8d545c2): still open, now at line 83 (`response = NextResponse.redirect(url)`). The bilingual delta rewrote this branch to attach the `tango-lang` cookie to the redirect, but the refreshed session cookies and cache headers from `setAll` are still dropped. Still masked by the 10-second reuse interval; severity stays P3.

### F-05 [P3] open - Any signed-in session can set a new password without reauthentication

**File:** apps/web/src/app/(auth)/actions.ts:148
**Found:** 2026-10-13 by /audit independent (scope: current; lens: security)
**Why it matters:** `/reset-password` and `updatePassword` only require some session, not a recovery session, and `supabase/config.toml:229` keeps `secure_password_change = false`. Anyone holding a parent's signed-in browser can therefore open `/reset-password` and replace the password without knowing the current one, locking the parent out of permanent records. The spec intends the page for the recovery flow, and the out-of-scope list excludes changing a password from a signed-in session.
**Suggested fix:** User decision. Either set `secure_password_change = true` (a recovery-link sign-in counts as a recent login, so the reset flow keeps working), or accept the risk as the standard Supabase recovery pattern. No current requirement is lost with the config change.
**Resolution:** Re-examined 2026-10-15 (target 5a668a0): still open, now at `(auth)/actions.ts:174`. The new sign-out after `updateUser` does not change it, because the password is already replaced by then. Re-examined 2026-10-15 (target 8f6565b): unchanged, still open (`updatePassword` at `(auth)/actions.ts:162`, `supabase/config.toml:229`). Re-examined 2026-10-15 (target 8d545c2): unchanged in substance, still open; the file moved to `apps/web/src/app/[lang]/(auth)/actions.ts` (`updatePassword` at line 187) and only gained localized messages; `supabase/config.toml:229` unchanged.

### F-06 [P3] open - Success notices replace the form, so announcement and focus are unreliable

**File:** apps/web/src/components/auth/sign-up-form.tsx:17
**Found:** 2026-10-13 by /audit independent (scope: current; lens: quality)
**Why it matters:** On success, sign-up (and `forgot-password-form.tsx:20`) unmounts the form and mounts a new `FormAlert` that already contains the notice. Screen readers often skip a live region that is created with its content in place, and the focused submit button vanishes, which drops focus to `body`. The "check your email" message is the only next-step instruction, so a screen-reader user may never hear it.
**Suggested fix:** Keep one persistent `FormAlert` mounted and render the notice into it (hiding the fields), or move focus to the notice with `tabIndex={-1}`. No current requirement is lost.
**Resolution:** Re-examined 2026-10-15 (target ad2b8c3): unchanged, still open at `sign-up-form.tsx:18`; the new Name field does not affect it. Re-examined 2026-10-15 (target 8d545c2): unchanged, still open at `sign-up-form.tsx:19` and `forgot-password-form.tsx:21`; the delta only swapped in localized strings.

### F-07 [P3] open - Complete-profile prompt reappears after a later failed save

**File:** apps/web/src/components/profile/profile-form.tsx:34
**Found:** 2026-10-13 by /audit independent (scope: current; lens: quality)
**Why it matters:** `needsName` combines the current action notice with the initial server props. After a first successful save, the props still hold the empty names, so any later submission that returns a field or form error shows "Add your first and last name" again even though both names are saved.
**Suggested fix:** Track saved names from the last successful result (for example `state.values` when `state.notice === saved`), or call `revalidatePath('/profile')` / `refresh()` after a successful update so the props reflect the database. No current requirement is lost.
**Resolution:** Re-examined 2026-10-15 (target ad2b8c3): still open, now at line 30 (`needsName = !saved && !name`). The single-field rewrite keeps the same props-based logic, so after a first successful save of an empty profile any later failed save shows "Add your name" again. Re-examined 2026-10-15 (target 8d545c2): still open at line 31. `saved` now compares the action's notice (cookie language, via `requestMessages`) with the page's `auth.profile.saved` (`[lang]` param language). These agree in the normal flow, because the proxy picks the page language from the same cookie, but if the language is switched in another tab before saving, the comparison fails and the prompt can also show after a successful save. Severity stays P3; the explicit-flag fix (return `saved: true` from `updateProfile`) resolves both cases.

### F-08 [P3] open - Name sanitising strips only spaces, so visually blank names pass

**File:** supabase/migrations/20261015023747_single_profile_name.sql:7
**Found:** 2026-10-15 by /audit independent (scope: current; lens: security, quality)
**Why it matters:** Postgres `trim()` removes only spaces, while the web's `validateName` uses JavaScript `trim()` (all Unicode whitespace). The check at line 7 and the trigger sanitising at lines 42-45 therefore accept a name of only tabs, newlines, or non-breaking spaces. In a rolled-back local test, sign-up metadata `{"name":"\t\n"}` produced a profile with that 2-character name, and `{"name":{"x":1}}` stored the JSON text `{"x": 1}`. Both paths are reachable with the public key (direct sign-up, or a direct PostgREST `update` of `name`). The result is a "name" that counts as set (the profile prompt hides, and a future invite gate on `name is not null` would pass) while the dashboard's JS trim falls back to the email, and a blank name could appear on court-facing records. Impact is low: it is self-inflicted by the parent and the sign-up never fails.
**Suggested fix:** In a new migration, normalise with a whitespace-aware expression, for example `nullif(btrim(regexp_replace(value, '\s+', ' ', 'g')), '')` (or `btrim(value, E' \t\n\r\u00a0')`) in both the trigger and a replacement check, and read the metadata only when `jsonb_typeof(... -> 'name') = 'string'`. No current requirement is lost.
**Resolution:** Re-examined 2026-10-15 (target 27b08d6): migration unchanged, still open at line 7 (trigger sanitising lines 42-45). Severity stays P3.
