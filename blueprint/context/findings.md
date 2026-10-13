# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P3] open - authenticated keeps TRUNCATE, TRIGGER, REFERENCES on RLS tables

**File:** supabase/migrations/20261013152920_create_families.sql:81
**Found:** 2026-10-13 by /audit independent (scope: current; lens: security)
**Why it matters:** The migrations revoke only `insert, update, delete` from `authenticated` (also profiles migration line 28), so Supabase's default grants leave `TRUNCATE`, `TRIGGER`, and `REFERENCES` on `profiles`, `families`, and `family_members` (confirmed in `information_schema.role_table_grants` on the local DB). `TRUNCATE` bypasses RLS; `TRUNCATE public.family_members` as `authenticated` would wipe every family's membership. Not reachable today: PostgREST and pg_graphql expose no truncate and no public SQL-executing RPC exists, so this is defense in depth for permanent, court-relevant data.
**Suggested fix:** In a new migration (these are already pushed to staging), `revoke truncate, trigger, references on public.profiles, public.families, public.family_members from authenticated;`. No current requirement is lost.
**Resolution:**

### F-02 [P3] unverified - profiles select policy calls shares_family per row

**File:** supabase/migrations/20261013152920_create_families.sql:73
**Found:** 2026-10-13 by /audit independent (scope: current; lens: performance)
**Why it matters:** `EXPLAIN` of an unfiltered `select * from public.profiles` as `authenticated` is a seq scan with filter `id = auth.uid() OR private.shares_family(id)`, so the security definer function runs once per profile row. Fine with an `id` filter (PK lookup) and at current scale; could matter if a client lists profiles unfiltered once user count grows. No profiling evidence.
**Suggested fix:** Keep client queries filtered by `id`; if needed later, rewrite as `id in (select private.co_member_ids())` set-returning helper so it evaluates once per statement.
**Resolution:**
