# Feature: Professional home

**From build-plan:** feature 31b
**Build attempt:** 1
**Branch:** feature/professional-home

## Goal

`/dashboard` renders one of two separate dashboards: the parent portal
(`ParentDashboard`) or the professional portal (`ProfessionalDashboard`). A
professional sees a placeholder home explaining that parents will invite them,
until the professional portal (28) exists. Every professional also
gets a professional account record, created by the database when their account
type becomes `professional`. There are no professional types: all professionals
are the same. Parents see the dashboard exactly as today.

## Design reference

- Shell: the existing `DashboardShell` (dark Tailwind Plus application shell),
  unchanged apart from rendering page content in `<main>`.
- Content: Catalyst `heading.tsx` and `text.tsx`, copied from
  `design/references/tailwind-plus/catalyst-ui-kit/typescript/`.

## In scope

- New `public.professional_accounts` table: one row per professional, created
  by a database trigger whenever a profile's `account_type` becomes
  `professional` (email sign-up trigger or Google's `set_account_type`), plus a
  backfill for professionals who already exist.
- `/dashboard` reads the signed-in user's `profiles.account_type`:
  `professional` renders the placeholder home; `parent` or null renders today's
  dashboard, unchanged.
- Loading and unexpected-error states for the read.
- English and French copy.

## Out of scope

- A separate professional route. The professional home is `/dashboard`.
- Professional types or any onboarding question for professionals (per the
  owner, 2026-10-16).
- Invitations, grants, family lists, and anything else from the professional
  portal (28). The placeholder shows no families because none can exist yet.
- Replacing the parent dashboard's placeholder sidebar items (Team, Projects,
  and so on) with real parent navigation.
- Accounts with a null type (a new Google account from the sign-in page) keep
  the parent dashboard.
- Mobile.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`:
implement all steps, verifying each one's Done when, then present one review
packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] **1. Schema.** New migration (`npx supabase@latest migration new professional_accounts`):
  - `create table public.professional_accounts (user_id uuid primary key references public.profiles (id) on delete restrict, created_at timestamptz not null default now())`.
  - Enable RLS. Policy "Professionals can read their own account":
    `for select to authenticated using (user_id = (select auth.uid()))`.
  - `revoke all on public.professional_accounts from anon, authenticated`;
    `grant select on public.professional_accounts to authenticated`. Clients
    never insert, update, or delete.
  - `public.handle_professional_account()`, `security definer`,
    `search_path = ''`: inserts `new.id` with `on conflict do nothing`. Trigger
    `on_profile_professional` `after insert or update of account_type on public.profiles`
    `for each row when (new.account_type = 'professional')`. Revoke execute
    from `public, anon, authenticated`.
  - Backfill: insert every existing `professional` profile, `on conflict do nothing`.
  - Apply with `npx supabase@latest migration up` (keeps local data), then
    `npx supabase@latest db lint`, then regenerate
    `packages/shared/src/database.types.ts`.
  - Done when: lint passes; existing professionals have rows; inserting a
    professional profile and setting a null type to `professional` through
    `set_account_type` each create one row; a parent gets none; as an
    authenticated user, insert, update, and delete are denied and only their
    own row is readable.
- [x] **2. Catalyst components.** Copy `heading.tsx` and `text.tsx` into
  `apps/web/src/components/catalyst/`, unchanged except for import paths
  (`text.tsx` imports the existing `link.tsx`).
  - Done when: `npm run typecheck` and `npm run lint:web` pass.
- [x] **3. Parent and professional dashboards.** Two separate components,
  per the owner: `ParentDashboard` (the parent portal) and
  `ProfessionalDashboard` (the professional portal), both on `/dashboard`.
  - `DashboardShell` keeps only what both share (logo, search and notification
    placeholders, user menu, Settings, sign out). It takes `navigation`,
    optional `teams`, and optional `children`, and exports the
    `NavigationItem` and `TeamItem` types.
  - `components/dashboard/parent-dashboard.tsx` (client): today's placeholder
    navigation and teams, moved out of the shell, and no content. Looks exactly
    as before.
  - `components/dashboard/professional-dashboard.tsx` (client): a single
    Dashboard navigation item, no teams, and the home screen rendered directly
    inside the shell (no separate home component, per the owner).
  - `dashboard/page.tsx`: select `name, account_type`; `professional` renders
    `ProfessionalDashboard`, anything else `ParentDashboard`. The `Suspense`
    fallback and a failed profile read render the bare shell
    (`navigation={[]}`), the error case with the `auth.errors.unexpected` alert,
    instead of guessing the type.
  - The professional home screen: Catalyst `Heading` (h2)
    welcome with the user's name (email fallback) and `Subheading` (h3) plus
    `Text` empty state, in a panel with explicit light and dark surfaces,
    because the dashboard is always dark but Catalyst follows the OS theme.
  - Add `dashboard.professional` copy to `en.ts` and `fr.ts`.
  - Done when: a professional sees the professional dashboard (one nav item,
    the home) at `/dashboard` in both languages; a parent's dashboard looks as
    before; the home stacks at phone width and reads correctly with the OS in
    light and dark; `npm run typecheck`, `npm run lint:web`, and
    `npm run build:web` pass.

- [x] **4. Repair F-10.** The welcome line inserts the name with a replacer
  function (`replace("{name}", () => userName)`), so `$` patterns in a name are
  shown literally.
  - Done when: `"Welcome, {name}".replace("{name}", () => "Ana $& Lee")` gives
    `Welcome, Ana $& Lee` (checked with Node); typecheck, lint, and build pass.
  - Fixes: F-10

## Files / areas

- `supabase/migrations/<timestamp>_professional_accounts.sql` - new
- `packages/shared/src/database.types.ts` - regenerated
- `packages/shared/src/i18n/en.ts`, `fr.ts` - `dashboard.professional` copy
- `apps/web/src/components/catalyst/heading.tsx`, `text.tsx` - new copies
- `apps/web/src/components/dashboard/dashboard-shell.tsx` - shared shell; `navigation`, `teams`, `children`
- `apps/web/src/components/dashboard/parent-dashboard.tsx` - new
- `apps/web/src/components/dashboard/professional-dashboard.tsx` - new
- `apps/web/src/app/[lang]/dashboard/page.tsx` - picks the dashboard by account type

## Data / contracts

- **`professional_accounts`**: `user_id` (`uuid`, primary key, references
  `profiles.id`), `created_at` (`timestamptz`, server default). Exactly one row
  per profile whose `account_type` is `professional`, written only by the
  trigger and the backfill. It is the anchor later grants (28) reference.
- **Name:** stays on `profiles.name`, editable on `/profile`; not copied here.
- **Plan drift:** the project plan and overview still say professionals choose
  a professional type and list `name` and `professional_type` on this table.
  Flag both at `/complete`.
- **Trust:** the dashboard trusts only `claims.sub` and RLS; `account_type` is
  self-declared, matching the plan (no credential checks in v1).
- **Rendering:** the name is plain React text; no HTML from user data.
- **Copy** (plain text, `dashboard.professional`):

| Key | English | French |
| --- | --- | --- |
| `welcome` | Welcome, {name} | Bienvenue, {name} |
| `emptyTitle` | No families yet | Aucune famille pour l'instant |
| `emptyDescription` | When a parent invites you to their family, it appears here. You'll only see the records they choose to share. | Lorsqu'un parent vous invite dans sa famille, elle apparaît ici. Vous ne verrez que les dossiers qu'il choisit de partager. |

## Testing

- No test or Verify command is declared, so no unit tests.
- Gates: `npm run typecheck`, `npm run lint:web`, `npm run build:web`,
  `npx supabase@latest db lint`.
- Manual checks on `npm run dev:web` with the local stack running: each Done
  when above.

## Notes for the AI

- Follow how `en.ts` and `fr.ts` handle `{name}` today; if they don't
  interpolate, build the welcome line in the component without adding a formatter.
- Keep copied Catalyst files byte-close to the kit.
- Never edit an existing migration; this is a new one.
- No em dashes, en dashes, or ellipsis characters in copy or comments.

## Implementation notes

- **Status:** verified (typecheck, lint, build, schema lint, SQL checks in a
  rolled-back transaction). Live browser checks of step 3 (both languages,
  phone width, OS light and dark) were not run; see Try it now.
- The backfill ran against a local database with no professionals, so it
  inserted nothing; its effect on existing rows was not exercised.
- The home screen lives inside `ProfessionalDashboard`; the separate
  `professional-home.tsx` was removed at the owner's request.
- `heading.tsx` and `text.tsx` add `import type React from 'react'` (and
  `const` for lint). Without it, `React` resolved to the workspace's hoisted
  `@types/react`, a different version, and typecheck failed. Same cause as the
  cast in `button.tsx`.
- Headings use levels 2 and 3 because the shell already has the page `h1`.
- `NavigationItem.icon` is typed `typeof HomeIcon` rather than React's
  `ComponentType`, for the same hoisted `@types/react` mismatch.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9803,"specSha256":"0d98c534e96b2c6e5c8869f4f38e067a6b419dac082fe7f49fc4e13bebd996b0","branch":"refs/heads/feature/professional-home","head":"5319598fb0fd0ab1c69003946dda5a4c70d44d62","baseRef":"refs/heads/dev","baseCommit":"1f7574f8709f666a0249fb52ad8be0aec37692ce","sourceTree":"d4838696211c2aaa16a0a9dae36afe637f5ced2d","landing":"local-merge","absentOptional":[]} -->

## Findings

### 31b/F-10 [P3] closed - Welcome line mangles names that contain `$` replacement patterns

**File:** apps/web/src/components/dashboard/professional-home.tsx:18
**Found:** 2026-10-16 by /audit independent (scope: current; lens: quality)
**Why it matters:** `messages.welcome.replace("{name}", userName)` passes the user-controlled name as a string replacement, so JavaScript expands `$&`, `` $` ``, `$'`, and `$$` inside it. Confirmed with Node: a name of `Ana $& Lee` renders "Welcome, Ana {name} Lee", and `` Bob $` `` renders "Welcome, Bob Welcome,". `validateName` only trims and limits length, so such a name is accepted on `/profile` and at sign-up. Impact is cosmetic and self-inflicted (plain React text, no injection), but it is the first place a professional sees their name.
**Suggested fix:** Use a replacer function, `messages.welcome.replace("{name}", () => userName)`, which inserts the value literally. No current requirement is lost.
**Resolution:** Fixed 2026-10-16 in step 4: `ProfessionalDashboard` uses `replace("{name}", () => userName)`; Node check renders `Welcome, Ana $& Lee`. Awaiting `/audit` re-review. Closed 2026-10-17 by /audit independent (target 5319598): `professional-home.tsx` was removed and the welcome line now lives at `apps/web/src/components/dashboard/professional-dashboard.tsx:26`, using `replace("{name}", () => userName)`. Node re-check renders `Ana $& Lee`, `` Bob $` ``, and `x $' $$ y` literally; the name is still plain React text, and the repair introduced no new defect.

## Independent review

**Status:** passed
**Target commit:** 5319598fb0fd0ab1c69003946dda5a4c70d44d62
**Base commit:** 1f7574f8709f666a0249fb52ad8be0aec37692ce
**Base ref:** origin/dev
**Spec hash:** 0d98c534e96b2c6e5c8869f4f38e067a6b419dac082fe7f49fc4e13bebd996b0
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-17T02:38:01Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-17T02:39:38Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `<base>..<target>` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `npm run typecheck`: pass
- `npm run lint:web`: pass
- `npm run build:web`: pass
- `npx supabase@latest db lint`: pass (no schema errors)
- `npx supabase@latest migration list --local`: pass (20261017013628 applied locally)
- Rolled-back SQL checks in `supabase_db_tango` (`begin; ... rollback;`): pass
- `node -e` replacer check for F-10: pass

## Evidence

- Freshness confirmed before review: `HEAD` = 5319598, `merge-base origin/dev HEAD` = 1f7574f, spec SHA-256 matches, only `review.md` and `findings.md` differ from the target.
- Reviewed the full 1f7574f..5319598 delta: migration `20261017013628_professional_accounts.sql`, `database.types.ts`, `en.ts`/`fr.ts`, Catalyst `heading.tsx`/`text.tsx` (differ from the kit only by the `import type React` line and `let` to `const`), `dashboard-shell.tsx`, `parent-dashboard.tsx`, `professional-dashboard.tsx`, `[lang]/dashboard/page.tsx`, plus the `docs: plan signed exports` plan edits (documentation only).
- SQL (rolled back): `authenticated` holds only SELECT on `professional_accounts` (no TRUNCATE/TRIGGER/REFERENCES), `anon` none; existing professional is backfilled; email sign-up as professional creates one row, parent and null-type sign-ups create none; `set_account_type('professional')` from null creates one row and a second call is a no-op; as `authenticated`, insert, update, delete, truncate, direct trigger-function execute, and `profiles.account_type` update are denied; a user reads only their own row; `anon` select denied; `on delete restrict` matches the existing `profiles` and `family_members` pattern.
- Page language for the error alert (`requestMessages`) agrees with the `[lang]` param because the proxy rewrites to the cookie language and sets the request cookie first.
- Server-to-client boundary passes only strings; icon components are created inside client components.

## Findings

- F-10 closed (repair confirmed at `professional-dashboard.tsx:26`)
- No new findings

## Remaining risk

- No unit test or Verify command is configured, so no automated tests cover the dashboard selection or the trigger.
- Live browser checks of step 3 (both languages, phone width, OS light and dark) were not run by the builder or this reviewer; Check was not required and no dev server was started.
- The backfill was exercised only against the local database (one existing professional); staging data was not inspected.
- Plan drift remains documented for `/complete`: project plan and overview still list `name` and `professional_type` on `professional_accounts`.
- Earlier open P3 findings (F-01, F-04 to F-09) and unverified F-02 are unchanged by this delta.

## Try it now

1. With the local stack running, start the dev server (`npm run dev:web`) and open http://localhost:3000.
2. Click **Get started**, choose **Continue as a professional**, and sign up with a new email. Confirm it in Mailpit at http://127.0.0.1:54324.
3. You land on `/dashboard` and see the professional dashboard: a sidebar with only **Dashboard**, "Welcome, <your name>", and "No families yet". Switch to French in Settings and reload to see the French copy.
4. Sign in as a parent: the dashboard shows the parent sidebar (Team, Projects, Your teams) exactly as before.
5. In Studio (http://127.0.0.1:54323), `professional_accounts` has one row for the professional and none for the parent.
