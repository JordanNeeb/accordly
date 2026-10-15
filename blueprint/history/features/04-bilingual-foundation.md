# Feature: Bilingual foundation

**From build-plan:** feature 4
**Build attempt:** 1
**Branch:** feature/bilingual-foundation
**Status:** verified

## Goal

Every web screen that exists today (landing, sign up, sign in, forgot and reset
password, profile, dashboard shell) renders in English or French. The strings
live in shared EN/FR translations in `@tango/shared` so mobile (feature 19) can
reuse them. A parent picks a language with an EN/FR toggle; signed-in parents
keep it in `profiles.language`, and signed-out visitors keep it in a cookie.

> Revised during implementation at the user's request: the one-button EN/FR
> toggle became a language-icon dropdown, and the landing Log in arrow was
> removed. The toggle also needed two clicks, because the action response
> rendered in the language the proxy chose before the cookie changed; the
> action now redirects back to the page so the next request uses the new
> language. A second revision removed the menu from the profile page and the
> dashboard top bar and moved the dashboard's language choice into a Settings
> dropdown in the sidebar. A third revision made the logo a home link.

## In scope

- Shared, typed EN and FR dictionaries in `packages/shared`, where the French
  dictionary must have exactly the English shape (a missing key fails typecheck).
- All current web UI strings moved into the dictionaries and translated to
  Canadian French: visible text, `aria-label`s, `alt` text, page titles,
  Suspense fallbacks, validation errors, notices, and mapped Supabase errors.
- `<html lang>` matches the active language.
- Language resolution for every page request: `tango-lang` cookie, then the
  browser's `Accept-Language`, then `en`.
- A language menu (Heroicons language icon opening the Tailwind Plus dropdown
  from the dashboard account menu, listing English and Français) on the landing
  header and the auth pages.
- On the dashboard, the sidebar Settings button opens a dropdown with a
  Language row (language icon, label, chevron); choosing it swaps the dropdown
  to the list of languages, with a back row. The profile page has no language
  control.
- Every Tango logo links home: `/` for signed-out visitors (the landing page),
  which the proxy sends on to `/dashboard` for signed-in parents; the dashboard
  and profile logos link straight to `/dashboard`.
- The arrow beside Log in on the landing page is removed.
- Toggling while signed in saves `profiles.language`; signing in restores the
  saved language into the cookie; email sign-up stores the current language in
  the new profile.

## Out of scope

- Auth email templates (`supabase/templates/confirmation.html`,
  `recovery.html`) stay English. Bilingual email belongs with feature 18.
- Mobile wiring (feature 19).
- Locale-aware date, number, and currency formatting. No current screen shows
  any; later features use `Intl` with the active language.
- Locale prefixes in visible URLs (`/fr/...`), separate French SEO pages, and
  `hreflang`.
- A translation library or translation-management service.
- Replacing the Tailwind Plus placeholder content on the dashboard (it is
  translated, not removed). Brand names (`Tango`, `Heroicons`, `Tailwind Labs`,
  `Workcation`, `Google`) are not translated.

## Build loop

`workflow.stepReview` is `feature`: implement all steps, then present one
review packet. `workflow.checkpointCommits` is `disabled`: no step commits.
`/complete` creates the final feature commit.

## Build steps

- [x] **1. Shared dictionaries.** Add `packages/shared/src/i18n/en.ts` holding
  today's `AuthMessages`, `DashboardMessages`, and `LandingMessages` under
  `auth`, `dashboard`, and `landing` keys (plus a `languageToggle` group for
  step 4), and `fr.ts` typed as `Messages` (the English shape with string
  values). Add `getMessages(lang)` and `isLanguage(value)` next to
  `SUPPORTED_LANGUAGES`, and export them from `src/index.ts`. Point the three
  `apps/web/src/lib/*/messages.ts` files at `en` so the app is unchanged.
  Done when: `npm run typecheck` passes; deleting a key from `fr.ts` makes
  typecheck fail (try it, then restore); `npm run build:web` passes.

- [x] **2. Language routing.** Read
  `node_modules/next/dist/docs/01-app/02-guides/internationalization.md` and the
  root-layout and `generateStaticParams` references first. Move every page and
  the root layout from `apps/web/src/app/` into `apps/web/src/app/[lang]/`
  (`page.tsx`, `layout.tsx`, `(auth)/*`, `dashboard/`, `profile/`; actions may
  stay beside their pages). The layout returns `generateStaticParams` for `en`
  and `fr`, calls `notFound()` for anything else, and sets `<html lang>`.
  Route handlers `app/auth/callback` and `app/auth/confirm` stay outside
  `[lang]`. In `src/proxy.ts`, after the existing redirect decision, resolve the
  language (valid `tango-lang` cookie, else the highest-ranked `en`/`fr` tag in
  `Accept-Language`, else `en`), write the cookie when it was missing or
  invalid, and rewrite (not redirect) the request to `/<lang><pathname>`.
  Skip the rewrite for `/auth/*`. Server components and `generateMetadata` read
  `lang` from params and call `getMessages(lang)`.
  Done when: typecheck, lint, and build pass with no Cache Components errors;
  visible URLs are unchanged (`/`, `/sign-in`, `/dashboard`...); with the cookie
  set to `fr`, server-rendered text and `<title>` on `/` and `/sign-in` are
  French and `<html lang="fr">`; with no cookie and `Accept-Language: fr-CA`
  the page is French and the cookie is set; signed-in and signed-out redirects
  behave as before; `/auth/callback` still exchanges a code.

- [x] **3. Client components and server actions.** Add a small
  `LanguageProvider` (client context, set in `[lang]/layout.tsx`) with
  `useMessages()` and `useLanguage()` for client components. Add a server helper
  (in `src/lib/i18n/`) that reads the language from the `tango-lang` cookie,
  validated with `isLanguage`, defaulting to `en`, for Server Actions. Every
  action in `(auth)/actions.ts` and `profile/actions.ts` returns errors and
  notices in that language; `lib/auth/validation.ts` takes the messages it
  needs instead of importing English. Delete the three `lib/*/messages.ts` files.
  Done when: typecheck, lint, and build pass; no component, page, action, or
  validator imports the old message files or contains user-facing English
  literals (grep); with the cookie set to `fr`, sign-up and sign-in validation
  errors, the invalid-credentials error, the forgot-password notice, the
  profile saved notice and name prompt, and dashboard labels and `aria-label`s
  appear in French.

- [x] **4. Language menu and saved preference.** Add a `setLanguage` Server Action
  that accepts only `en` or `fr` (anything else returns the generic error),
  and when signed in updates `profiles.language` for the session's user id
  (from `getClaims()`, never the form). If the profile update fails, log it,
  leave the cookie unchanged, and return the generic error. On success it sets
  `tango-lang` (path `/`, one year, `SameSite=Lax`, `httpOnly`, `secure` in
  production) so the current page re-renders in the new language. Add
  `src/components/common/language-menu.tsx`: a `LanguageIcon` menu button
  (accessible name "Language" / "Langue") opening the Headless UI `Menu` styled
  like the dashboard account dropdown, with `English` (`lang="en"`) and
  `Français` (`lang="fr"`) items, the current one checked and disabled, a
  pending state, and an error shown with `role="alert"`. After saving, the
  action redirects to the path of the Referer (never another origin, `/` when
  missing) so the page re-renders in the new language on one selection. Place
  the menu on the landing header and the auth card. Remove the arrow beside Log
  in on the landing page. In the dashboard sidebar, replace the placeholder
  Settings link with `src/components/dashboard/settings-menu.tsx`: a Headless
  UI `Popover` (a `Menu` closes on every item click) styled like the account
  dropdown, opening to a Language row (`LanguageIcon`, label, `ChevronRightIcon`)
  that swaps the panel to a back row (`ChevronLeftIcon`) and the language list.
  Focus moves into the panel on open and to the first row of each view. Email sign-up sends `language` in the sign-up
  metadata (the trigger already stores it). Password sign-in and the Google
  callback read the parent's `profiles.language` and set the cookie to it
  before redirecting; if that read fails, log it and keep the current cookie.
  Done when: typecheck, lint, and build pass; signed out, the toggle switches
  `/` and `/sign-in` between languages with one selection and after reload;
  signed in, choosing a language from Settings on the dashboard switches the UI and changes
  `profiles.language` (check in Studio); signing out, clearing the cookie, and
  signing back in restores the saved language; a new email sign-up made in
  French gets `language = 'fr'`; the menu opens, moves, and selects by
  keyboard. The menu needs JavaScript (Headless UI), so the no-JavaScript
  toggle is dropped.

## Files / areas

- `packages/shared/src/index.ts`, new `packages/shared/src/i18n/en.ts`, `fr.ts`
- `apps/web/src/app/` moved under `apps/web/src/app/[lang]/`;
  `app/auth/callback/route.ts` and `app/auth/confirm/route.ts` stay put
- `apps/web/src/proxy.ts`
- `apps/web/src/app/(auth)/actions.ts`, `apps/web/src/app/profile/actions.ts`
- `apps/web/src/lib/auth/validation.ts`; delete `lib/auth/messages.ts`,
  `lib/dashboard/messages.ts`, `lib/landing/messages.ts`
- New `apps/web/src/lib/i18n/` (server language helper, `LanguageProvider`)
- New `apps/web/src/components/common/language-menu.tsx`,
  `apps/web/src/components/dashboard/settings-menu.tsx`, and
  `apps/web/src/lib/i18n/actions.ts` (`setLanguage`)
- Every component under `apps/web/src/components/` that reads strings

## Data / contracts

- `Language` is `'en' | 'fr'` (`SUPPORTED_LANGUAGES` in `@tango/shared`,
  already present). `profiles.language` already exists (`text not null default
  'en'`, check `in ('en','fr')`), and `authenticated` already holds
  `update (language)`; confirm the grant in Studio before step 4. No migration.
- `Messages` is derived from `en` with every leaf widened to `string`; `fr`
  must satisfy it exactly. No interpolation is needed by current strings; add
  none until a string needs it.
- Cookie `tango-lang`: value `en` or `fr`. It is a display preference, not an
  authorization input; any other value is treated as missing.
- Source of truth: `profiles.language` for signed-in parents, copied to the
  cookie at sign-in and written on toggle. The proxy reads only the cookie and
  `Accept-Language`, so it makes no database call.
- Sign-up metadata: `{ name, language }`; the existing `handle_new_user`
  trigger validates `language` and falls back to `en`.
- URLs do not change. `[lang]` is an internal rewrite target only; a visible
  `/fr/...` path is not a supported URL.

## Testing

No test command is configured, so tests are not a gate. Evidence per step:
`npm run typecheck`, `npm run lint:web`, `npm run build:web`, and browser checks
of the done-when items on `npm run dev:web` (Claude in Chrome is connected).
Do not claim the Google callback language sync works without a real Google
sign-in; Google sign-in is still untested locally (see the 3b checklist).

## Notes for the AI

- Next.js 16 with Cache Components: reading cookies in a root layout outside
  Suspense fails the build. That is why the language comes from the `[lang]`
  param via a proxy rewrite rather than from `cookies()` in the layout. If the
  build still reports uncached access, stop and report rather than adding
  `force-dynamic` or similar.
- Keep strings as plain `as const` objects; React escapes them, so no extra
  rendering rule is needed. Never render translations as HTML.
- French: Canadian French conventions (`courriel`, `Se connecter`,
  `Mot de passe oublié?` with Canadian spacing rules). The project owner
  should review the French copy before release; say so in the review packet.
- `profile-form.tsx` currently detects a save by comparing the notice to the
  English string. Compare against the active language's string or return an
  explicit flag; keep the behavior.
- Google Sans `latin` subset includes French accented characters; confirm
  `é à ç ô ù` render in the browser check.
- Signed-in and signed-out redirect rules in `proxy.ts` must not change.

## Open questions

- **New Google accounts.** Google sign-up cannot pass `language` metadata, so a
  new Google profile starts as `en`, and the callback then sets the cookie to
  `en` even if the visitor was browsing in French. Recommended for this
  feature: accept it (one toggle fixes it, and it is saved). Alternative: on
  the callback, if the profile was created moments ago, save the cookie's
  language to it instead. This does not block steps 1 to 3.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":12922,"specSha256":"155b9af53cc88b9085995bb6f2f4fa209b4a11ac185e3f3a6380ff08aeee71c9","branch":"refs/heads/feature/bilingual-foundation","head":"8d545c226a4ad423b2b5c3af0142add680d850b2","baseRef":"refs/heads/dev","baseCommit":"facee482047d361de584e2ba05875a8843e76753","sourceTree":"adbabaf23cf26ed8ca78988b693a21d2f2c05a6f","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 8d545c226a4ad423b2b5c3af0142add680d850b2
**Base commit:** facee482047d361de584e2ba05875a8843e76753
**Base ref:** origin/dev
**Spec hash:** 155b9af53cc88b9085995bb6f2f4fa209b4a11ac185e3f3a6380ff08aeee71c9
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-15T11:15:52Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-15T11:19:30Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `facee482047d361de584e2ba05875a8843e76753..8d545c226a4ad423b2b5c3af0142add680d850b2` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `npm run typecheck`: pass (mobile, web, shared)
- `npm run lint:web`: pass
- `npm run build:web`: pass (`/en/*` and `/fr/*` prerendered or partially prerendered; no Cache Components errors)
- Read-only HTTP probes of the running dev server (`curl` on localhost:3000): pass

### Evidence

- Preconditions: `HEAD` = target; `git merge-base origin/dev HEAD` = base; tracked spec hash matches in the working tree and in the target; only `blueprint/context/review.md` differed from the target before this pass.
- Full delta reviewed: 42 files (shared EN/FR dictionaries, `[lang]` route move, proxy language resolution and rewrite, `lib/i18n/*`, `setLanguage`, language and settings menus, sign-in/callback/confirm language restore, all localized components).
- `setLanguage` validates `lang` with `isLanguage`, takes the user id from `getClaims()`, leaves the cookie unchanged on a failed profile update, and redirects only to the Referer path (`//host` falls back to `/`; WHATWG URL normalizes backslashes), so no open redirect.
- Proxy: redirect rules unchanged; `/auth/*` skips the rewrite; `/en/sign-in`, `/fr`, and unknown paths return 404, so `[lang]` is not a visible URL.
- Dev-server probes: `tango-lang=fr` renders `<html lang="fr">` and `<title>Se connecter | Tango</title>` on `/sign-in`; `Accept-Language: fr-CA` with no cookie sets `tango-lang=fr; HttpOnly; SameSite=lax; Max-Age=31536000`; app icons still resolve.
- Next.js `send-response` appends route-handler `Set-Cookie` after middleware cookies, so the callback and confirm routes' restored language wins over a proxy-written default.
- `fr` is typed as `Messages`, so missing or extra keys fail typecheck; no `lib/*/messages` imports or hard-coded English UI literals remain (grep).

### Findings

- No new findings.
- Re-examined, still open P3: F-04 (proxy redirect drops refreshed session cookies, now `proxy.ts:83`), F-05, F-06, F-07 (now also triggered by cookie/page language divergence across tabs).
- Not in this delta, unchanged: F-01, F-02 (unverified), F-08.

### Remaining risk

- No test command is configured, so `preferredLanguage` parsing and the Referer-path sanitizer have no automated tests.
- Check was not required and was not run; browser keyboard behavior of the language and settings menus, and the one-selection switch, were not exercised in this pass.
- Google callback language restore is unverified without a real Google sign-in (spec Testing note).
- Server Action messages use the cookie language while pages use the `[lang]` param; they can disagree only when the language is switched in another tab.
- French copy still needs owner review before release (spec note).

## Try it now

1. Open http://localhost:3000 while signed out, click the language icon beside
   Log in, and choose Français. The headline reads "La coparentalité, sans le
   conflit."
2. Click the logo: you stay on the landing page. Go to Se connecter; the form
   is in French.
3. Sign in. On the dashboard, open Paramètres, then Langue, and choose English.
   The dashboard switches on that one selection.
4. Click the logo: you land on /dashboard. Open your profile from the account
   menu; it has no language control.
5. Optional: sign out, switch to Français, and sign back in. The dashboard
   comes back in English, the saved preference.
