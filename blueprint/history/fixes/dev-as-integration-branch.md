# Fix: Dev as the integration branch

**Type:** Fix
**Status:** verified
**Branch:** fix/dev-as-integration-branch

## The problem

`main` will auto-deploy to production. All work must branch from and land on
`dev`, and `dev` reaches `main` only when the user asks after testing it
themselves. The Blueprint skills don't know this:

- `/complete` (local merge), `/feature`'s build-history checks, `/status`, and
  `/continuous` act on the **default branch**. Git resolves that from the
  remote's default, which is `origin/main` today.
- `/audit independent` accepts only "a locally recorded remote default branch,
  local `main`, or local `master`" as its review base. While `dev` is ahead of
  `main`, every review would also cover earlier unmerged `dev` work.
- The rule exists only in Claude's private memory, so Codex and other tools
  won't follow it.

## The fix

Make `dev` the repository's **default branch**, in place of editing the
Blueprint skills, and keep `main` as the production branch.

- **GitHub default branch → `dev`.** The user changes this in the repo settings
  (`gh` is not installed). Locally, `git remote set-head origin dev` makes
  `origin/HEAD` point to `origin/dev`. Every skill that resolves "the default
  branch" then picks `dev`: `/complete` lands there, and independent review
  uses `origin/dev` as a valid "remote default branch" base. No skill changes
  are needed.
- **Document the rule in `AGENTS.md`** with a short `## Branches` section, so
  every tool follows it:
  - `dev` is the default and integration branch. Work branches come from `dev`,
    and `/complete` squash-merges back into `dev`.
  - `main` is production, and pushing it will deploy. Update it only when the
    user explicitly asks, by fast-forwarding `main` to `dev` (`git switch main &&
    git merge --ff-only dev`). Push it only with a separate yes. Never commit
    directly to `main`.
  - When hosting is set up (`/release`), production deploys come from `main`.
    That is independent of the GitHub default branch.
- `git.landing` stays `local-merge`. It already targets the default branch.

Why this approach: the Blueprint skill files are installer-managed, with
hashes in `blueprint/.state/manifest.json`. Editing them in both `.claude/` and
`.agents/` would show up as drift and be overwritten on the next Blueprint
update. Making `dev` the default branch is a common pattern and needs no
workflow code.

Must not break:

- `main` keeps its current commit (`be81624`). Nothing is pushed to `main`.
- Earlier history and archives stay unchanged.

## Build steps

- [x] 1. **Document the branch rule.** Create `fix/dev-as-integration-branch`
  from `dev`. Add the `## Branches` section to `AGENTS.md` after "What this is".
  - **Done when:** the section states that `dev` is the default branch, that
    `main` is production, and how and when `main` is updated, in the words
    above. `npm run typecheck` still passes.
- [x] 2. **Point the default branch at `dev`.** The user sets the GitHub default
  branch to `dev` (Settings → General → Default branch). Then run
  `git remote set-head origin dev`.
  - **Done when:** `git symbolic-ref refs/remotes/origin/HEAD` prints
    `refs/remotes/origin/dev`, and `git ls-remote --symref origin HEAD` shows
    `ref: refs/heads/dev`.

## Verify

- `git ls-remote --symref origin HEAD` reports `dev`. `origin/HEAD` locally
  resolves to `origin/dev`.
- `git merge-base origin/dev fix/dev-as-integration-branch` equals the `dev` tip
  the fix branched from. That shows independent review would now use `dev` as
  its base.
- `main` is still at `be81624`, locally and on `origin`.
- After `/complete`, this fix lands on `dev`, not `main`.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":3706,"specSha256":"768376a73e44bcfed4789f0e6518835dcdf8fd4fe7de5c235a68b65a07e6bda7","branch":"refs/heads/fix/dev-as-integration-branch","head":"fd6d477eafe40c30475b7537e7b7bd679c7662a9","baseRef":"refs/heads/dev","baseCommit":"fd6d477eafe40c30475b7537e7b7bd679c7662a9","sourceTree":"734480f1f3be735190c94560625aed7663d9d8db","landing":"local-merge","absentOptional":[]} -->
