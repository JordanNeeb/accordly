# Fix: Reduce top padding on pricing section

**Type:** Fix
**Status:** verified
**Branch:** fix/reduce-top-padding-on-pricing-section

## The problem

On `/pricing`, the pricing `form` in
`apps/web/src/components/pricing/pricing-tiers.tsx:37` uses the reference's
`py-24 sm:py-32` (96px, or 128px from `sm` up) below a header that already has
`pt-10`. That leaves a large gap between the logo and the "Pricing" eyebrow.

## The fix

Split the vertical padding so only the top shrinks: `py-24 sm:py-32` becomes
`pt-12 pb-24 sm:pt-16 sm:pb-32` (48px and 64px top; bottom unchanged). Nothing
else changes. The `/get-started` screen has the same padding but is out of scope.

## Build steps

- [x] **1. Reduce the top padding.** Change the form's padding classes as above.
  - Done when: `/pricing` shows a visibly smaller gap between the logo and the
    eyebrow at phone and desktop widths, the bottom spacing is unchanged, and
    `npm run lint:web` and `npm run build:web` pass.

## Verify

Open http://localhost:3000/pricing with `npm run dev:web` running. The
"Pricing" eyebrow and title should sit noticeably closer to the logo than
before, at both phone and desktop widths.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":1179,"specSha256":"8883823d2e6c619638e2baffcd931760db58ca8ee6e0200c4e5bcaf34eb8f4da","branch":"refs/heads/fix/reduce-top-padding-on-pricing-section","head":"859dfa0f4d2238624748050a4860b29a85c24ca2","baseRef":"refs/heads/dev","baseCommit":"859dfa0f4d2238624748050a4860b29a85c24ca2","sourceTree":"08b69cb13c6f5336244eb13d4137396e356ec75a","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

With `npm run dev:web` running, open http://localhost:3000/pricing.

Expected:

The "Pricing" eyebrow sits about 64px below the logo on desktop (48px on phones) instead of 128px, and the space below the tier cards is unchanged.

This proves:

The smaller top padding, with the bottom padding unchanged.
