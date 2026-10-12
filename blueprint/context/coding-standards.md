# Coding Standards

> Conventions for this Expo (React Native) + TypeScript app using Expo Router.
> Targets iOS, Android, and web via `react-native-web`. Review and adjust as the
> project grows.

## TypeScript

- Strict mode enabled (extends `expo/tsconfig.base`)
- No `any` types - use proper typing or `unknown`
- Define types for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful
- Import from `src/` with the `@/` alias (`@/components/themed-text`), not long relative paths
- Use `import { type X }` for type-only imports

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks in `src/hooks/`
- Prefer named exports; route files use the default export Expo Router requires
- The React Compiler is enabled: don't add `useMemo`, `useCallback`, or `memo`
  for routine memoization, and keep components and hooks pure so the compiler can
  optimize them

## React Native

- Use React Native primitives (`View`, `Text`, `Pressable`), never DOM elements
- All text must be inside a `Text` component
- Use `Pressable` for touch targets, not the legacy `Touchable*` components
- Use `FlatList` / `SectionList` for long or unbounded lists, never `.map()` inside a `ScrollView`
- Use `expo-image` for images instead of the core `Image` component
- Respect safe areas with `react-native-safe-area-context`; don't hardcode notch or status bar offsets
- Use `react-native-reanimated` for animations and `react-native-gesture-handler` for gestures
- Prefer an Expo SDK module (`expo-*`) over a third-party native library when one exists;
  install with `npx expo install` so versions match the SDK
- Platform differences go in platform-specific files (`component.web.tsx`,
  `component.ios.tsx`) when they diverge substantially; use `Platform.select` or
  `Platform.OS` for small differences
- Keep any feature working on iOS and Android; web support is best effort unless a spec says otherwise

## Expo Router

- File-based routes live in `src/app/`; keep route files thin and compose screens from components
- Layouts go in `_layout.tsx`; group routes with `(group)` folders when they share a layout
- Typed routes are enabled: navigate with `Link` or `router` using typed hrefs, not string building
- Read params with `useLocalSearchParams` and validate them before use; route params are untrusted strings
- Deep links use the `accordlymobile://` scheme; any screen reachable by a link must handle missing or invalid params

## File Organization

- Routes: `src/app/[route].tsx`, `src/app/[group]/_layout.tsx`
- Components: `src/components/[feature]/component-name.tsx`
- Shared UI primitives: `src/components/ui/`
- Hooks: `src/hooks/use-thing.ts`
- Constants and theme: `src/constants/`
- Types: `src/types/[feature].ts`
- Lib/Utils: `src/lib/[utility].ts`
- Static assets: `assets/` (imported via `@/assets/*`)

## Naming

- Files: kebab-case (`themed-text.tsx`, `use-theme.ts`)
- Components: PascalCase (`ThemedText`)
- Hooks: camelCase with a `use` prefix (`useTheme`)
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE for true constants; PascalCase objects for theme tokens (`Colors`, `Fonts`)
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Use `StyleSheet.create` at the bottom of the component file
- Pull colors from the theme (`useTheme()` and `Colors` in `src/constants/theme.ts`); never hardcode colors in components
- Support both light and dark mode (`userInterfaceStyle: automatic`)
- Use the shared themed components (`ThemedText`, `ThemedView`) before creating new primitives
- Inline style objects only for values computed at render time (theme colors, dynamic sizes)
- Use spacing and font tokens from `src/constants/theme.ts` rather than magic numbers when a token exists

## Accessibility

- Every interactive element has an `accessibilityRole` and an `accessibilityLabel` when its purpose isn't clear from visible text
- Touch targets are at least 44x44 points (use `hitSlop` for small icons)
- Text respects the system font size; don't disable font scaling without a reason
- Icon-only and image elements that convey meaning need labels; decorative ones are hidden from screen readers

## Data and State

- Keep state local first; lift it or add a shared store only when a current requirement needs it
- Validate all external input (API responses, route params, deep links, stored data) at the boundary
- Never trust a client-supplied user id for authorization; the server owns access control
- Store secrets and tokens with `expo-secure-store`, never AsyncStorage or source code
- Only `EXPO_PUBLIC_` env vars reach the app bundle, and anything in the bundle is public

## Error Handling

- Wrap async work in try/catch and surface a user-friendly message, not a raw error
- Handle loading, empty, error, and offline states for any screen that fetches data
- Use an Expo Router `ErrorBoundary` export for screens that can fail to render

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

Stack binding: use Jest with the `jest-expo` preset (Expo's supported setup),
`jest.mock()` for native modules and external services, and
`jest.useFakeTimers()` for time-dependent logic. Use React Native Testing Library
only if component tests are later added deliberately.

## Device Verification

For UI and integration behavior, prefer real evidence from a running app over
reading the code and assuming it works.

- Verify on the iOS Simulator or Android Emulator (`npm run ios` / `npm run android`).
  Check both platforms when a change touches platform-specific code, gestures,
  safe areas, keyboards, or native modules.
- The web target (`npm run web`) is useful for quick checks but does not prove
  native behavior.
- End-to-end automation is separately opt-in through `/tests browser`. For native
  flows, prefer Maestro; Playwright only covers the web target. Document the exact
  command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity or behavior on a platform it
  did not run on.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use simulator screenshots, Metro and device
  logs, `npx tsc --noEmit`, lint output, or manual evidence instead.
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
