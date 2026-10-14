# Fix: Use Google Sans fonts on web

**Type:** Fix
**Status:** verified
**Branch:** fix/use-google-sans-fonts-on-web

## The problem

The web app still uses the create-next-app fonts. `apps/web/src/app/layout.tsx`
loads Geist and Geist Mono through `next/font/google` as the CSS variables
`--font-geist-sans` and `--font-geist-mono`. `apps/web/src/app/globals.css`
maps Tailwind's `--font-sans` and `--font-mono` to them, and `body` uses
`--font-sans`.

The user asked for Google Sans on 2026-10-14. During implementation they briefly
switched to Montserrat, with Google Sans only on the Google button, then settled
on Google Sans for the whole app. The branch was renamed to match each change.

## The fix

- In `layout.tsx`, replace `Geist` with `Google_Sans` and `Geist_Mono` with
  `Google_Sans_Code`, from the same `next/font/google` import.
  - `Google_Sans_Code` is Google Sans's monospace companion.
  - Use variables `--font-google-sans` and `--font-google-sans-code`.
  - Use subset `latin`, which also covers French accents and œ for feature 4.
  - Google Sans is a variable font covering weights 400–700, which includes
    every weight the UI uses: normal, `font-medium`, `font-semibold`, and
    `font-bold`.
- In `globals.css`, point `--font-sans` and `--font-mono` at the new variables.
- The Google button inherits the app font, so it needs no separate font.
- Fonts stay self-hosted by `next/font` at build time, so there is no runtime
  request to Google and no new dependency.
- Out of scope:
  - The Expo app (`apps/mobile`) still runs the starter template on system
    fonts. Mobile styling belongs to feature 19.
  - Email templates keep their current fonts.

## Build steps

- [x] 1. **Switch the web fonts to Google Sans**
  - **Evidence (2026-10-14):** typecheck, lint, and build pass. The build
    self-hosts the font files. `rg -i "geist|montserrat" apps/web/src` finds
    nothing, and `google-sign-in-button.tsx` is unchanged from `dev`. The built
    CSS has `@font-face` rules for "Google Sans" and "Google Sans Code" and
    `--font-sans:var(--font-google-sans)`. `/sign-in` serves both font variable
    classes on `<html>`. The agent did not observe the rendered-font check
    because no browser tool was available; it is left to the user's Try it now.
  - Create `fix/use-google-sans-fonts-on-web` from `dev`.
  - Update `apps/web/src/app/layout.tsx` and `apps/web/src/app/globals.css` as
    above. No file should still reference Geist or Montserrat.
  - **Done when:**
    - `npm run typecheck`, `npm run lint:web`, and `npm run build:web` pass,
      and the build downloads the fonts.
    - `rg -i "geist|montserrat" apps/web/src` finds nothing.
    - The `<html>` element served for `/sign-in` carries the new font
      variable classes.
    - The built CSS defines `@font-face` rules for "Google Sans" and "Google
      Sans Code", and `--font-sans` resolves to the Google Sans variable.
    - In a browser, the sign-in page text renders in Google Sans (DevTools →
      Computed → Rendered Fonts).

## Verify

Open http://localhost:3000/sign-in. In DevTools, inspect the heading, an input
label, and the "Continue with Google" label. Under Computed → Rendered Fonts,
they should all show "Google Sans". The weights should still look right: bold
titles, semibold buttons, and medium labels.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":3346,"specSha256":"28d484fdf00f2d93fee1b1ea92e9284f5a851548bf055bfd513a6aa315d36752","branch":"refs/heads/fix/use-google-sans-fonts-on-web","head":"b98969e1a00d09d85daf9570b01cd30ac0560e7c","baseRef":"refs/heads/dev","baseCommit":"b98969e1a00d09d85daf9570b01cd30ac0560e7c","sourceTree":"519473999eadf8470dd3767f9d638dec0d175610","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. Open http://localhost:3000/sign-in. Restart `npm run dev:web` if the old
   font is still showing.
2. In DevTools, inspect the "Sign in to your account" heading, an input label,
   and the "Continue with Google" label. Under Computed → Rendered Fonts, all
   three should say Google Sans.
3. Check the weights still look right: a bold title, semibold buttons, and
   medium-weight labels.
4. Repeat on `/sign-up` and `/profile`.
