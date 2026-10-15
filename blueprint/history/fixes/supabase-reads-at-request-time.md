# Fix: Supabase reads at request time

**Type:** Fix
**Status:** verified
**Branch:** fix/supabase-reads-at-request-time

## The problem

On `/dashboard` and `/profile`, Next.js warns: "Next.js encountered the unstable
value Date.now() while prerendering. This value can change between renders, so
it must be either prerendered or computed later."

Why it happens:
- `apps/web/next.config.ts` enables `cacheComponents` and `partialPrefetching`,
  so Next.js prerenders as much of each route as it can. With partial
  prefetching, that prerender can include code that reads cookies.
- Both pages call `createClient()` (`apps/web/src/lib/supabase/server.ts`) and
  then `supabase.auth.getClaims()` inside their `<Suspense>` boundaries.
- `@supabase/auth-js` reads `Date.now()` to check whether the session has
  expired. `createClient()` awaits `cookies()`, but nothing marks the code after
  it as request-only, so the clock read happens during a prerender.
- `/reset-password` uses the same client in its page, so it is exposed in the
  same way.

## The fix

In `createClient()`, `await connection()` (from `next/server`) before
`cookies()`, with a short comment on why. This marks every Supabase read as
request-time, so the auth library's clock read only runs for a real request.

- It is the one shared place every page, action and route handler uses to
  reach Supabase, so it covers `/dashboard`, `/profile`, `/reset-password` and
  later pages.
- Update the existing comment on `createClient()`.
- The session-dependent parts of those pages won't be prerendered. They can't
  be correctly anyway, because the session check needs the current time.
- No new dependency, configuration change or abstraction.

**Must not break:**
- Server Actions (sign-in, sign-up, profile save, password update, sign-out)
  and the `/auth/callback` and `/auth/confirm` route handlers, where
  `connection()` resolves immediately
- the static landing page `/` and the auth form pages, which don't call
  `createClient()` during render
- the proxy, which builds its own client and is unaffected

## Build steps

- [x] **1. Await `connection()` in `createClient()`**
  - Import `connection` from `next/server` and await it at the start of
    `createClient()`. Update the comment.
  - Done when:
    - `npm run typecheck`, `npm run lint:web` and `npm run build:web` pass
    - the build's route table still lists `/` as static
    - with `npm run dev:web` running, loading `/dashboard` and `/profile` while
      signed in no longer shows the `Date.now()` warning in the terminal or
      browser overlay, and both pages still show the parent's name. This needs
      the user's running dev server and a signed-in browser.

## Verify

1. Run `npm run dev:web` and sign in at http://localhost:3000.
2. Open `/dashboard`, then `/profile`. There is no `Date.now()` prerender
   warning in the terminal or the Next.js dev overlay. Your name shows in the
   dashboard's top bar and in the profile form.
3. Save the profile, sign out and sign in again. Everything still works.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":3056,"specSha256":"4d66b6f7812677d1360a49a2110b622b6a3e973e0c973152345f304e51a38642","branch":"refs/heads/fix/supabase-reads-at-request-time","head":"27b08d64d30e0230db89e6829a8b6a94c9ef7bef","baseRef":"refs/heads/dev","baseCommit":"1abd151a393801add71088f54317f7d2fa2de3f3","sourceTree":"4271135e74d9e8455b6bf705df51953421205b85","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 27b08d64d30e0230db89e6829a8b6a94c9ef7bef
**Base commit:** bc8b2656590f5d55794f3ecfa50872f86c8ce54c
**Base ref:** origin/dev
**Spec hash:** 4d66b6f7812677d1360a49a2110b622b6a3e973e0c973152345f304e51a38642
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-15T02:59:56Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-15T03:01:58Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `bc8b2656590f5d55794f3ecfa50872f86c8ce54c..27b08d64d30e0230db89e6829a8b6a94c9ef7bef` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `git rev-parse HEAD`, `git merge-base origin/dev HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, `git status --porcelain --untracked-files=all`: pass (all preconditions match; only `blueprint/context/review.md` differed)
- `npm run typecheck`: pass
- `npm run lint:web`: pass
- `npm run build:web`: pass (`/` static; `/dashboard`, `/profile`, `/reset-password` partial prerender; `/auth/callback`, `/auth/confirm` dynamic; working tree unchanged afterward)
- `docker exec -i supabase_db_tango psql -U postgres` (read-only schema query, plus a trigger insert inside a rolled-back transaction): pass
- Unit test command: unavailable (none configured)

## Evidence

- Delta is two commits: `1abd151` (archived fix "single name at sign-up and from Google", judged against `blueprint/history/fixes/single-name-at-sign-up-and-from-google.md`) and `27b08d6` (active fix, `await connection()` in `createClient()`).
- Active fix matches its spec: `apps/web/src/lib/supabase/server.ts:13` awaits `connection()` before `cookies()`; comment updated; no new dependency or config.
- Every `createClient()` caller is request-scoped: Server Components inside `<Suspense>` (`dashboard/page.tsx`, `profile/page.tsx`, `reset-password/page.tsx` via `getUserId`), Server Actions (`(auth)/actions.ts`, `profile/actions.ts`), and Route Handlers (`auth/callback/route.ts`, `auth/confirm/route.ts`, which call it only inside the code/token branch). No `"use cache"`, `after()`, `unstable_cache`, or `dynamic = "error"` exists in `apps/web/src`, so none of `connection()`'s throwing branches (Next 16.4.0 `dist/server/request/connection.js`) are reachable. `proxy.ts` builds its own client and does not import `server.ts`.
- Earlier fix: migration backfills before dropping columns, sanitises client-controlled metadata so sign-up cannot fail the check, keeps `security definer`, `search_path = ''` and revoked execute grants; local DB has the migration applied and `profiles` columns are `created_at, id, language, name`; a rolled-back insert with metadata `{"name":"  Alex Doe  ","language":"fr"}` produced name `Alex Doe`, language `fr`. No remaining `first_name`/`last_name`/`firstName`/`lastName` references in web, shared or seed code. Plans, overview and regenerated types agree.

## Findings

- None new. Existing P3 findings re-examined and still open: F-06 (`sign-up-form.tsx:18`), F-07 (`profile-form.tsx:30`), F-08 (`20261015023747_single_profile_name.sql:7`). No P0 or P1 finding is open or fixed.

## Remaining risk

- No unit test command is configured, so no automated tests cover the name validation, sign-up metadata, or migration sanitising.
- Check was not required and was not run: the spec's dev-server verification (no `Date.now()` prerender warning on `/dashboard` and `/profile`, name still shown) remains unobserved by this reviewer.
- `connection()` also excludes the session-dependent content from runtime (partial) prefetch; intended per spec, but its navigation feel was not observed.
- Google sign-up name metadata keys (`name`/`full_name`) were not exercised with a real Google user in this review.

## Try it now

1. Run `npm run dev:web` and sign in at http://localhost:3000.
2. Open `/dashboard`, then `/profile`. There is no `Date.now()` prerender warning in the terminal or the Next.js dev overlay, and your name shows on both pages.
3. Save your name on `/profile`, sign out and sign in again. Everything still works.
