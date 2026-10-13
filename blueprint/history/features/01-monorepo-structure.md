# Feature: Monorepo structure

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** feature/monorepo-structure
**Status:** verified

## Goal

Turn this single Expo repository into the Accordly monorepo: the existing Expo
app moves to `apps/mobile` with its Git history, a new Next.js app lives in
`apps/web`, the Supabase project folder exists at `supabase/`, a small shared
package proves cross-app imports, and the Blueprint context files at the root
describe all three parts. Both apps must still build after the move.

## In scope

- npm workspaces at the root (`apps/*`, `packages/*`), one root
  `package-lock.json`.
- Move all Expo app files to `apps/mobile` with `git mv`: `app.json`, `assets/`,
  `scripts/`, `src/`, `tsconfig.json`, `package.json`, and the Expo `README.md`.
- Scaffold `apps/web` with `create-next-app` (TypeScript, Tailwind CSS, ESLint,
  App Router, `src/` directory, `@/*` alias, npm).
- `packages/shared` (`@accordly/shared`) exporting one real, plan-backed value:
  the supported languages `['en', 'fr']`, imported by both apps.
- `supabase init` at the root to create `supabase/config.toml`. No local start,
  schema, or remote project (feature 2).
- `design/references/` folder for design screenshots (tracked with `.gitkeep`).
- `.gitignore` updated for the new paths and Next.js and Supabase output.
- Blueprint context updated for the monorepo: `AGENTS.md` (What this is,
  grouped Commands), `CLAUDE.md` title, `blueprint/context/coding-standards.md`
  reorganized into shared rules plus Web, Mobile, and Backend sections, and a
  short root `README.md`.

## Out of scope

- Renaming the GitHub repository or the local folder (manual, see Notes).
- Supabase schema, `supabase start`, or creating staging/production projects (feature 2).
- Auth, translations wiring, UI, Tailwind Plus components (features 3+).
- ESLint setup for mobile, unit test runners, CI, Turborepo.
- Changing mobile app behavior or styling.

## Build loop

Config: `workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`.
Implement all steps, verifying each step's Done when before moving on, then
present one feature-level review packet. No checkpoint commits; `/complete`
creates the final feature commit.

## Build steps

- [x] 1. **Branch, workspace root, and mobile move**
  - Create `feature/monorepo-structure` from the current `dev`/`main` tip (`8e2d775`).
  - `git mv` the Expo files listed in scope into `apps/mobile/`. Rename the mobile
    package to `@accordly/mobile`. Delete the stale root `package-lock.json` and
    remove `apps/mobile/expo-env.d.ts` if present (generated, ignored).
  - Add root `package.json`: `name: "accordly"`, `private: true`,
    `workspaces: ["apps/*", "packages/*"]`.
  - Update `.gitignore`: root-level `node_modules/`, Expo paths under
    `apps/mobile/` (`.expo/`, `dist/`, `web-build/`, `expo-env.d.ts`, `/ios`,
    `/android` become `apps/mobile/...`), drop the stray `example` entry only if
    it refers to the reset script's output (keep it scoped to `apps/mobile/example`).
  - Run `npm install` at the root.
  - **Done when:** root `npm install` succeeds; `npx tsc --noEmit -p apps/mobile`
    passes; `npx expo export --platform ios` and `--platform android` succeed from
    `apps/mobile` (proves Metro resolves workspace dependencies); `npx expo-doctor`
    in `apps/mobile` reports no new monorepo errors; `git log --follow
    apps/mobile/src/app/index.tsx` shows pre-move history.

- [x] 2. **Next.js web app**
  - Run `npx create-next-app@latest apps/web --ts --tailwind --eslint --app
    --src-dir --import-alias "@/*" --use-npm --skip-install --disable-git` (or the
    equivalent non-interactive flags the current version accepts).
  - Pin `react` and `react-dom` in `apps/web` to the mobile app's exact
    version (`19.2.3`) so one React copy is hoisted; confirm `next` accepts it.
  - Run root `npm install`.
  - **Done when:** `npm run build -w apps/web` and `npm run lint -w apps/web`
    pass; `npm ls react` shows a single `react` version; the step 1 mobile
    `expo export` checks still pass.

- [x] 3. **Shared package, Supabase folder, design folder**
  - Create `packages/shared` with `package.json` (`@accordly/shared`, private,
    `main`/`types` pointing at `src/index.ts`), `tsconfig.json`, and
    `src/index.ts` exporting `SUPPORTED_LANGUAGES = ['en', 'fr'] as const` and
    its `Language` type.
  - Add `@accordly/shared` as a dependency of both apps. Web: add
    `transpilePackages: ['@accordly/shared']` to `next.config`. Import the
    constant in one existing file in each app without changing visible behavior
    beyond showing nothing new (e.g. a typed use in a type position or a
    no-UI constant reference).
  - Run `supabase init` at the root (no VS Code settings prompts accepted).
  - Create `design/references/.gitkeep`.
  - **Done when:** both apps typecheck with the shared import; `npm run build -w
    apps/web` passes; mobile `expo export --platform ios` passes;
    `supabase/config.toml` exists and `supabase/.gitignore` is present.

- [x] 4. **Context files and docs**
  - `AGENTS.md`: "What this is" describes the monorepo (apps/web, apps/mobile,
    supabase, packages/shared); Commands grouped into Root, Web, Mobile, Backend,
    each listing only commands verified in steps 1-3 (plus the existing typecheck
    and `npx expo install` notes, now run from `apps/mobile`).
  - `CLAUDE.md`: title `# Accordly`.
  - `blueprint/context/coding-standards.md`: reorganize into Shared (TypeScript,
    React, naming, comments, writing, testing, code quality, data and security
    rules incl. family-scoped RLS), Web (Next.js App Router, server components
    by default, Tailwind CSS, Tailwind Plus, Route Handlers for Stripe webhooks),
    Mobile (the existing React Native and Expo Router rules), Backend (Supabase
    migrations via CLI, RLS on every table, append-only tables). Keep Testing,
    Device/Browser verification, Comments, and Writing sections. Mark unknowns
    `> TODO` (web data-access pattern, mobile styling).
  - Root `README.md`: project name, one-line purpose, layout, and commands.
  - Root `package.json` convenience scripts only for commands documented in
    `AGENTS.md` (e.g. `dev:web`, `build:web`, `lint:web`, `start:mobile`,
    `typecheck`).
  - **Done when:** every command listed in `AGENTS.md` and the README was run
    successfully in this feature or is explicitly marked as requiring a device
    or Docker; no file references the old root `src/` or `app.json` paths;
    `grep` finds no em dashes in edited docs.

## Files / areas

- Root: `package.json` (new), `package-lock.json` (regenerated), `.gitignore`,
  `README.md` (new), `AGENTS.md`, `CLAUDE.md`
- `apps/mobile/**` (moved, plus `package.json` name and shared import)
- `apps/web/**` (new, scaffolded)
- `packages/shared/**` (new)
- `supabase/config.toml`, `supabase/.gitignore` (generated by `supabase init`)
- `design/references/.gitkeep`
- `blueprint/context/coding-standards.md`
- Unchanged: `.agents/`, `.claude/`, `blueprint/` plans and history, `.vscode/`, `LICENSE`

## Data / contracts

- Workspace package names: `accordly` (root), `@accordly/mobile`, `@accordly/web`,
  `@accordly/shared`.
- `@accordly/shared` exports `SUPPORTED_LANGUAGES: readonly ['en', 'fr']` and
  `type Language = 'en' | 'fr'`, matching the plan's bilingual requirement and
  the `profiles.language` field in the overview.
- No persisted data, API, or auth boundary is introduced.

## Testing

No test command is configured, so tests are not a gate. Evidence is the build
and bundle checks named in each step: root install, mobile typecheck, mobile
`expo export` for iOS and Android, `expo-doctor`, web build and lint, and
`npm ls react`. Running the apps on a simulator or browser is a manual check
for `/check` (`npm run dev -w apps/web`, `npm run ios -w apps/mobile`).

## Notes for the AI

- Use `git mv` for every move so history follows; never copy and delete.
- Never run a scaffolder at the root (it holds Blueprint files). `create-next-app`
  targets the empty `apps/web` only, with Git initialization disabled.
- Expo SDK 52+ configures Metro for npm workspaces automatically; do not add a
  custom `metro.config.js` unless the step 1 export fails, and record why.
- Duplicate React copies break React Native; keep one hoisted version.
- The Supabase CLI is installed via Homebrew (`/opt/homebrew/bin/supabase`); do
  not add it as an npm dependency. Docker is present but not needed here.
- Do not install dependencies beyond what `create-next-app` adds and the
  workspace link.
- `blueprint/project-plan.md` lists workspace tooling as a TODO; do not edit the
  plan. Report in the review packet that npm workspaces was chosen so the user
  can update the plan and re-run `/overview`.
- **Repository rename (manual, not part of this feature):** `gh` is not
  installed. Rename on GitHub under Settings > General > Repository name to
  `accordly`, then run `git remote set-url origin
  https://github.com/JordanNeeb/accordly.git`. Rename the local folder after
  closing AI sessions, since tools key their state to the folder path.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9172,"specSha256":"37c31bd76216355a5e379e27a7577dddab7f9edff3696660cf9bd437b13ee7ec","branch":"refs/heads/feature/monorepo-structure","head":"8e2d7756bb6d6b5cab66cb54b543d65fef21418f","baseRef":"refs/heads/main","baseCommit":"8e2d7756bb6d6b5cab66cb54b543d65fef21418f","sourceTree":"bd34544e3ce48bae9e98c1e9fbff68d60f50126a","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. From the repo root, run `npm run dev:web` and open http://localhost:3000. Expect the default Next.js starter page.
2. Stop it, then run `npm run ios` (or `npm run android`). Expect the existing Expo starter app on the simulator, unchanged from before the move.
