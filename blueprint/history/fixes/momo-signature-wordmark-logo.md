# Fix: Momo Signature wordmark logo

**Type:** Fix
**Status:** verified
**Branch:** fix/momo-signature-wordmark-logo

## The problem

The "Accordly" wordmark (`AuthMessages.appName`) stands in for a logo until
branding exists. It renders as plain bold app-font text
(`text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400`) in
three places:

- `apps/web/src/components/auth/auth-card.tsx`, in `AuthCard` (sign-in and
  sign-up)
- `apps/web/src/components/auth/auth-card.tsx`, in `AuthSimple` (forgot and
  reset password)
- `apps/web/src/app/profile/page.tsx`, in the profile header

The user wants it set in Momo Signature so that it acts as a logo (2026-10-14).

## The fix

- New `Logo` component in `apps/web/src/components/logo.tsx` (user decision,
  2026-10-14).
  - It loads `Momo_Signature` from `next/font/google` (subset `latin`, weight
    `400`, the only weight) and applies its `className` to a `<p>` containing
    `AuthMessages.appName`.
  - Momo Signature is imported only in this component. `layout.tsx` and
    `globals.css` are unchanged from `dev`.
  - Its styles are `text-lg text-indigo-600 dark:text-indigo-400`, plus an
    optional `className` prop for placement. The auth layouts pass
    `text-center`.
  - It drops `font-bold`, because the family has only weight 400 and bold would
    fake-embolden the script. It drops `tracking-tight`, because tightened
    spacing breaks a connected script.
  - It uses `text-lg` (18px, user request, 2026-10-14). The spec first proposed
    `text-3xl`.
  - A text stroke was tried to make it bolder (0.6px, then 1px) and was reverted
    at the user's request. The logo keeps the font's single natural weight.
- `AuthCard`, `AuthSimple`, and the profile header render `<Logo />` in place
  of their inline wordmark.
- The logo stays real text, so it is readable by screen readers and
  translatable. It uses no image or SVG.
- Out of scope: the page `<title>`, email templates, the favicon, and the
  mobile app.
- History: the first build added a `font-wordmark` Tailwind theme token in
  `globals.css`, loaded the font in `layout.tsx`, and used the token in the three
  places. The user's running dev server kept serving a cached stylesheet without
  that rule, even across a restart. The user then asked for the
  self-contained component above, which does not depend on Tailwind's theme.

## Build steps

- [x] 1. **Set the wordmark in Momo Signature through a `Logo` component**
  - **Evidence (2026-10-14):**
    - typecheck, lint, and build pass.
    - `rg "Momo|momo|font-wordmark" apps/web/src` matches only
      `components/logo.tsx`.
    - On the user's running dev server, `/sign-in`, `/sign-up`,
      `/forgot-password`, and signed-in `/profile` (local test account) render
      the logo with the Momo Signature `next/font` class, and that page's
      stylesheet defines the class as `font-family: Momo Signature`.
    - The agent did not observe the rendered font because no browser tool was
      available; it is left to the user's Try it now.
  - Create `fix/momo-signature-wordmark-logo` from `dev`.
  - Add `components/logo.tsx` and use it in `auth-card.tsx` (both layouts) and
    `profile/page.tsx`.
  - **Done when:**
    - `npm run typecheck`, `npm run lint:web`, and `npm run build:web` pass.
    - Only `components/logo.tsx` references Momo Signature.
    - `/sign-in`, `/sign-up`, `/forgot-password`, and (signed in) `/profile`
      serve the logo with the Momo Signature class, and the served CSS defines
      it.
    - In a browser, "Accordly" renders in Momo Signature on those pages, with
      everything else still in Google Sans.

## Verify

Open http://localhost:3000/sign-in, `/sign-up`, `/forgot-password`, and
`/profile` (signed in). "Accordly" at the top should show as the Momo Signature
script logo in indigo. DevTools → Computed → Rendered Fonts should show "Momo
Signature" for it and "Google Sans" for the heading below. Check it in dark mode
too.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":3984,"specSha256":"b3b4cd7458eb81389a11405a3fd4684902bcc27c9c649e5c3f4f12e78d817af2","branch":"refs/heads/fix/momo-signature-wordmark-logo","head":"00a7d7ae9421bff7d30032a8bc624327e4b38ac4","baseRef":"refs/heads/dev","baseCommit":"00a7d7ae9421bff7d30032a8bc624327e4b38ac4","sourceTree":"4c517f858067207c66ada4bd099dcbcb58a4bce8","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. Open http://localhost:3000/sign-up and hard-refresh (Cmd+Shift+R).
2. "Accordly" at the top should be an 18px indigo script logo. In DevTools →
   Computed → Rendered Fonts it should say Momo Signature, while the heading
   below says Google Sans.
3. Check `/sign-in`, `/forgot-password`, and `/profile` (signed in).
4. Check dark mode (DevTools → Rendering → prefers-color-scheme: dark): the logo
   uses the lighter indigo.
