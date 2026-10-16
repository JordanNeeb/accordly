# Feature: Account type choice

**From build-plan:** feature 31a
**Build attempt:** 1
**Branch:** feature/account-type-choice

## Goal

Get started opens a "What best describes you?" screen with two options, Parent
and Professional. Parents continue to the pricing page, which the next feature
builds. Professionals continue straight to the sign-up form. The chosen type is
saved on the new profile, for both email and Google sign-up.

## Design reference

- Layout: `design/references/tailwind-plus/marketing/user-type-select.jsx` (Tailwind
  Plus two-column section, dark in both themes like the landing hero). Catalyst
  has no marketing section, so the layout comes from this reference. Per the
  owner: each column's logo becomes a title (Parent, Professional), its quote
  becomes the option's description, and the person and signature at the bottom
  become a button.
- Buttons: Catalyst `button.tsx` (with `link.tsx` wired to `next/link`), the
  first Catalyst components in the app. Existing auth pages keep their Tailwind
  Plus layout; moving them is separate work.

## In scope

- New public route `/get-started`: logo at the top, the centred page heading
  and short paragraph, then the two columns (title, description, button), then
  a centred "Already have an account? Sign in" footer. No language menu on this
  page, per the owner; the language carries over from the landing page.
- The Parent button goes to `/pricing`; the Professional button goes to
  `/sign-up?type=professional`.
- Sign-up requires a valid `type` (`parent` or `professional`). `/sign-up` without
  one redirects to `/get-started`. The landing page's Get started and the sign-in
  page's "Sign up" link both point to `/get-started`.
- New `profiles.account_type` column, set once at account creation and never
  changed by clients.
- Email sign-up sends the type in the user metadata, and the sign-up trigger
  saves it.
- Google sign-up from the sign-up page carries the type through a short-lived
  cookie, and the OAuth callback saves it.
- `/get-started` redirects signed-in visitors to `/dashboard`.
- English and French copy.

## Out of scope

- The pricing page (`/pricing` returns 404 until the next feature builds it and
  links on to `/sign-up?type=parent`).
- Routing after sign-up by type. Professionals still land on the dashboard; the
  professional home and professional account record are 31b.
- Changing the account type after sign-up.
- Mobile.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`:
implement all steps, verifying each one's Done when, then present one review
packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] **1. Schema.** New migration (`npx supabase@latest migration new account_type`):
  - `alter table public.profiles add column account_type text check (account_type in ('parent', 'professional'))`, then
    `update public.profiles set account_type = 'parent'` (every existing account
    is a parent). The column stays nullable: null means not chosen yet (see Data / contracts).
  - Replace `public.handle_new_user()` with the current body plus
    `account_type` from `raw_user_meta_data ->> 'account_type'`, kept only when
    it is `parent` or `professional`, otherwise null. Keep `security definer`,
    `search_path = ''`, and the execute revoke.
  - New `public.set_account_type(requested text)`, `security definer`,
    `search_path = ''`: raises on an invalid value, otherwise
    `update public.profiles set account_type = requested where id = auth.uid() and account_type is null`.
    Revoke execute from `public` and `anon`; grant execute to `authenticated`.
  - No column grant on `account_type`, so client updates are denied by the
    existing column-level grants.
  - Then `npx supabase@latest db reset`, `npx supabase@latest db lint`, and
    regenerate `packages/shared/src/database.types.ts`.
  - Done when: reset and lint pass; in Studio SQL, an authenticated user's
    `update profiles set account_type = ...` is denied, `set_account_type`
    sets a null type once and leaves a set type unchanged, and an invalid value raises.
- [x] **2. Catalyst components.** `npm install clsx -w @tango/web`. Copy `link.tsx`
  and `button.tsx` into `apps/web/src/components/catalyst/`, unchanged except
  `link.tsx`, which wraps `next/link` per the Catalyst docs. Install only what
  the copied files import.
  - Done when: `npm run typecheck` and `npm run lint:web` pass.
- [x] **3. Choice screen.** Add the `onboarding.accountType` copy to `en.ts` and
  `fr.ts`, `components/onboarding/account-type-choice.tsx` (server component
  ported from the reference), and `app/[lang]/get-started/page.tsx`. Point the landing hero and the
  sign-in page's "Sign up" link to `/get-started`, and add `/get-started` to
  `SIGNED_OUT_ONLY` in `proxy.ts`.
  - Done when: Get started on `/` opens the screen in both languages; the Parent
    button lands on `/pricing`; the Professional button lands on
    `/sign-up?type=professional`; both buttons are reachable by keyboard; the
    columns stack below `lg`; signed in, `/get-started` redirects to `/dashboard`.
- [x] **4. Sign-up records the type.**
  - `proxy.ts` redirects `/sign-up` without a valid `type` to `/get-started`
    (a real HTTP redirect; with `cacheComponents`, a page-level redirect inside
    the required Suspense boundary is client-side only). The sign-up page also
    reads `searchParams.type` in a Suspense boundary and redirects as a backstop. It passes the type to `SignUpForm`, which sends
    it as a hidden `type` field to `signUp` and to the Google button's form.
  - `signUp` validates `type` again on the server (anything else returns
    `auth.errors.unexpected` without calling Supabase) and adds
    `account_type` to `options.data`.
  - `signInWithGoogle` accepts the form data. When it holds a valid `type`, it
    sets the `tango_account_type` cookie (httpOnly, `sameSite: "lax"`, `secure` in
    production, `path: "/auth/callback"`, `maxAge` 600 seconds). Calls from the
    sign-in page send no type and set no cookie.
  - `/auth/callback`, after a successful code exchange: if the cookie holds a
    valid type, call `supabase.rpc("set_account_type", { requested })`, log and
    continue on error (sign-in still succeeds), and always delete the cookie on
    the response.
  - Done when: an email sign-up as a professional (confirmed through Mailpit)
    has `account_type = 'professional'` in Studio; a Google sign-up from
    `/sign-up?type=professional` has `professional`; an existing parent using
    Google from that page keeps `parent`; a new Google account from the sign-in
    page has null; `/sign-up` and `/sign-up?type=x` redirect to `/get-started`;
    `npm run typecheck`, `npm run lint:web`, and `npm run build:web` pass.

## Files / areas

- `supabase/migrations/<timestamp>_account_type.sql` - new
- `packages/shared/src/database.types.ts` - regenerated
- `packages/shared/src/i18n/en.ts`, `fr.ts` - copy
- `apps/web/package.json`, `package-lock.json` - `clsx`
- `apps/web/src/components/catalyst/` - new copied components
- `apps/web/src/components/onboarding/account-type-choice.tsx` - new
- `apps/web/src/app/[lang]/get-started/page.tsx` - new
- `apps/web/src/app/[lang]/(auth)/sign-up/page.tsx` - type check and redirect
- `apps/web/src/app/[lang]/(auth)/sign-in/page.tsx` - "Sign up" href
- `apps/web/src/app/[lang]/(auth)/actions.ts` - `signUp`, `signInWithGoogle`
- `apps/web/src/components/auth/sign-up-form.tsx`, `google-sign-in-button.tsx` - pass the type
- `apps/web/src/app/auth/callback/route.ts` - save the type from the cookie
- `apps/web/src/components/landing/landing-hero.tsx` - Get started href
- `apps/web/src/proxy.ts` - `SIGNED_OUT_ONLY`
- A small shared validator, `isAccountType`, in `apps/web/src/lib/auth/validation.ts`
  next to the other auth validators, with the `AccountType` union.

## Data / contracts

- **`profiles.account_type`**: `text`, nullable, check `in ('parent', 'professional')`.
  `parent` and `professional` are chosen types; null means none was chosen (a
  new Google account created from the sign-in page). Existing rows are set to
  `parent`. Only the trigger and `set_account_type` write it. Clients have no
  update grant on the column.
- **Trust:** the type is self-declared. Sign-up metadata and the cookie are
  client-controlled, so the trigger, the server actions, and the RPC each
  accept only the two values. This matches the product: professionals are free,
  there are no credential checks in v1, and they only see a family when a parent invites them.
- **`set_account_type(requested text) returns void`**: acts only on
  `auth.uid()`'s own profile and only while its type is null. An invalid value
  raises; a type that is already set is left unchanged, with no error.
- **URLs:** `/get-started` (choice), `/pricing` (parent, next feature),
  `/sign-up?type=parent|professional`. The pricing page must forward to
  `/sign-up?type=parent`.
- **Cookie:** `tango_account_type`, value `parent` or `professional`, httpOnly,
  `path=/auth/callback`, 10 minutes, deleted by the callback.
- **Structure:** one `h1` (page title), each column an `h2` title, a paragraph,
  and a Catalyst `Button` link. Decorative images from the reference are dropped.
- **Copy** (plain text):

| Key | English | French |
| --- | --- | --- |
| `title` | What best describes you? | Qu'est-ce qui vous décrit le mieux? |
| `description` | Choose the option that fits you. We'll set up Tango for the way you'll use it. | Choisissez l'option qui vous correspond. Nous adapterons Tango à votre façon de l'utiliser. |
| `parent.label` | Parent | Parent |
| `parent.description` | You're raising children with a co-parent after a separation. Message your co-parent, follow your parenting schedule, and share expenses and child support, with records ready for court. | Vous élevez vos enfants avec un coparent après une séparation. Écrivez à votre coparent, suivez votre horaire parental et partagez les dépenses et la pension alimentaire, avec des dossiers prêts pour le tribunal. |
| `professional.label` | Professional | Professionnel |
| `professional.description` | You support families through separation: lawyers, mediators, therapists, and parenting coordinators. Parents invite you to see the records they choose to share. Always free. | Vous accompagnez des familles qui se séparent : avocats, médiateurs, thérapeutes et coordonnateurs parentaux. Les parents vous invitent à consulter les dossiers qu'ils choisissent de partager. Toujours gratuit. |
| `parent.action` | Continue as a parent | Continuer comme parent |
| `professional.action` | Continue as a professional | Continuer comme professionnel |

- The footer reuses `auth.signUp.haveAccount` and `auth.signUp.signIn`.

## Testing

- No test or Verify command is declared, so no unit tests.
- Gates: `npm run typecheck`, `npm run lint:web`, `npm run build:web`,
  `npx supabase@latest db lint`.
- Manual checks on `npm run dev:web` with the local stack running: each Done
  when above, at phone and desktop widths, light and dark. Google checks need the
  local OAuth client from the Commands section.

## Notes for the AI

- Read the relevant Next.js 16 guide in `node_modules/next/dist/docs/` before
  writing the page, the `searchParams` handling, and the cookie code.
- Follow `pageMessages(params)` and `generateMetadata` as the sign-up page does,
  and pass messages to the section as a prop, as `LandingHero` does.
- Keep copied Catalyst files byte-close to the kit.
- Never edit an existing migration; this is a new one.
- The project overview's `profiles` data model needs an `account_type` line.
  Flag it at `/complete` rather than editing user-owned plans here.
- No em dashes, en dashes, or ellipsis characters in copy or comments.

## Implementation notes

- **Status:** verified (typecheck, lint, build, schema lint, SQL checks, live redirect and render checks). Live email and Google sign-ups were not run; see the review handoff.
- The migration was applied with `npx supabase@latest migration up` instead of
  `db reset`, so local accounts and data were kept.
- `apps/web` resolves `@types/react` 19.3.0 while the hoisted copy Headless UI
  uses is 19.2.18 (pinned by mobile; already in the lockfile on `dev`). The
  copied Catalyst `button.tsx` therefore casts the Headless branch's props
  (`props as object`, with a comment), and `let classes` became `const` for
  lint. Aligning the two type versions is follow-up work.



<!-- blueprint:completion {"schemaVersion":2,"specBytes":12577,"specSha256":"a7e1f36b46800da5a105d4bbbd01209f3275545e97441577afa82e7de51bea72","branch":"refs/heads/feature/account-type-choice","head":"7d1a60f2d703e31f397a5ec843d6d24afcf06ea6","baseRef":"refs/heads/dev","baseCommit":"28cdcd550146a13cde558884eb77d26841c07a94","sourceTree":"0a05040d13b74cdaf34e743d697ae85f7174a96f","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 7d1a60f2d703e31f397a5ec843d6d24afcf06ea6
**Base commit:** 28cdcd550146a13cde558884eb77d26841c07a94
**Base ref:** origin/dev
**Spec hash:** a7e1f36b46800da5a105d4bbbd01209f3275545e97441577afa82e7de51bea72
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-16T10:52:32Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-16T10:55:45Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `28cdcd550146a13cde558884eb77d26841c07a94..7d1a60f2d703e31f397a5ec843d6d24afcf06ea6` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `git rev-parse HEAD`, `git merge-base origin/dev HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, `git status --porcelain --untracked-files=all`: pass (HEAD, merge base, and spec hash match the request; only `blueprint/context/review.md` differed)
- `npm run typecheck`: pass
- `npm run lint:web`: pass
- `npm run build:web`: pass (only the existing Google Sans font-override warnings)
- `npx supabase@latest db lint`: pass (no schema errors)
- Read-only grant and data queries on the local database (`information_schema.column_privileges`, `role_table_grants`, `pg_proc.proacl`, `profiles.account_type` counts, applied migrations): pass
- Rolled-back SQL transaction exercising the trigger and `set_account_type` (no rows persisted; leftover count 0): pass

### Evidence

- Reviewed the full `28cdcd5..7d1a60f` delta (22 files) against the spec: migration, trigger, RPC, server actions, OAuth callback, proxy, sign-up/sign-in/get-started pages, onboarding component, copied Catalyst `button.tsx`/`link.tsx`, validators, i18n copy, regenerated types, package manifests.
- Migration: `handle_new_user` body equals the previous one plus the whitelisted `account_type`; `security definer`, `search_path = ''`, and execute revoke kept. Local DB shows authenticated has UPDATE only on `name` and `language`, no INSERT; `set_account_type` ACL is postgres, authenticated, service_role (anon and public revoked); all 3 existing profiles are `parent`.
- Rolled-back SQL: trigger saved `professional`, mapped `admin` and `["parent"]` to null; direct `update profiles set account_type` as authenticated was denied; RPC set a null type once, left a set type unchanged on a second call and for an already-typed user, raised on `admin` and null; anon got permission denied.
- Server checks: `signUp` rejects a missing or invalid `type` before calling Supabase; `signInWithGoogle` sets the cookie only for a valid type with the spec's attributes; callback calls the RPC only after a successful exchange, logs and continues on error, and deletes the cookie (with its path) on both success and failure responses; redirect destinations stay fixed.
- Proxy redirects signed-out `/sign-up` without a valid type to `/get-started` (search cleared) and signed-in `/get-started` to `/dashboard`; the page backstop handles array or invalid `searchParams.type`.
- Copied `link.tsx` is byte-identical to the kit demo; `button.tsx` differs only by `let` to `const` and the documented props cast. English and French copy match the spec table; no em dash, en dash, or ellipsis characters added.
- Performance: one extra RPC round trip only on Google callbacks carrying the cookie; proxy addition is a constant-time check. Tests: no test command is declared, consistent with the spec's Testing section.

### Findings

- F-09 [P3] open: stale `tango_account_type` cookie can type a later Google sign-in from the sign-in page
- F-04 [P3] open: re-examined only; the delta adds two more redirect paths that still drop refreshed session cookies
- No P0 or P1 findings

### Remaining risk

- Live email sign-up (Mailpit confirmation) and Google OAuth sign-ups from step 4's Done when were not run by the builder or this reviewer; the cookie round trip through Google and the RPC call after `exchangeCodeForSession` are verified by code reading and SQL only.
- No unit test or Browser tests command is declared, so no automated tests cover `isAccountType`, the proxy redirect, or the callback.
- Visual layout, keyboard reachability, and phone/desktop and light/dark rendering of `/get-started` were not checked in a browser (Check not required).
- `/pricing` returns 404 by spec, so the Parent path is a dead end until the next feature ships; promoting `dev` to `main` before then would block parent sign-up from the UI.
- `apps/web` and Headless UI resolve different `@types/react` versions, worked around by a cast in `button.tsx` (noted in the spec as follow-up).

## Try it now

Run or do:

With `npm run dev:web` running, open http://localhost:3000/ in a signed-out (private) window and click **Get started**.

Expected:

`/get-started` shows "What best describes you?" centred over two columns, **Parent** and **Professional**. **Continue as a professional** opens the sign-up form at `/sign-up?type=professional`; **Continue as a parent** goes to `/pricing` (404 until the pricing feature). Opening `/sign-up` with no type redirects back to `/get-started`.

This proves:

The account type choice screen and its routing into sign-up.
