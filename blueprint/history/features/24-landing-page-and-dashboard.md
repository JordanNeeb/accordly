# Feature: Landing page and dashboard

**From build-plan:** feature 24
**Build attempt:** 1
**Branch:** feature/landing-page-and-dashboard
**Status:** verified

## Goal

Signed-out visitors to `/` see the Tailwind Plus marketing hero as Tango's
landing page, with the logo moved to the top left and a **Log in** link added at
the top right. Signed-in parents land on a new `/dashboard` built from the
Tailwind Plus application shell. Everything else from both references stays as
it is for now.

## Design reference

- **Landing:** `design/references/tailwind-plus/marketing/hero.jsx`
- **Dashboard:** `design/references/tailwind-plus/application/dashboard.jsx`

Keep both references' markup, styling, placeholder images and `href="#"` links
as they are. The only intended changes are:

| Reference | Change |
| --- | --- |
| hero | Move the logo out of the hero column into an absolutely positioned header at the top left (it doesn't push the hero down), replacing the Tailwind mark with `<Logo onDark />`. From `lg` up the hero is at least one screen tall (`min-h-dvh`): content is vertically centred, top and bottom padding shrinks to clear the header, and the screenshot's height is capped and cropped from the top left. Ordinary desktop heights fit one screen, and shorter windows grow and scroll instead of clipping. Phones scroll to the stacked screenshot. |
| hero | Add a **Log in** link at the top right of that row, going to `/sign-in`. |
| hero | Replace the headline and paragraph with the copy below. |
| hero | **Get started** stays where it is and links to `/sign-up`. |
| dashboard | Replace both sidebar Tailwind marks with `<Logo onDark />`. |
| dashboard | Profile menu: the name comes from the signed-in profile, "Your profile" goes to `/profile`, and "Sign out" runs the existing `signOut` action. |
| dashboard | Add a visually hidden `<h1>Dashboard</h1>` in `<main>`. This doesn't change anything visible. |

Unchanged from the references:
- **Hero:** "Learn more" and the remote app screenshot. The "What's new / Just
  shipped v1.0" badge is removed, and the headline takes its top spacing.
- **Dashboard:** navigation items, teams, Settings, search, the notifications
  button, the Unsplash avatar and the empty `<main>`.

## In scope

- Install `@heroicons/react` and `@headlessui/react` in `@tango/web`.
- A `Logo` `onDark` prop that always shows the white-text artwork.
- A landing page at `/`.
- A dashboard at `/dashboard`, signed in only.
- Signed-in visitors land on `/dashboard`:
  - from `/`, `/sign-in` and `/sign-up` (proxy)
  - after email sign-in
  - after Google sign-in
  - after email confirmation
- A completed password reset signs the parent out and lands on `/sign-in`
  with the "Your password has been updated." notice.
- Landing and dashboard strings live in English messages modules, following
  `AuthMessages`.
- Repoint the `design/references/tailwind-plus/auth/` comment in
  `components/auth/styles.ts` to `application/`.

## Out of scope

- French, and the language toggle (feature 4).
- Real dashboard navigation, search, notifications, families, avatars and
  dashboard content. These come from features 5–18.
- Dark-mode styling for the dashboard. The reference is light-only.
- Changes to the profile page, apart from it being reached from the menu and
  losing the password-updated notice, which moves to sign-in.
- Editing archived specs under `blueprint/history/`. They are permanent build
  records, and changing them breaks history checks.
- Removing or swapping any placeholder content from either reference.

## Build loop

`workflow.stepReview` is `feature`: build all steps, then present one review
packet. `workflow.checkpointCommits` is `disabled`. `/complete` creates the
single feature commit.

## Build steps

- [x] **1. Dependencies, logo variant, reference path**
  - Run `npm install @heroicons/react @headlessui/react -w @tango/web`.
  - Add the optional `onDark` prop to `components/common/logo.tsx`. When set,
    render only `/brand/logo-dark.png` (white text); without it, the current
    light/dark switching is unchanged.
  - Change the `components/auth/styles.ts` comment path to
    `design/references/tailwind-plus/application/`.
  - Done when: both packages are in `apps/web/package.json` and the root
    lockfile, and `npm run typecheck` and `npm run lint:web` pass.
- [x] **2. Landing page at `/`**
  - Add `lib/landing/messages.ts` (`LandingMessages`).
  - Add `components/landing/landing-hero.tsx` as a Server Component ported from
    the hero, with the changes in the table above.
  - Header: an `absolute inset-x-0 top-0` `<header>` with `<nav aria-label="Main">`, logo on the left,
    `next/link` **Log in** on the right. It uses the hero's horizontal padding
    and `max-w-7xl`, with the hero text colours (`text-sm/6 font-semibold
    text-white`, like "Learn more").
  - **Get started** becomes a `next/link` to `/sign-up` with its existing
    classes.
  - Keep remote `<img>` elements as plain `<img>`. Add a line-level
    `eslint-disable-next-line @next/next/no-img-element` with a short
    "placeholder from the Tailwind Plus reference" comment, so lint stays clean.
  - `app/page.tsx` renders the hero instead of redirecting.
  - Done when: signed out, `/` matches the reference apart from the listed
    changes; Log in goes to `/sign-in` and Get started to `/sign-up`.
    Typecheck, lint and `npm run build:web` pass.
- [x] **3. Dashboard at `/dashboard`**
  - Add `lib/dashboard/messages.ts` (`DashboardMessages`) holding the
    reference's visible and screen-reader strings.
  - Add `components/dashboard/dashboard-shell.tsx` (`"use client"`), ported
    from the reference with the changes in the table above.
    - Props: `userName: string`.
    - Sign out is a `<form action={signOut}>` with a submit button inside the
      menu item.
    - Typed `next/link` for `/profile`.
  - Add `app/dashboard/page.tsx` (Server Component):
    - Inside `<Suspense>`, read `getClaims()` and redirect to `/sign-in` when
      there is no `sub`.
    - Load `first_name, last_name` from `profiles` for that id.
    - `userName` is the trimmed first and last name, falling back to the claims
      email when both are empty or the read fails. A failed read is logged with
      `[dashboard]` and its code and message only.
    - The Suspense fallback renders the shell with `userName=""`.
    - Metadata title: "Dashboard".
  - Done when: signed in, `/dashboard` shows the shell with the Tango logo and
    the parent's name (or email). "Your profile" opens `/profile`, "Sign out"
    signs out and lands on `/sign-in`, and the mobile sidebar opens and closes.
    Typecheck, lint and build pass.
- [x] **4. Route signed-in parents to the dashboard**
  - `src/proxy.ts`:
    - Add `"/dashboard": "/sign-in"` to `SIGNED_IN_ONLY`.
    - Add `/` to `SIGNED_OUT_ONLY`.
    - Change the signed-in redirect target from `/profile` to `/dashboard`.
    - Update the comments.
  - `(auth)/actions.ts`:
    - `signIn` redirects to `/dashboard`.
    - After a successful `updateUser`, `updatePassword` calls
      `supabase.auth.signOut()` (default scope, matching the existing `signOut`
      action), then redirects to `/sign-in?notice=password-updated`.
    - If that sign-out fails, log it with `unexpected` but don't return. The
      password is already changed, so the parent still continues to `/sign-in`,
      and the proxy sends a still-signed-in parent on to `/dashboard`.
  - `(auth)/sign-in/page.tsx`: alongside `URL_ERRORS`, add a known-code
    `URL_NOTICES` map, `password-updated` mapping to
    `AuthMessages.notices.passwordUpdated`. It is shown with
    `<FormAlert notice>`. The URL never supplies text.
  - `profile/page.tsx` and `components/profile/profile-form.tsx`: remove the
    now-unused `NOTICES` map, the `searchParams` notice read and the `notice`
    prop.
  - `auth/callback/route.ts` (Google) and `auth/confirm/route.ts` (`email`
    type) redirect to `/dashboard`.
  - Done when:
    - signed out, `/dashboard` goes to `/sign-in`
    - signed in, `/`, `/sign-in` and `/sign-up` go to `/dashboard`
    - email sign-in, Google sign-in and confirming a new account land on
      `/dashboard`
    - completing a password reset signs the parent out and lands on
      `/sign-in` showing "Your password has been updated.", and signing in with
      the new password reaches `/dashboard`
    - an unknown `?notice=` value on `/sign-in` shows nothing
    - typecheck, lint and build pass

- [x] **5. Repair F-08: let the landing page scroll on short screens**
  - In `landing-hero.tsx`, the outer wrapper goes from `lg:h-dvh` to
    `lg:flex lg:min-h-dvh lg:flex-col`, and the content row goes from
    `lg:h-full` to `lg:w-full lg:flex-1`. The content stays centred and fits one
    screen at ordinary desktop heights.
  - Done when: on a window at least 1024px wide but too short for the content,
    the page scrolls and Get started can be reached. Typecheck, lint and build
    pass.

## Files / areas

- `apps/web/package.json`, `package-lock.json`
- `apps/web/src/components/common/logo.tsx`
- `apps/web/src/components/auth/styles.ts` (comment only)
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/landing/landing-hero.tsx` (new)
- `apps/web/src/lib/landing/messages.ts` (new)
- `apps/web/src/app/dashboard/page.tsx` (new)
- `apps/web/src/components/dashboard/dashboard-shell.tsx` (new)
- `apps/web/src/lib/dashboard/messages.ts` (new)
- `apps/web/src/proxy.ts`
- `apps/web/src/app/(auth)/actions.ts`, `apps/web/src/app/(auth)/sign-in/page.tsx`
- `apps/web/src/app/profile/page.tsx`, `apps/web/src/components/profile/profile-form.tsx`
- `apps/web/src/app/auth/callback/route.ts`, `apps/web/src/app/auth/confirm/route.ts`

## Data / contracts

Routes:

| Path | Signed out | Signed in |
| --- | --- | --- |
| `/` | Landing page | Redirect to `/dashboard` |
| `/dashboard` | Redirect to `/sign-in` | Dashboard |
| `/sign-in`, `/sign-up` | Form | Redirect to `/dashboard` |
| `/profile` | Redirect to `/sign-in` | Profile (from the user menu) |
| Password reset submitted | — | Signed out, then `/sign-in?notice=password-updated` |

- The dashboard reads only the signed-in parent's own `profiles` row. The id
  comes from verified claims, and RLS enforces it again.
- The name is rendered as React text and is never interpreted as HTML.
- No schema change and no new persisted data.

Landing copy (English):

- **Header link:** "Log in"
- **Headline (h1):** "Co-parent without the conflict."
- **Paragraph:** "Built in Canada for Canadian families. Permanent,
  court-ready messages, a schedule both parents stick to, and expenses and
  support paid from your Canadian bank."
- **Get started**, **Learn more**: unchanged from the reference.

## Testing

- No test runner or Verify command is configured. The gates are
  `npm run typecheck`, `npm run lint:web` and `npm run build:web`.
- Manual checks (`/check`):
  - landing at desktop and phone widths, in light and dark system themes (the
    logo stays white-text)
  - keyboard order on the landing page: Log in, Get started, Learn more
  - dashboard: sidebar dialog on mobile, the profile menu by keyboard, sign out
  - every redirect in the routes table, plus email and Google sign-in, account
    confirmation, and password reset ending signed out on `/sign-in` with the
  notice

## Notes for the AI

- The proxy only makes optimistic redirects. The dashboard page still verifies
  the session itself, the same way `/profile` does.
- Use `next/link` for internal links. Leave the reference's `href="#"` links as
  plain `<a>`.
- Keep the hero's fixed SVG pattern `id`. There is one instance per page.
- Port JSX faithfully, adding TypeScript types. Swap the reference's
  `classNames` helper for a local typed one in the shell; don't add `clsx`.

## Open questions

- None blocking. Placeholders left on purpose until you replace them:
  - the remote app screenshot
  - the Unsplash avatar
  - the reference navigation items (Team, Projects, Reports and so on)


<!-- blueprint:completion {"schemaVersion":2,"specBytes":12054,"specSha256":"ec71c2492d2bf6e109027735d4747d6bc40df8071812ce8def1fc3ddccdd3fc3","branch":"refs/heads/feature/landing-page-and-dashboard","head":"8f6565b1cc146d518bc7143a8be31cebe932c328","baseRef":"refs/heads/dev","baseCommit":"1ed6abe263649aef418b8bf6693db47022b373c0","sourceTree":"7d1c6e3f9ee0f7b08803da6c1419ade1b303d314","landing":"local-merge","absentOptional":[]} -->

## Findings

### 24/F-03 [P3] closed - Profile notice lookup accepts Object.prototype keys

**File:** apps/web/src/app/profile/page.tsx:47
**Found:** 2026-10-13 by /audit independent (scope: current; lens: security, quality)
**Why it matters:** `NOTICES[notice]` is a plain-object lookup, so `/profile?notice=constructor` (or `toString`, `__proto__`) yields `Object`, a function, or `Object.prototype` instead of `undefined`. That value is passed as the `notice` prop to the client `ProfileForm`, which React cannot serialize from a Server Component, so the profile render fails. Anyone can send a signed-in parent such a link. The impact is limited to an error page; no text injection is possible.
**Suggested fix:** Guard the lookup with `Object.hasOwn(NOTICES, notice)` (or use a `Map`). Apply the same guard anywhere a URL value indexes a record. No current requirement is lost.
**Resolution:** Closed 2026-10-15 by /audit independent (landing page and dashboard, target 5a668a0). The delta removes the `NOTICES` map, the `searchParams` read and the `notice` prop from `profile/page.tsx` and `profile-form.tsx`. The notice moved to `(auth)/sign-in/page.tsx:23`, whose `known()` helper guards both URL maps with `Object.hasOwn`, so prototype keys yield `undefined`. No new defect introduced.

### 24/F-08 [P3] closed - Landing hero can clip its call to action on short desktop windows

**File:** apps/web/src/components/landing/landing-hero.tsx:14
**Found:** 2026-10-15 by /audit independent (scope: current; lens: quality)
**Why it matters:** From `lg` up the outer wrapper is `lg:h-dvh` with `overflow-hidden`, and the content column is vertically centred with `lg:py-24`. When the viewport is at least 1024px wide but short (a landscape laptop window around 500px tall, or larger browser text sizes), the headline, paragraph and buttons are taller than the space left. They overflow both edges and get clipped, with no page scroll, so **Get started** can become unreachable. The spec asks for exactly one screen at `lg`, but it does not cover short viewports. No browser check was run (Check not required).
**Suggested fix:** Confirm with a short-window browser check. If it clips, use `lg:min-h-dvh` (or allow `overflow-y-auto`) so the hero can grow past one screen when the content needs it. No current requirement is lost on ordinary desktop heights.
**Resolution:** Fixed in /implement step 5: the hero is now `lg:min-h-dvh` with a flex column, so it fits one screen at ordinary heights and scrolls on short windows. Awaiting /audit closure. Closed 2026-10-15 by /audit independent (target 8f6565b). `landing-hero.tsx:15` wrapper is now `lg:flex lg:min-h-dvh lg:flex-col` and the content row (line 72) is `lg:w-full lg:flex-1 lg:items-center`, so the in-flow content sets the wrapper's height when it exceeds one screen; `overflow-hidden` only clips the decorative absolute layers, and `body`/`html` are `h-full` without overflow clipping, so the document scrolls. The screenshot cap `lg:max-h-[calc(100dvh-12rem)]` keeps ordinary heights to one screen. No new defect introduced. Static reasoning only; no browser check (Check not required).

## Independent review

**Status:** passed
**Target commit:** 8f6565b1cc146d518bc7143a8be31cebe932c328
**Base commit:** 1ed6abe263649aef418b8bf6693db47022b373c0
**Base ref:** origin/dev
**Spec hash:** ec71c2492d2bf6e109027735d4747d6bc40df8071812ce8def1fc3ddccdd3fc3
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-15T02:17:23Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-15T02:18:54Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`: pass (equals Target commit)
- `git merge-base origin/dev HEAD`: pass (equals Base commit)
- `shasum -a 256 blueprint/context/current-feature.md`: pass (equals Spec hash; spec is tracked, no snapshot)
- `git status --porcelain --untracked-files=all`: pass (only `blueprint/context/review.md` modified)
- `npm run typecheck`: pass
- `npm run lint:web`: pass
- `npm run build:web`: pass (`/` static, `/dashboard` partial prerender)

## Evidence

- Reviewed the full `1ed6abe..8f6565b` delta: proxy routing, `signIn`/`updatePassword` redirects and sign-out, sign-in `URL_NOTICES` with `Object.hasOwn` guard, profile notice removal, callback/confirm destinations, `Logo` `onDark`, landing hero, dashboard page and shell, messages modules, package and lockfile additions, planning docs.
- `/dashboard` verifies `getClaims()` itself, reads only `profiles` filtered by `claims.sub`, logs code and message only, and renders the name as React text.
- Proxy redirect targets are fixed constants with the query cleared; no open redirect. Confirm destinations remain fixed per link type.
- Sign out uses a form outside the menu with a `form`-attribute submit button inside the `MenuItem`; a sound adaptation of the spec's form-in-menu wording since Headless UI unmounts closed items.
- Lockfile additions are only `@headlessui/react`, `@heroicons/react` and their transitive dependencies.
- F-08 closed after re-examining `landing-hero.tsx:15` and `:72` against the root layout.

## Findings

- F-08 [P3] closed this pass.
- F-04 [P3] and F-05 [P3] re-examined, still open (non-blocking).
- No new findings. No P0 or P1 open or fixed.

## Remaining risk

- No test runner or Verify command configured; no automated tests cover the redirect matrix or password-reset sign-out.
- No browser check run (Check not required): landing layout at short and phone viewports, dashboard mobile sidebar, keyboard use of the profile menu and menu sign-out submission are verified by static reading only.
- No dependency vulnerability scan was run for the new packages.

## Try it now

1. With Docker running, start Supabase (`npx supabase@latest start`), run `npm run dev:web`, and open http://localhost:3000 in a private window.
2. **Landing:** the logo is top left, "Log in" with an arrow is top right, and the page shows "Co-parent without the conflict.", the Canadian paragraph, Get started, Learn more and the screenshot. On a normal laptop it fits one screen. Shrink the window's height and the page should scroll so Get started stays reachable.
3. Click **Log in** to reach `/sign-in`. Go back and click **Get started** to reach `/sign-up`.
4. Sign in with an existing account. You land on `/dashboard`, with the Tango logo in the dark sidebar and your name (or email) at the top right.
5. Open the user menu. "Your profile" opens `/profile`. Go back, choose "Sign out", and you land on `/sign-in`.
6. While signed in, visit `/`, `/sign-in` and `/sign-up`: each goes to `/dashboard`. While signed out, `/dashboard` goes to `/sign-in`.
7. **Password reset:** request a reset from `/forgot-password` and open the email in Mailpit (http://127.0.0.1:54324). Set a new password. You are signed out on `/sign-in` with "Your password has been updated." Sign in with the new password and you reach `/dashboard`.
8. Below 1024px wide, the dashboard's menu button opens and closes the sidebar. On `/sign-in?notice=anything`, no message appears.
