# Feature: Google sign-in

**From build-plan:** feature 3b
**Build attempt:** 1
**Branch:** feature/google-sign-in
**Status:** verified

## Goal

Parents can sign up and sign in on the web app with Google. A Google sign-in
whose verified email matches an existing Accordly account lands in that same
account and profile, not a second one. This uses Supabase Auth's Google
provider with the server-side PKCE flow and the cookie session from 3a.

## In scope

- Local Google provider in `supabase/config.toml`, with the client ID and
  secret read from a git-ignored env file. A committed example file documents
  both values.
- A "Continue with Google" button on `/sign-in` and `/sign-up`. It uses the
  Tailwind Plus "Or continue with" social-button markup.
- A Server Action that starts the Google OAuth flow and redirects to Google.
- An `/auth/callback` Route Handler that exchanges the code for a session and
  redirects to `/profile`. On failure it redirects to `/sign-in` with a known
  error code.
- Account linking through Supabase's automatic linking by verified email. One
  `auth.users` row means one `profiles` row. The existing `handle_new_user`
  trigger already gives a new Google user a profile.
- English strings in `AuthMessages`, ready for feature 4.
- Docs: Google OAuth local setup in the Commands section of `AGENTS.md`.

## Out of scope

- Apple, Facebook, and other providers (later).
- Manual identity linking, such as linking Google to an account with a
  different email. `enable_manual_linking` stays `false`. There is no
  "connected accounts" UI.
- Prefilling first and last name from Google. Names are still added on the
  profile page, as in 3a. The profile prompt is unchanged.
- Adding or changing a password for a Google-only account. The existing
  forgot-password flow is not changed. Its behaviour for Google-only users is
  only observed and recorded.
- The Google One Tap / ID-token flow and a client-side Supabase client.
- Staging and production Google credentials, the OAuth consent-screen
  publishing, and deploy (`/release`).
- French UI (feature 4) and mobile Google sign-in (feature 19).
- Test runner setup.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`.
Implement all steps and verify each step's Done when before moving on. Then
present one feature-level review packet. There are no checkpoint commits.
`/complete` creates the final feature commit. Before writing Next.js code, read
the Route Handler, `cookies`, `headers`, and Server Actions references in
`node_modules/next/dist/docs/` (Next 16, `cacheComponents: true`).

This feature changes authentication and session handling, so the configured
`independentReview: "when-sensitive"` gate applies.

## Build steps

- [x] 1. **Branch and local Google provider config**
  - Create `feature/google-sign-in` from `dev`.
  - **User prerequisite:** a Google Cloud OAuth client of type "Web
    application", with the local Supabase callback as an authorized redirect
    URI. Check the exact URI that the local stack uses. It is expected to be
    `http://127.0.0.1:54321/auth/v1/callback`. The consent screen stays in
    testing mode with the user's own test accounts. If the client is not ready,
    build steps 2 and 3 anyway. Hold the live checks in step 3 until it exists.
  - `supabase/config.toml`: add `[auth.external.google]` with `enabled = true`,
    `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`,
    `secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"`,
    `skip_nonce_check = false`. Leave `redirect_uri` empty so the default is
    used. Keep `enable_manual_linking = false`.
  - Check which `.env` file the Supabase CLI reads for `env()` values (expected
    `supabase/.env`). Add that file to `.gitignore` and commit an example with
    empty values next to it. No real secret is committed.
  - Restart the local stack to apply.
  - **Done when:** `git check-ignore` confirms the real env file is ignored.
    `npx supabase@latest status` runs after the restart. A `curl` to the local
    Auth settings endpoint (`/auth/v1/settings`) shows `external.google: true`.
    `npm run typecheck` passes.

- [x] 2. **Server logic: start action and callback route**
  - `src/lib/auth/messages.ts`: add a `google` group ("Or continue with",
    "Continue with Google", a pending label) and `errors.googleFailed`
    ("Google sign-in didn't complete. Try again.").
  - `src/app/(auth)/actions.ts`: add `signInWithGoogle`.
    - It builds `redirectTo` from the request's `origin` header (via
      `headers()`) plus the fixed path `/auth/callback`. Nothing from form data
      or the query string goes into it. Supabase's
      `additional_redirect_urls` allow-list still applies.
    - It calls `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })`.
      PKCE is the `@supabase/ssr` default. The code verifier cookie is set by
      the action.
    - On success it calls `redirect(data.url)`. On error it logs through the
      existing `unexpected()` helper and returns
      `{ formError: errors.googleFailed }`.
  - `src/app/auth/callback/route.ts`: `GET` reads `code`.
    - With a code, it calls `exchangeCodeForSession(code)`. Success redirects
      to `/profile`. The destination is fixed and never read from the URL.
    - A missing code, a provider `error` param (for example the user cancelled
      at Google), or a failed exchange redirects to
      `/sign-in?error=google-failed`. It logs only the error code, never tokens.
  - **Done when:** typecheck, lint, and build pass.
    `curl -i "http://localhost:3000/auth/callback"` and
    `...?error=access_denied` and `...?code=bogus` each return a redirect to
    `/sign-in?error=google-failed`.

- [x] 3. **UI: Google button on sign-in and sign-up, error notice**
  - **Built, live checks deferred (user, 2026-10-13).** The browser checks
    below were not run. See the Manual browser checklist under Testing.
  - `src/components/auth/google-sign-in-button.tsx` (client): a small form
    whose action is `signInWithGoogle` through `useActionState`. Port the
    divider and Google button markup from
    `design/references/tailwind-plus/auth/sign-in.jsx`. Use one full-width
    button instead of the two-column grid, and keep the Google SVG
    (`aria-hidden`). Use a `<button type="submit">`, not an `<a>`. While
    pending, the button is disabled with the pending label. `formError` shows
    through the existing `FormAlert`.
  - Render it below the email form on `/sign-in` (in `SignInForm`'s container)
    and on `/sign-up` (hidden once the check-email notice shows, matching the
    form).
  - `/sign-in` `LinkNotice`: also map `error=google-failed` to
    `errors.googleFailed`. Only known codes map to text.
  - **Done when** (browser, with the user running `npm run dev:web` and the
    Google client configured):
    1. A new Google account: "Continue with Google" → Google consent →
       `/profile` with the add-your-name prompt. One new `auth.users` row with
       a `google` identity and one `profiles` row.
    2. A confirmed email/password account using the same Gmail address: Google
       sign-in lands on the same user id. The profile names are unchanged.
       `auth.identities` shows both `email` and `google`. Password sign-in
       still works afterwards.
    3. An unconfirmed email/password account with the same address, then
       Google sign-in: still exactly one user and one profile. Record what
       Supabase did to the unconfirmed password identity.
    4. A Google-only account then submitting email sign-up with the same
       address: the same generic check-email notice, and no second user.
       Record what forgot-password does for that account.
    5. Cancelling at Google returns to `/sign-in` with the Google error
       message.
    6. Sign out from `/profile`, then sign in again with Google → same user.
    7. Keyboard: the button is reachable and activates with Enter or Space.
       Its pending state is visible.
    8. Typecheck, lint, and build pass.

- [x] 4. **Docs**
  - `AGENTS.md` Commands (Backend): the Google OAuth local setup (Google Cloud
    client, redirect URI, which env file, and restarting the stack).
  - **Done when:** the docs match what was set up. Typecheck, lint, and build
    pass.

## Files / areas

- `supabase/config.toml` (`[auth.external.google]`)
- `.gitignore`, and the Supabase env example (expected `supabase/.env.example`)
- `apps/web/src/app/(auth)/actions.ts`
- `apps/web/src/app/auth/callback/route.ts` (new)
- `apps/web/src/components/auth/google-sign-in-button.tsx` (new)
- `apps/web/src/components/auth/sign-in-form.tsx` and
  `apps/web/src/components/auth/sign-up-form.tsx`, or their pages
- `apps/web/src/app/(auth)/sign-in/page.tsx` (`LinkNotice`)
- `apps/web/src/lib/auth/messages.ts`
- `AGENTS.md`

## Data / contracts

- No migration. `profiles` is unchanged. `handle_new_user` fires only when an
  `auth.users` row is inserted, so a Google identity linked to an existing
  user creates no extra profile. A new Google user's profile gets `language`
  `en` and null names, as in 3a.
- Identity linking is Supabase's automatic linking by verified email. Manual
  linking stays off.
- `/auth/callback`: input `code` (or a provider `error`). The output is always
  a redirect, either to `/profile` or to `/sign-in?error=google-failed`. The
  URL never sets the destination.
- `signInWithGoogle` returns the existing `ActionResult` shape
  (`{ formError? }`), or it redirects.
- Secrets: the Google client secret lives only in the git-ignored Supabase env
  file that the local Auth server reads. The web app gets no new env vars and
  never sees the secret.

## Testing

No test command is configured, so there are no unit tests. Evidence is
typecheck, lint, build, `curl` against the callback route and Auth settings,
and the browser checks in step 3, which need a real Google OAuth client and
test accounts. Database checks query `auth.users`, `auth.identities`, and
`public.profiles` in Studio or `psql` on the local stack.

### Manual browser checklist (step 3)

Status: **deferred by the user on 2026-10-13. Not run.** The feature was
completed on automated evidence only: typecheck, lint, build, `curl` of
`/auth/callback` (no code, provider error, bad code, each redirecting to
`/sign-in?error=google-failed`), the rendered button and error notice, and the
local Auth server sending sign-ins to Google with the configured client ID.
Nothing below is proven. That includes a real Google sign-in, linking to the
same profile, and keyboard behaviour.

To run them later: run them at http://localhost:3000 while signed out (a
private window is easiest), with the Google client in `supabase/.env`. Ask an
agent to check `auth.users`, `auth.identities`, and `public.profiles` after
each one. If C shows a second user for the same email, that breaks this
feature's "same profile" contract and needs a `/fix`.

Your Gmail address already has an unconfirmed email/password account in the
local database, so start with A. Every Google account you use must be a test
user on the OAuth consent screen.

- [ ] **A. Unconfirmed account (check 3).** On `/sign-in`, click **Continue
  with Google** and pick your Gmail account. Expect `/profile` with the
  add-your-name prompt.
- [ ] **B. New Google user (check 1).** Sign out. Use **Continue with Google**
  with a different Google account that has never been used here. Expect
  `/profile` with the add-your-name prompt.
- [ ] **C. Existing confirmed account (check 2).** This needs a Google account
  with no local Accordly account. Sign up on `/sign-up` with that Gmail address
  and a password. Confirm it in Mailpit (http://127.0.0.1:54324) and add a name
  on `/profile`. Sign out, then use **Continue with Google** with that account.
  Expect the same profile with its name kept. Then sign out and sign in with
  the password, which should still work. If you only have two Google test
  accounts, tell the agent and the order will be adjusted.
- [ ] **D. Email sign-up for a Google-only user (check 4).** Sign out. On
  `/sign-up`, enter the Gmail address from B with any password. Expect the
  usual "Check your email" notice. Also try `/forgot-password` with that
  address and note what happens.
- [ ] **E. Cancel at Google (check 5).** Click **Continue with Google**, then
  cancel or go back on Google's screen. Expect `/sign-in` with "Google sign-in
  didn't complete. Try again."
- [ ] **F. Sign out and back in (check 6).** Sign out from `/profile`, then sign
  in with Google using the same account. Expect the same profile.
- [ ] **G. Keyboard (check 7).** Tab to the Google button and press Enter.
  Expect "Redirecting to Google…" and then Google's screen.

## Notes for the AI

- Follow the 3a patterns: one `createClient()` per request, raw Supabase
  messages never reach the UI, known error codes only from the URL, and every
  string in `AuthMessages`.
- `proxy.ts` needs no change. `/auth/callback` is in neither redirect list, so
  the proxy only refreshes cookies there.
- Don't add a `next`/`redirect_to` parameter. Post-auth routing is always
  `/profile` until feature 5 changes the signed-in home.
- If step 3's checks show that Supabase creates a second user for a matching
  email, stop and report. That breaks the "same profile" contract, and the
  fix is a user decision, not a workaround.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":13455,"specSha256":"e6125258584c3686adc73f4edd1fab999ccb5b7ea774f9903f0911b19a45f43e","branch":"refs/heads/feature/google-sign-in","head":"f4185ad13307f0c52a9a1dcfb6d96e04fb614315","baseRef":"refs/heads/dev","baseCommit":"f01a6ee249c7fddde92d507cc457c1efb186cacb","sourceTree":"a6480e5cbf48c50c3d6632c0e5371f267d49cce9","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** f4185ad13307f0c52a9a1dcfb6d96e04fb614315
**Base commit:** f01a6ee249c7fddde92d507cc457c1efb186cacb
**Base ref:** origin/dev
**Spec hash:** e6125258584c3686adc73f4edd1fab999ccb5b7ea774f9903f0911b19a45f43e
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-14T04:11:30Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-14T04:12:57Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `f01a6ee249c7fddde92d507cc457c1efb186cacb..f4185ad13307f0c52a9a1dcfb6d96e04fb614315` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `npm run typecheck`: pass
- `npm run lint:web`: pass
- `npm run build:web`: pass (`/auth/callback` dynamic, `/sign-in` partial prerender)
- `curl` GET `/auth/callback`, `?error=access_denied`, `?code=bogus` on localhost:3000: pass (each 307 to `/sign-in?error=google-failed`)
- `curl` GET `/sign-in?error=google-failed`: pass (renders the Google error message)
- `curl` GET `/sign-in?error=constructor`: fail (render error, recorded as F-08)
- `curl` GET `http://127.0.0.1:54321/auth/v1/settings`: pass (`external.google: true`)
- `git check-ignore supabase/.env`: pass (ignored by `supabase/.gitignore`, not tracked)
- Test command: unavailable (none configured)
- Browser tests: unavailable (none configured)

## Evidence

- Freshness verified: `HEAD` equals target, `origin/dev` merge base equals base commit, spec SHA-256 matches, only `blueprint/context/review.md` differs from the target.
- Reviewed every file in the delta: `AGENTS.md`, `(auth)/actions.ts`, `(auth)/sign-in/page.tsx`, `auth/callback/route.ts`, `google-sign-in-button.tsx`, `sign-in-form.tsx`, `sign-up-form.tsx`, `styles.ts`, `messages.ts`, `supabase/.env.example`, `supabase/.gitignore`, `supabase/config.toml`, plus `lib/supabase/server.ts` and `proxy.ts` for context.
- `redirectTo` is built only from the Origin header (which Next validates for Server Actions) plus a fixed path, and Supabase `additional_redirect_urls` still applies. The callback destination is fixed (`/profile` or `/sign-in?error=google-failed`), so there is no open redirect.
- PKCE verifier cookie binds the code exchange to the initiating browser, which prevents login CSRF through a forwarded callback link. The callback logs only `error.code`, never the code or tokens.
- The client secret is read via `env()` from an ignored file. The web app has no new env vars. `enable_manual_linking` stays `false`.
- No performance concern: a single exchange per callback and a small client component.

## Findings

- F-08 [P2] open - Sign-in error lookup crashes on Object.prototype keys (new this pass; not blocking)

## Remaining risk

- The live Google flows were deferred by the user (spec Manual browser checklist A to G, not run). These include automatic linking to existing confirmed and unconfirmed accounts (one user and one profile), cancel handling at Google, the callback actually persisting session cookies on its redirect, and keyboard behaviour.
- No unit test command and no browser test harness are configured, so no automated coverage exists for the action or the callback.
- Opening the app on `127.0.0.1:3000` instead of `localhost:3000` falls outside `additional_redirect_urls`, so Google sign-in would fail there. This is documented in AGENTS.md and was not verified live.
