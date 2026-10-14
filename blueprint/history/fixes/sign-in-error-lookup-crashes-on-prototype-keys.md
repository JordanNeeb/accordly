# Fix: Sign-in error lookup crashes on prototype keys

**Type:** Fix
**Status:** verified
**Branch:** fix/sign-in-error-lookup-crashes-on-prototype-keys
**Fixes:** F-08

## The problem

`apps/web/src/app/(auth)/sign-in/page.tsx` maps the `?error=` query value to a
message with a plain-object lookup, `URL_ERRORS[error]`. A value that names an
inherited `Object.prototype` member, such as `constructor`, `toString`, or
`__proto__`, returns a function or object instead of `undefined`. That value is
truthy, so it is passed as the `error` prop to the client `FormAlert`, and the
signed-out sign-in page fails to render.

This was reproduced on 2026-10-14. `/sign-in?error=constructor` returns a
response containing "Functions cannot be passed directly to Client Components".
Anyone who follows such a link gets a broken sign-in page. No text can be
injected.

## The fix

- In `LinkNotice`, accept only the map's own keys:
  `typeof error === "string" && Object.hasOwn(URL_ERRORS, error) ? URL_ERRORS[error] : undefined`.
- Keep the existing contract: only known codes map to text, the URL never
  supplies text, and both known codes keep their messages.
- No other changes. F-03, the same class of bug in the profile notice lookup,
  is out of scope and stays open.

## Build steps

- [x] 1. **Guard the error lookup**
  - Create `fix/sign-in-error-lookup-crashes-on-prototype-keys` from `dev`.
  - Apply the `Object.hasOwn` guard in `apps/web/src/app/(auth)/sign-in/page.tsx`.
  - **Done when:** `npm run typecheck`, `npm run lint:web`, and
    `npm run build:web` pass. Against the running dev server:
    - `/sign-in?error=constructor`, `?error=toString`, and `?error=__proto__`
      render the normal sign-in page with no alert and no "Functions cannot be
      passed" error in the response.
    - `?error=link-invalid` and `?error=google-failed` still show their
      messages.
    - `?error=unknown` and no `error` param show no alert.

## Verify

Run the curl checks from the Done when against http://localhost:3000.
Optionally open `/sign-in?error=constructor` in a browser and confirm the page
renders normally.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":2124,"specSha256":"a3de243c1f3282634dd311cc552e272d0162c2a0b620058028c58634471f0a8d","branch":"refs/heads/fix/sign-in-error-lookup-crashes-on-prototype-keys","head":"05aad1376f9d50212fc528fc4d147871605ce051","baseRef":"refs/heads/dev","baseCommit":"05aad1376f9d50212fc528fc4d147871605ce051","sourceTree":"40ac1490fa7ae4e4a4fc403068822d1eb6f5bc1c","landing":"local-merge","absentOptional":[]} -->

## Findings

### sign-in-error-lookup-crashes-on-prototype-keys/F-08 [P2] closed - Sign-in error lookup crashes on Object.prototype keys

**File:** apps/web/src/app/(auth)/sign-in/page.tsx:22
**Found:** 2026-10-14 by /audit independent (scope: current; lens: security, quality)
**Why it matters:** This feature replaced the safe `error !== "link-invalid"` check with a plain-object lookup `URL_ERRORS[error]`. `/sign-in?error=constructor` (or `toString`, `__proto__`) returns a function or object, which is truthy and is passed as the `error` prop to the client `FormAlert`. Confirmed against the dev server: the response carries "Functions cannot be passed directly to Client Components" with an error digest, so the signed-out sign-in page fails to render for anyone following such a link. No text injection is possible. It is the same defect class as F-03, newly introduced on an unauthenticated page.
**Suggested fix:** Guard the lookup with `Object.hasOwn(URL_ERRORS, error)` (or use a `Map`). No current requirement is lost.
**Resolution:** Fixed 2026-10-14 on `fix/sign-in-error-lookup-crashes-on-prototype-keys`: `LinkNotice` now guards the lookup with `Object.hasOwn(URL_ERRORS, error)`. `constructor`, `toString`, and `__proto__` render the normal page; known codes keep their messages. Closed 2026-10-14 by /audit (scope: current; lenses: all). The re-review of `sign-in/page.tsx` confirmed that `Object.hasOwn` rejects inherited keys (`__proto__`, `constructor`, and `toString` all return false). It runs server-side in Node, so `target: ES2017` does not matter. Typecheck and lint pass, and live curls render a normal page for prototype keys while the known codes keep their messages. No new defect was introduced.
