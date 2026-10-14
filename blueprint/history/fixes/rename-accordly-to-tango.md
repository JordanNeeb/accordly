# Fix: Rename Accordly to Tango

**Type:** Fix
**Status:** verified
**Branch:** fix/rename-accordly-to-tango

## The problem

The company name has changed from Accordly to Tango (user, 2026-10-14). The
user wants everything renamed, including the local directory and the GitHub
repository. The name currently appears in:

| Area | Where |
|---|---|
| UI text | `lib/auth/messages.ts` (`appName`, which is already `"Tango"` as an uncommitted user edit, and `"New to Accordly?"`); `app/layout.tsx` (tab title `"Accordly"` / `"%s \| Accordly"`); a comment in `components/logo.tsx` |
| Auth emails | `supabase/config.toml` subjects; `supabase/templates/confirmation.html` and `recovery.html` |
| Packages | root `package.json` (`"accordly"` and the `-w @accordly/*` scripts); `@accordly/web`, `@accordly/mobile`, `@accordly/shared`; their dependency entries; `next.config.ts` `transpilePackages`; imports in `layout.tsx` and `lib/supabase/server.ts`; `package-lock.json` |
| Mobile | `apps/mobile/app.json`: `name` and `slug` (`accordly-mobile`) and `scheme` (`accordlymobile`) |
| Local Supabase | `supabase/config.toml` `project_id = "accordly"`, which names the local Docker containers and volumes |
| Docs | `AGENTS.md`, `CLAUDE.md`, `README.md`, `blueprint/context/coding-standards.md` |
| Plans | `blueprint/project-plan.md`, `blueprint/build-plan.md` (feature 12 line), `blueprint/context/project-overview.md`, including the planned `settlement` value `'outside_accordly'` |
| Outside the repo | the GitHub repo `JordanNeeb/accordly`; the local folder `.../code-stuff/accordly`; this project's Claude memory folder, which is keyed to the folder path |

## The fix

- Replace "Accordly" with "Tango" and "accordly" with "tango" in every place in
  the table above. Lowercase identifiers become:
  - packages `@tango/web`, `@tango/mobile`, `@tango/shared`, and root `tango`
  - Expo `tango-mobile`, with scheme `tangomobile`
  - Supabase `project_id = "tango"`
  - settlement value `'outside_tango'`
- Keep the user's uncommitted `messages.ts` edit (`appName: "Tango"` and its
  line wrapping) as part of this fix.
- Keep immutable history unchanged. `blueprint/history/**` archives record what
  shipped under the old name, and rewriting them would break their completion
  hashes. Git history is not rewritten either.
- Plans: edit `project-plan.md` and `build-plan.md` only for the name. Apply the
  same edits to `project-overview.md`, then recompute its
  `blueprint:source-hash` using `/overview`'s contract, so the plans and the
  overview stay in sync without a full regeneration.
- Packages: after renaming, run `npm install` to regenerate `package-lock.json`
  and the `node_modules/@tango/*` workspace links. Remove the stale
  `node_modules/@accordly` links.
- Local Supabase: the stack must be stopped *before* `project_id` changes,
  because the CLI finds containers by that ID. After the change, `start` creates
  new `tango` containers with an **empty local database**. Then
  `db reset` applies the migrations and the types are regenerated. Local test
  accounts (including the `check-…@test.dev` account and your unconfirmed
  Gmail account) do not carry over. The old `accordly` Docker volumes stay on
  disk until you remove them.
- Not part of the code change, but needed for "everything":
  - **GitHub repo:** `gh` is not installed, so you rename it in GitHub →
    Settings → Repository name → `tango`. GitHub redirects the old URL. Then
    `git remote set-url origin https://github.com/JordanNeeb/tango.git`. The
    agent runs that last command only after you confirm the rename.
  - **Local folder:** rename `code-stuff/accordly` to `code-stuff/tango` **after
    this session ends**, because renaming the working folder mid-session breaks
    it. Optionally copy this project's Claude memory folder
    (`~/.claude/projects/-Users-jordanneeb-Documents-code-stuff-accordly/memory/`)
    to the new path's folder so the notes carry over.
  - **Your own accounts (no repo changes):** the Google OAuth consent screen app
    name, the staging Supabase project display name (`accordly-staging`; its
    project ref does not change), and any Vercel or EAS projects created later.
- Out of scope: reorganising `AuthMessages` (moving `appName` and profile text
  out of auth). That stays a separate `/fix`.

## Build steps

- [x] 1. **Rename in code, config, and docs**
  - **Evidence (2026-10-14):** 20 files renamed (49 occurrences). `rg -i accordly`
    outside history, `node_modules`, `.next`, and the spec finds nothing. The
    overview source-hash was recomputed (`368484a1…` to `79109a89…`).
    `npm install` relinked `node_modules/@tango/{web,mobile,shared}`, and the
    lockfile diff is name-only (19 lines). typecheck, lint, and build pass, and
    `npx expo export --platform ios` bundles.
  - Create `fix/rename-accordly-to-tango` from `dev`, carrying the uncommitted
    `messages.ts` edit.
  - Stop the local Supabase stack (`npx supabase@latest stop`) before editing
    `config.toml`.
  - Apply every rename in the table except the outside-the-repo rows and
    `blueprint/history/**`. Recompute the overview source-hash. Run
    `npm install`.
  - **Done when:**
    - `rg -i accordly` outside `blueprint/history/`, `node_modules`, and
      `.next` finds nothing.
    - `npm run typecheck`, `npm run lint:web`, and `npm run build:web` pass.
    - `npx expo export --platform ios` (in `apps/mobile`) bundles.
    - `node_modules/@tango/{web,mobile,shared}` link to the workspaces.

- [x] 2. **Recreate the local Supabase stack as `tango`**
  - **Evidence (2026-10-14):**
    - `start` on the new `tango` project created an empty database and applied
      all 3 migrations, so `db reset` would have been identical and was not run.
    - Regenerated types are byte-identical to `database.types.ts`.
    - `docker ps` shows only `supabase_*_tango` containers.
    - The local publishable key is unchanged, so `apps/web/.env.local` still
      works.
    - Auth settings: `google: true`, `mailer_autoconfirm: false`.
    - The running dev server (no restart needed) serves `/sign-in` with title
      "Sign in | Tango", logo text "Tango", and "New to Tango?".
    - A no-JS sign-up for `rename-1792018850@test.dev` delivered "Confirm your
      Tango account" to Mailpit.
  - `npx supabase@latest start`, then `npx supabase@latest db reset`, then
    regenerate `packages/shared/src/database.types.ts`. It should be unchanged
    apart from generator noise.
  - **Done when:**
    - `docker ps` shows `supabase_*_tango` containers and no running
      `*_accordly` ones.
    - The Auth settings endpoint shows email confirmation on and Google enabled.
    - With `npm run dev:web` restarted, `/sign-in` shows the Tango logo and the
      tab title "Sign in | Tango". Sign-up sends a "Confirm your Tango account"
      email to Mailpit.

## After `/complete` (outside the repo)

These are follow-ups, not build steps, because they happen after the code
lands:

- You rename the GitHub repository to `tango` (GitHub → Settings → Repository
  name). After you confirm, the agent runs
  `git remote set-url origin https://github.com/JordanNeeb/tango.git` and checks
  it with `git ls-remote origin`.
- You rename the local folder after the session ends, and optionally copy the
  Claude memory folder.
- You update your own accounts: the Google OAuth consent screen name and the
  staging Supabase display name.

## Verify

- `rg -i accordly -g '!blueprint/history/**' -g '!node_modules' -g '!**/.next/**'`
  returns nothing.
- http://localhost:3000/sign-in shows "Tango" as the logo, "New to Tango?", and
  the tab title "Sign in | Tango".
- Sign up with a new address. The Mailpit email is titled "Confirm your Tango
  account".
- After the follow-up: `git remote -v` points at `JordanNeeb/tango.git`.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":7855,"specSha256":"041874265d36ab681b7e25ac5fe5653bbc96a763f60aee8615526be665dd608a","branch":"refs/heads/fix/rename-accordly-to-tango","head":"927e983840b26788e14f42054645e560eff89d07","baseRef":"refs/heads/dev","baseCommit":"927e983840b26788e14f42054645e560eff89d07","sourceTree":"23a8c6c35bad35c52523959134f3bb410ed0d98d","landing":"local-merge","absentOptional":[]} -->

## Try it now

1. Open http://localhost:3000/sign-in. The tab reads "Sign in | Tango", the
   logo says "Tango", and the footer says "New to Tango?".
2. Sign up with a new address and open Mailpit (http://127.0.0.1:54324). The
   email is titled "Confirm your Tango account".
3. After the follow-ups: `git remote -v` points at `JordanNeeb/tango.git`, and
   the project folder is `code-stuff/tango`.
