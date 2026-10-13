# Coding Standards

> Conventions for the Accordly monorepo: `apps/web` (Next.js), `apps/mobile`
> (Expo), `packages/shared`, and `supabase/`. Shared rules apply everywhere;
> app sections apply only inside that app. Commands live in `AGENTS.md`.

# Shared

## TypeScript

- Strict mode in every workspace
- No `any` types - use proper typing or `unknown`
- Define types for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful
- Inside an app, import from its `src/` with the `@/` alias, not long relative paths
- Use `import { type X }` or `import type` for type-only imports

## Monorepo

- npm workspaces: `@accordly/web`, `@accordly/mobile`, `@accordly/shared`
- Code needed by both apps (types, validation, business rules such as allowance
  math and expense splits, translations) goes in `packages/shared`. Keep it free
  of React Native, Next.js, and DOM imports so both apps can consume it.
- Don't move code into `packages/shared` until a second consumer exists or the
  plan names it as shared.
- One React version across the repo (currently pinned to mobile's `19.2.3`);
  React Native breaks with duplicate copies. Check with `npm ls react` after
  dependency changes.
- Add dependencies to the workspace that uses them (`-w <workspace>`), never the root.

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks
- Prefer named exports, except where the framework requires a default export
  (Next.js pages and layouts, Expo Router routes)

## Naming

- Files: kebab-case (`themed-text.tsx`, `use-theme.ts`); framework-reserved
  names stay as required (`page.tsx`, `layout.tsx`, `_layout.tsx`)
- Components: PascalCase
- Hooks: camelCase with a `use` prefix
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE for true constants; PascalCase objects for theme tokens
- Types/Interfaces: PascalCase (no prefix)

## Data, Security, and Errors

- Parents may act against each other. Every family-owned record is scoped to
  family membership and enforced in the database with row-level security, not
  only in the UI.
- Never trust a client-supplied user id or family id for authorization; derive
  the actor from the authenticated Supabase session.
- Messages, agreement versions, requests, payment history, and the activity log
  are append-only: no edits or deletes of content.
- Timestamps that matter for the record are set by the server, never the device.
- Validate all external input (form data, route params, deep links, webhooks,
  API responses) at the boundary.
- Secrets never reach a client bundle. Only `NEXT_PUBLIC_` (web) and
  `EXPO_PUBLIC_` (mobile) variables are public, and anything public is visible
  to every user.
- Every user-facing string exists in English and French.
- Wrap async work in try/catch and show a user-friendly message, not a raw error.
- Handle loading, empty, error, and offline states for anything that fetches data.

> TODO: data-access pattern (Supabase client usage per app, validation library)
> is decided in features 2-3. Record it here then.

## Accessibility

- Every interactive element has an accessible name when its purpose isn't clear
  from visible text
- Meaningful images and icons have labels; decorative ones are hidden from
  assistive technology
- Text respects the user's font size settings

# Web (`apps/web`)

## Next.js

- Next.js 16 with the App Router. This version differs from older training
  data: read the relevant guide in `apps/web/node_modules/next/dist/docs/` (or
  `node_modules/next/dist/docs/` at the root when hoisted) before writing
  Next.js code, as `apps/web/AGENTS.md` notes.
- Server components by default; add `'use client'` only for interactivity,
  hooks, or browser APIs
- Stripe webhooks and other external callbacks use Route Handlers
- `@accordly/shared` is compiled through `transpilePackages` in `next.config.ts`

## Web file organization

- Routes: `src/app/[route]/page.tsx`
- Components: `src/components/[feature]/component-name.tsx`
- Lib/Utils: `src/lib/[utility].ts`

## Web styling

- Tailwind CSS v4 for all styling (CSS-first config in `src/app/globals.css`)
- Use Tailwind Plus components where one fits; colours, logo, and branding are
  set by the project owner
- No inline styles
- Design screenshots live in `design/references/`; check them before building UI

# Mobile (`apps/mobile`)

## React Native

- The React Compiler is enabled: don't add `useMemo`, `useCallback`, or `memo`
  for routine memoization, and keep components and hooks pure
- Use React Native primitives (`View`, `Text`, `Pressable`), never DOM elements
- All text must be inside a `Text` component
- Use `Pressable` for touch targets, not the legacy `Touchable*` components
- Use `FlatList` / `SectionList` for long or unbounded lists, never `.map()` inside a `ScrollView`
- Use `expo-image` for images instead of the core `Image` component
- Respect safe areas with `react-native-safe-area-context`; don't hardcode notch or status bar offsets
- Use `react-native-reanimated` for animations and `react-native-gesture-handler` for gestures
- Prefer an Expo SDK module (`expo-*`) over a third-party native library when one exists;
  install with `npx expo install` (in `apps/mobile`) so versions match the SDK
- Platform differences go in platform-specific files (`component.ios.tsx`,
  `component.android.tsx`) when they diverge substantially; use `Platform.select`
  or `Platform.OS` for small differences
- Targets iOS and Android; the web build is not a product target (web is `apps/web`)

## Expo Router

- File-based routes live in `src/app/`; keep route files thin and compose screens from components
- Layouts go in `_layout.tsx`; group routes with `(group)` folders when they share a layout
- Typed routes are enabled: navigate with `Link` or `router` using typed hrefs, not string building
- Read params with `useLocalSearchParams` and validate them before use; route params are untrusted strings
- Deep links use the `accordlymobile://` scheme; any screen reachable by a link must handle missing or invalid params
- Use an Expo Router `ErrorBoundary` export for screens that can fail to render

## Mobile file organization

- Routes: `src/app/[route].tsx`, `src/app/[group]/_layout.tsx`
- Components: `src/components/[feature]/component-name.tsx`
- Shared UI primitives: `src/components/ui/`
- Hooks: `src/hooks/use-thing.ts`
- Constants and theme: `src/constants/`
- Static assets: `assets/` (imported via `@/assets/*`)

## Mobile styling

- Current code uses `StyleSheet.create` with theme tokens from
  `src/constants/theme.ts` (`useTheme()`, `Colors`); never hardcode colors
- Support both light and dark mode (`userInterfaceStyle: automatic`)
- Touch targets are at least 44x44 points (use `hitSlop` for small icons)

> TODO: mobile styling library (NativeWind likely) is decided in the mobile phase.

## Mobile data

- Store secrets and tokens with `expo-secure-store`, never AsyncStorage or source code

# Backend (`supabase/`)

- Supabase in `ca-central-1`; local development through the Supabase CLI
- Every schema change is a migration in `supabase/migrations/`, created with the
  CLI; never edit the remote database by hand
- Enable row-level security on every table, with policies scoped through family
  membership
- Append-only tables deny `UPDATE` and `DELETE` of content at the database level
- Money is stored as integer cents (CAD)

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, data mappers, custom hooks
  with non-trivial logic. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (screens,
  navigation, anything driving a real device or external service). Verify those
  with a simulator screenshot and a successful bundle, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live next to source files (for example `feature.test.ts`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding: mobile uses Jest with the `jest-expo` preset (Expo's supported setup),
`jest.mock()` for native modules and external services, and
`jest.useFakeTimers()` for time-dependent logic. Use React Native Testing Library
only if component tests are later added deliberately. Web and `packages/shared`
runners are chosen when `/tests` runs (TODO).

## Device and Browser Verification

For UI and integration behavior, prefer real evidence from a running app over
reading the code and assuming it works.

- Web: verify in a browser against `npm run dev:web`.
- Mobile: verify on the iOS Simulator or Android Emulator (`npm run ios` / `npm run android`).
  Check both platforms when a change touches platform-specific code, gestures,
  safe areas, keyboards, or native modules.
- End-to-end automation is separately opt-in through `/tests browser`. For native
  flows, prefer Maestro; use Playwright for `apps/web`. Document the exact
  command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity or behavior on a platform it
  did not run on.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use browser or simulator screenshots, Metro and device
  logs, `npm run typecheck`, build and lint output, or manual evidence instead.
- Device evidence is especially important for flows that tap, type, scroll,
  navigate, handle the keyboard, request permissions, or depend on client-side state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
