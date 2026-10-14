# Fix: Move Logo to common and hard-code Tango

**Type:** Fix
**Status:** verified
**Branch:** fix/move-logo-to-common-and-hard-code-tango

## The problem

- `Logo` lives at `apps/web/src/components/logo.tsx`. The coding standards
  place components under `src/components/[feature]/`, and the logo is shared
  rather than belonging to one feature.
- The logo text comes from `AuthMessages.appName` in
  `apps/web/src/lib/auth/messages.ts`. The brand name is not an auth string and
  will never be translated (user, 2026-10-14). `appName` is used only by
  `Logo`.

## The fix

- Move `components/logo.tsx` to `components/common/logo.tsx` with `git mv`, so
  history follows the file. Update the two imports in `auth-card.tsx` and
  `profile/page.tsx` to `@/components/common/logo`.
- In `Logo`, render the hard-coded text `Tango` and drop the `AuthMessages`
  import. Update its comment to say that the brand name is not translated.
- Remove `appName` from `AuthMessages`. Nothing else uses it.
- Unchanged:
  - `"New to Tango?"` stays in `AuthMessages.signIn.noAccount`, because it is a
    translatable sentence that happens to contain the name.
  - The tab title in `layout.tsx` is already hard-coded as Tango.
  - The logo's styling and font are unchanged.
- Add `common` to the web file organisation in `coding-standards.md` as the
  folder for components shared across features, so later work follows it.

## Build steps

- [x] 1. **Move Logo and hard-code the name**
  - **Evidence (2026-10-14):** `git mv` moved the file (Git records it as a rename).
    typecheck, lint, and build pass, and `rg appName apps/web/src` finds nothing.
    On the dev server, `/sign-in`, `/sign-up`, and `/forgot-password` render
    "Tango" with the same Momo Signature class and `text-lg` styling.
    `/profile` also renders it, signed in by confirming
    `rename-1792018850@test.dev` through its Mailpit link and then signing out.
  - Create `fix/move-logo-to-common-and-hard-code-tango` from `dev`.
  - Make the changes above.
  - **Done when:**
    - `npm run typecheck`, `npm run lint:web`, and `npm run build:web` pass.
    - `rg appName apps/web/src` finds nothing.
    - `components/logo.tsx` no longer exists, and `components/common/logo.tsx`
      does.
    - `/sign-in`, `/forgot-password`, and signed-in `/profile` still render the
      "Tango" logo in Momo Signature.

## Verify

Open http://localhost:3000/sign-in and `/profile` (signed in). The "Tango" logo
looks exactly as before.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":2490,"specSha256":"7ad5d8ad95e4694e554d8889bb656054efc2e443185957265013e120b6099f38","branch":"refs/heads/fix/move-logo-to-common-and-hard-code-tango","head":"51f933c3f34e5b790d767ef7750dda2a60010564","baseRef":"refs/heads/dev","baseCommit":"51f933c3f34e5b790d767ef7750dda2a60010564","sourceTree":"de72a7c1cedb9446316bb2fd0e129a36fd4446d4","landing":"local-merge","absentOptional":[]} -->

## Try it now

Open http://localhost:3000/sign-in and `/profile` (signed in). The "Tango"
logo looks exactly as before.
