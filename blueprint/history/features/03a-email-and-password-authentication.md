# Feature: Email and password authentication

**From build-plan:** feature 3a
**Build attempt:** 1
**Branch:** feature/email-and-password-authentication
**Status:** verified

## Goal

Parents can create an account on the web app with email and password, confirm
their email, sign in, sign out, reset a forgotten password, and view and edit
their profile (first and last name). Sessions use Supabase Auth cookies,
handled on the server. This feature also sets the web app's Supabase data-access
pattern that later features follow.

Decisions (2026-10-13):

- Sign-in methods are email and password, and Google (3b). Others come later.
- Forgot password is included.
- UI strings are English only for now, kept in one module. Feature 4 translates
  them.
- **Revised during implementation (user, 2026-10-13):**
  - Sign-up asks only for email and password.
  - The profile stores `first_name` and `last_name` (replacing `display_name`),
    added on the profile page after sign-up. The profile page prompts until
    both are saved, and feature 5 will require them before an invite.
  - No language field anywhere in 3a. `language` defaults to `en`, and
    feature 4 adds an EN/FR toggle on the sign-in and sign-up pages.
  - Testing stays on the local stack. Mailpit is the local Supabase stack's
    email inbox.
- The user provides Tailwind Plus component code for the screens.

## Design reference

The user adds Tailwind Plus code (HTML/JSX) for the auth screens under
`design/references/tailwind-plus/auth/` before the first UI step: sign-in,
sign-up, a simple single-field form (forgot password), and a settings/profile
form. Port the markup into React components, keeping Tailwind Plus structure
and classes. Replace placeholder copy, links, and logos with Accordly content.
Colours and branding are the owner's to change later. **If the code is not there
when step 3 starts, stop and ask. Don't invent a design.**

## In scope

- `@supabase/supabase-js` and `@supabase/ssr` in `@accordly/web`.
- Server-side Supabase client (cookies) and `src/proxy.ts`, which refreshes the
  session on each request.
- Local Auth settings in `supabase/config.toml`:
  - email confirmation required
  - site URL `http://localhost:3000`
  - redirect allow-list
  - minimum password length 8
  - confirmation and recovery email templates that link to the app's
    `/auth/confirm` route
- Generated database types in `@accordly/shared`.
- Routes:
  - `/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password`
  - `/auth/confirm` (Route Handler)
  - `/profile`
  - `/`, which redirects
- Sign out from the profile page.
- Resending the confirmation email when a parent tries to sign in unconfirmed.
- Page metadata title "Accordly" (replacing "Create Next App"). Remove the
  starter home page content.
- Docs: web env setup and the type-generation command in `AGENTS.md`. Record
  the data-access pattern in `coding-standards.md` (closes its TODO).

## Out of scope

- Google sign-in (3b). Apple and Facebook (later).
- French UI, a language switcher, bilingual email templates (feature 4).
- Families, invites, family switcher (feature 5). The signed-in home is the
  profile page until then.
- Changing email or password from the profile page. Password changes go
  through forgot password.
- Account deletion (blocked by `on delete restrict` until retention is decided).
- Staging and production Auth settings and deploy (`/release`). Staging keeps
  hosted defaults. Its email sender is Supabase's limited built-in SMTP until
  an email provider is chosen.
- Test runner setup.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`.
Implement all steps and verify each step's Done when before moving on. Then
present one feature-level review packet. There are no checkpoint commits;
`/complete` creates the final feature commit. Before writing Next.js code, read
the relevant guides in `node_modules/next/dist/docs/` (Next 16):

- `02-guides/authentication.md`
- `authentication-with-cache-components`
- `03-api-reference/03-file-conventions/proxy.md`
- the `cookies` and Server Actions references

`cacheComponents: true` is on, so session reads must follow those rules.

## Build steps

- [x] 1. **Branch, Supabase clients, session proxy, Auth config**
  - Create `feature/email-and-password-authentication` from `dev`.
  - `npm install @supabase/supabase-js @supabase/ssr -w @accordly/web`.
  - `apps/web/.env.example` (committed) and `apps/web/.env.local`
    (git-ignored) with `NEXT_PUBLIC_SUPABASE_URL` and
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Use local values from
    `npx supabase@latest status`. No secret or service-role key in the web app.
  - `src/lib/supabase/server.ts`: `createClient()` using `createServerClient`
    with `cookies()`.
  - `src/proxy.ts`: refreshes the session cookie (the `@supabase/ssr` pattern)
    and redirects signed-out requests for `/profile` to `/sign-in`. This is
    an optimistic check; pages still verify on the server.
  - `supabase/config.toml` `[auth]`:
    - `site_url = "http://localhost:3000"`
    - `additional_redirect_urls = ["http://localhost:3000/**"]`
    - `minimum_password_length = 8`
    - `[auth.email] enable_confirmations = true`
    - `[auth.email.template.confirmation]` and `[auth.email.template.recovery]`
      pointing at `supabase/templates/confirmation.html` and
      `supabase/templates/recovery.html`. Their links are
      `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` and
      `...&type=recovery`.
    - Restart the local stack to apply.
  - Generate types:
    `npx supabase@latest gen types typescript --local > packages/shared/src/database.types.ts`,
    exported from `@accordly/shared`.
  - **Done when:** `npm run typecheck`, `npm run lint:web`, and
    `npm run build:web` pass. `npx supabase@latest status` runs after the
    restart. A `curl` to the local Auth settings endpoint shows email
    confirmation on (`mailer_autoconfirm: false`).

- [x] 2. **Auth server logic: actions and confirm route**
  - `src/lib/auth/validation.ts`: small validators for email, password
    (8–72 chars), and first and last name (each 1–100 after trim).
    They return field errors.
  - `src/lib/auth/messages.ts`: every English auth string (labels, errors,
    notices) in one object, ready for feature 4.
  - `src/app/(auth)/actions.ts` (Server Actions):
    - `signUp`: validate, then `auth.signUp({ email, password })`.
    - `signIn`: `signInWithPassword`, then redirect to `/profile`.
    - `resendConfirmation`
    - `requestPasswordReset`: `resetPasswordForEmail`.
    - `updatePassword`: `updateUser({ password })`, then redirect to
      `/profile` with a notice.
    - `signOut`: `auth.signOut()`, then redirect to `/sign-in`.
    - Each returns `{ fieldErrors?, formError?, notice? }` for
      `useActionState`.
  - `src/app/auth/confirm/route.ts`:
    - `GET` reads `token_hash` and `type` (`email` or `recovery`) and calls
      `verifyOtp`.
    - Success redirects to `/profile` (email) or `/reset-password`
      (recovery). Failure redirects to `/sign-in?error=link-invalid`.
    - There is no client-supplied redirect target, so there is no open
      redirect.
  - **Done when:** typecheck, lint, and build pass. Calling the actions is
    proven in step 3's browser checks. The confirm route returns a 307 to
    `/sign-in?error=link-invalid` for a bad token (`curl -I`).

- [x] 3. **Sign-up, sign-in, sign-out, confirmation (UI)**
  - Port the Tailwind Plus sign-up and sign-in components into
    `src/components/auth/` as client form components using `useActionState`.
  - Pages:
    - `src/app/(auth)/sign-up/page.tsx` and `src/app/(auth)/sign-in/page.tsx`.
      Signed-in visitors are redirected to `/profile`.
    - `/` redirects to `/profile` when signed in, or `/sign-in` otherwise.
  - Sign-up:
    - Fields: email and password.
    - On success, show a "check your email" notice. Supabase returns the same
      response for an already-registered email, so the notice is identical and
      doesn't reveal whether an account exists.
  - Sign-in errors:
    - Wrong credentials: one generic message.
    - Unconfirmed email: a message plus a "resend confirmation email" button.
    - Rate limited: "too many attempts".
    - Bad confirmation link (`?error=link-invalid`): a notice.
  - Pending state: the submit button is disabled while submitting.
  - **Done when** (browser, with the user running `npm run dev:web` and
    emails read in Mailpit at http://127.0.0.1:54324):
    1. Sign up, then see the check-email notice. A profile row exists with
       empty names and language `en`.
    2. Signing in before confirming shows the unconfirmed message, and resend
       delivers a second email.
    3. The confirmation link signs the parent in and lands on `/profile`.
    4. Sign out, then sign in with a wrong password shows the generic error,
       and the right password reaches `/profile`.
    5. Signed out, `/profile` redirects to `/sign-in`.
    6. Every field shows labelled, associated errors for invalid input.

- [x] 4. **Forgot and reset password**
  - Port the single-field form for `src/app/(auth)/forgot-password/page.tsx`
    and a new-password form for `src/app/(auth)/reset-password/page.tsx`.
    `/reset-password` requires a session, which the recovery link creates;
    without one it redirects to `/forgot-password`. Add a "Forgot password?"
    link on sign-in.
  - Forgot password always shows "if an account exists, we've sent a link",
    which doesn't reveal accounts.
  - **Done when** (browser + Mailpit):
    1. Request a reset, then open the email link. It lands on
       `/reset-password`.
    2. Set a new password, then land on `/profile` with a notice.
    3. The old password fails and the new one works.
    4. A password shorter than 8 is rejected with a field error.
    5. Opening the used link again shows the invalid-link notice.

- [x] 5. **Profile page and docs**
  - Port the settings form for `src/app/profile/page.tsx`:
    - email (read-only), first name, and last name, saved by an
      `updateProfile` action
    - a "complete your profile" prompt while either name is empty
    - a sign-out button
  - `updateProfile`:
    - Validates, then runs `.from('profiles').update({ first_name, last_name })`
      on the signed-in user's own row. The id comes from the verified session
      claims, never from the form. RLS also enforces it.
    - Shows a saved notice, or field errors.
  - Docs:
    - `AGENTS.md` Commands: web env setup (copy `.env.example`, fill from
      `supabase status`) and the type-generation command.
    - `coding-standards.md`: replace the data-access TODO with the pattern
      used here (server client per request, Server Actions for mutations, ids
      from session claims, typed by `@accordly/shared` database types,
      hand-written validators until a library is needed).
  - **Done when** (browser):
    1. A new parent sees the prompt. They add a first and last name, save,
       and reload; the values persist, the prompt is gone, and the DB row
       matches.
    2. A blank name shows a field error and nothing is saved.
    3. Sign out returns to `/sign-in`, and `/profile` then redirects.

## Files / areas

- `apps/web/package.json`, root `package-lock.json`
- `apps/web/.env.example` (new), `apps/web/.env.local` (new, ignored)
- `apps/web/src/proxy.ts` (new)
- `apps/web/src/lib/supabase/server.ts` (new)
- `apps/web/src/lib/auth/validation.ts`, `messages.ts` (new)
- `apps/web/src/app/(auth)/actions.ts`, `sign-up/`, `sign-in/`,
  `forgot-password/`, `reset-password/` (new)
- `apps/web/src/app/auth/confirm/route.ts` (new)
- `apps/web/src/app/profile/page.tsx` (new)
- `apps/web/src/app/page.tsx` (replaced by a redirect), `layout.tsx`
  (metadata)
- `apps/web/src/components/auth/*` (new)
- `supabase/config.toml`, `supabase/templates/confirmation.html`,
  `recovery.html` (new)
- `packages/shared/src/database.types.ts` (new), `src/index.ts`
- `AGENTS.md`, `blueprint/context/coding-standards.md`
- `design/references/tailwind-plus/auth/` (user-provided)

## Data / contracts

- Migration `20261013164832_profile_names.sql`:
  - Adds nullable `first_name` and `last_name` (each 1–100 after trim when
    set) and drops `display_name`.
  - Grants `update (first_name, last_name)` to `authenticated`, alongside the
    existing `language` grant.
  - The sign-up trigger now inserts only `id` and `language` (from metadata
    when it is valid, otherwise `en`).
  - It must be pushed to staging after approval, since feature 2's migrations
    are already there.
- Actor: always the verified session (`auth.getClaims()` / `getUser()` on the
  server). The client never sends a user id.
- Validation, the same on every path:
  - email: trimmed, basic format
  - password: 8–72 characters (bcrypt limit)
  - first and last name: each 1–100 after trim, both required when saving
    the profile

  Server Actions re-validate everything. The browser `required` attributes are
  only a convenience.
- Action result: `{ fieldErrors?: Partial<Record<field, string>>, formError?: string, notice?: string }`.
  The UI shows field errors next to the field (`aria-describedby`,
  `aria-invalid`), the form error and notice in an `aria-live="polite"`
  region, and moves focus to the first invalid field.
- Error mapping. Never show raw Supabase messages.

  | Supabase error | Message shown |
  |---|---|
  | `invalid_credentials` | generic "email or password is incorrect" |
  | `email_not_confirmed` | unconfirmed message + resend |
  | `over_request_rate_limit`, `over_email_send_rate_limit` | too many attempts |
  | `weak_password` | password field error |
  | anything else | "something went wrong, try again" (also logged on the server) |

- Display names are user text and are rendered through React (escaped). Never
  use `dangerouslySetInnerHTML`.
- Routes are public except `/profile` and `/reset-password`. Route paths have
  no locale prefix. Feature 4 decides how language applies (the profile
  preference, not a URL segment, unless it decides otherwise).

## Testing

No test command is configured, so unit tests are not a gate. Evidence:

- `npm run typecheck`, `npm run lint:web`, `npm run build:web`
- `curl` checks for the confirm route and Auth settings
- Browser checks from each Done when, with the user starting `npm run dev:web`.
  Use emails from Mailpit, and check DB state with `psql` in the local DB
  container.

Record the evidence in the review packet. Don't claim browser results that
weren't observed.

## Notes for the AI

- Next 16: follow the bundled docs, not memory. `middleware.ts` is now
  `proxy.ts`. With `cacheComponents`, reading `cookies()` makes that part
  dynamic, so wrap session-dependent UI in `<Suspense>` as the docs show.
- Use `@supabase/ssr`'s documented cookie adapter (`getAll`/`setAll`). In the
  proxy, return the response that carries the refreshed cookies.
- The publishable key is public by design. RLS protects the data.
- Names are never derived from the email address.
- `apps/web/AGENTS.md` is regenerated by `next dev`. Commit it if it changes.
- This feature touches auth and sessions, so independent review is expected
  before `/complete` (`when-sensitive`). The review base is `origin/dev`.

## Open questions

Non-blocking. The spec uses the stated answer unless the user changes it.

1. **Minimum password length 8** (Supabase recommends 8 or more). No
   character-class rules, following current NIST guidance.
2. **`/` redirect target** is `/profile` until feature 5 adds a family home.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":15645,"specSha256":"d5520a8d0a477d8c8d6e963727470986e3cfd455fa8ad4d2a356db8322c17feb","branch":"refs/heads/feature/email-and-password-authentication","head":"5f849496c474b6d83a9bb28401e33ef84c421a89","baseRef":"refs/heads/dev","baseCommit":"7d41843e0058dc7f2ca36f143ad998475300ad98","sourceTree":"1a0ea737676a2864ab8879eb8b821c0fe49e6595","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 5f849496c474b6d83a9bb28401e33ef84c421a89
**Base commit:** 7d41843e0058dc7f2ca36f143ad998475300ad98
**Base ref:** origin/dev
**Spec hash:** d5520a8d0a477d8c8d6e963727470986e3cfd455fa8ad4d2a356db8322c17feb
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-10-13T16:59:42Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-13T17:04:30Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `7d41843e0058dc7f2ca36f143ad998475300ad98..5f849496c474b6d83a9bb28401e33ef84c421a89` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `npm run typecheck`: pass
- `npm run lint:web`: pass
- `npm run build:web`: pass
- `npx supabase@latest db lint` (local): pass, no schema errors
- `curl -I` probes of `/auth/confirm` (bad token, unsupported type, missing token): pass, each 307 to `/sign-in?error=link-invalid`
- `curl` signed-out `/profile`, `/reset-password`, `/`: pass, 307 to `/sign-in`, `/forgot-password`, `/profile` (then `/sign-in`)
- `curl` local Auth settings: pass, `mailer_autoconfirm: false`
- `psql` read-only grant and policy queries on local `public.profiles`: pass

### Evidence

- Preflight: HEAD, `origin/dev` merge base, and spec SHA-256 match the request; the spec is tracked; the only dirty path was `blueprint/context/review.md`.
- Actor: every action and page takes the user id from `auth.getClaims()`. No form or URL input supplies an id. RLS update policy `id = auth.uid()` plus column grants `update (first_name, last_name, language)` only (local DB).
- Redirects: all targets are fixed (`DESTINATIONS`, `SIGNED_IN_ONLY`, literal `redirect()` paths). There is no client-supplied redirect target, so no open redirect.
- Enumeration: sign-up and forgot-password return the same notice regardless of account existence; sign-in maps `invalid_credentials` to one generic message.
- Errors: Supabase messages are never rendered. Unexpected errors are logged with code and message only, with no passwords or tokens.
- Migration `20261013164832_profile_names.sql`: the `display_name` grant goes with the dropped column; `handle_new_user` keeps `security definer`, an empty `search_path`, and revoked execute; the generated types match.
- Local JWKS is ES256, so `getClaims()` verifies locally without an Auth round trip per request.
- Forms: labels are associated, and `aria-invalid` / `aria-describedby` are set, with focus moved to the first invalid field and pending buttons disabled.

### Findings

- F-03 [P3] open: profile notice lookup accepts Object.prototype keys
- F-04 [P3] open: proxy redirects drop refreshed session cookies
- F-05 [P3] open: any signed-in session can set a new password without reauthentication (user decision)
- F-06 [P3] open: success notices replace the form, so announcement and focus are unreliable
- F-07 [P3] open: complete-profile prompt reappears after a later failed save
- Carried, re-confirmed, unchanged: F-01 [P3] open (`authenticated` still holds TRUNCATE/TRIGGER/REFERENCES on `profiles` locally); F-02 [P3] unverified

### Remaining risk

- No test command is configured, so validators, error mapping, and actions have no automated tests.
- Check was not required and was not run. The browser flows (sign-up, confirm, sign-in, reset, profile) and Mailpit delivery were not exercised by this reviewer, and no authenticated request was made.
- F-03 is confirmed from the code path (plain-object lookup and React serialization rules), not from a signed-in reproduction.
- Password length is counted in UTF-16 units while bcrypt's limit is 72 bytes. A multibyte password near 72 characters may hit an unmapped Auth error that shows the generic message (unverified).
- `getClaims()` does not detect a server-side revoked session until the access token expires (up to 1 hour), which is the accepted spec pattern.
- Staging and production Auth settings, and the pending staging push of this migration, were not reviewed (out of scope; no remote access).
