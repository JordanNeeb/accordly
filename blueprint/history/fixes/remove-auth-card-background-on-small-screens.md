# Fix: Remove auth card background on small screens

**Type:** Fix
**Status:** verified
**Branch:** fix/remove-auth-card-background-on-small-screens

## The problem

`AuthCard` (`apps/web/src/components/auth/auth-card.tsx`), used only by
`/sign-in` and `/sign-up`, wraps the form in a card panel. Below the `sm`
breakpoint (640px) the card goes full width, but it keeps its panel:

- light mode: a solid `bg-white` and `shadow-sm` on the `bg-gray-50` page
- dark mode: a translucent `dark:bg-gray-800/50` with a faint
  `dark:outline-white/10` on the `bg-gray-900` page

On a phone this reads as a translucent band across the full screen rather than
a card. The user decided on 2026-10-14 that small screens should have no panel
in either mode.

## The fix

- Scope the panel classes on the card `<div>` to `sm:` and up: the
  background, shadow, rounded corners, and the dark-mode background, shadow
  override, and outline. Keep `px-6 py-12` on small screens so the form keeps
  its spacing. From 640px up, the classes resolve exactly as they do now:

  ```
  px-6 py-12 sm:rounded-lg sm:bg-white sm:px-12 sm:shadow-sm
  sm:dark:bg-gray-800/50 sm:dark:shadow-none sm:dark:outline
  sm:dark:-outline-offset-1 sm:dark:outline-white/10
  ```

- Below 640px the form sits directly on the page background (`bg-gray-50`
  light, `bg-gray-900` dark). Inputs and buttons keep their own backgrounds.
- No other changes. `AuthSimple` (`/forgot-password`, `/reset-password`) has
  no card and is untouched, and so are the profile page and the Tailwind Plus
  reference files.

## Build steps

- [x] 1. **Scope the card panel to `sm` and up**
  - **Evidence (2026-10-14):** typecheck, lint, and build pass. The built CSS
    puts `sm:bg-white`, `sm:shadow-sm`, and `sm:rounded-lg` inside
    `@media (min-width:40rem)`, and the dark rules inside that plus
    `prefers-color-scheme:dark`. `/sign-in` and `/sign-up` serve the new class
    list. The visual browser check is not observed by the agent (no browser
    tool available) and is left to the user's Try it now.
  - Create `fix/remove-auth-card-background-on-small-screens` from `dev`.
  - Update the card `<div>` class list in `auth-card.tsx` as above.
  - **Done when:** `npm run typecheck`, `npm run lint:web`, and
    `npm run build:web` pass. The built CSS (or the dev server's stylesheet)
    contains the `sm:`-scoped background, shadow, and outline rules, and the
    `/sign-in` and `/sign-up` HTML carries the new class list. In a browser,
    below 640px wide in both light and dark mode, the sign-in and sign-up forms
    sit on the page background with no panel. At 640px and up the card looks
    as before.

## Verify

Open http://localhost:3000/sign-in and `/sign-up`. Narrow the window below
640px, or use device mode, in light and dark mode: there should be no white or
translucent panel behind the form. Widen past 640px: the card, shadow, rounded
corners, and dark outline return unchanged.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":2957,"specSha256":"6b75ae8fe4867bbf9ff7b2fa61ce774f69dec1c0a09224e8175626332e234f23","branch":"refs/heads/fix/remove-auth-card-background-on-small-screens","head":"66fe18630a174c4d872fe33963905d208a2f84ad","baseRef":"refs/heads/dev","baseCommit":"66fe18630a174c4d872fe33963905d208a2f84ad","sourceTree":"948b37367ad6a1f1103949555c8cf824b47c8c23","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. Open http://localhost:3000/sign-in in Chrome and open DevTools device mode
   (Cmd+Shift+M) at a phone width such as 390px.
2. Light mode: the form sits on the light gray page with no white panel or
   shadow behind it.
3. Dark mode: in DevTools, open the Rendering tab and set "Emulate CSS
   prefers-color-scheme" to dark. There should be no translucent gray band or
   faint outline behind the form.
4. Widen past 640px in both modes. The card, shadow, rounded corners, and dark
   outline come back as before.
5. Repeat on `/sign-up`.
