# Accordly - Project Overview

<!-- blueprint:source-hash 2790faf498a98e787165627d7678b5e63bb89cde2629de37b4c474b8ff37ce99 -->

> A Canadian, bilingual co-parenting app (web first, then iOS and Android) that
> gives separated parents a permanent court-ready message record, a calendar
> that enforces their agreement, and shared expenses and child support paid by
> Stripe pre-authorized debit.

## Problem

Separated parents coordinate messages, money, and parenting time through texts,
email, and e-Transfers that leave no reliable record and hold no one to what was
agreed. Accordly, a direct competitor to OurFamilyWizard, makes the record
permanent and court-ready, enforces agreed calendar terms, and actually moves
the money.

## Users

- **Parents (only user type in v1)** - separated or divorced parents in Canada
  sharing children, often in high conflict. Each has their own account and
  subscription.
- **Family** - one co-parent pair plus their shared children. A parent may
  belong to several families (data model); the v1 UI limits a parent to one.
- **Access states:**
  - *Unpaired* - co-parent has not joined; not charged.
  - *Active subscriber* - full access.
  - *Lapsed* - can read everything, export PDFs, approve or deny the other
    parent's requests and expenses, and their debits keep running; cannot send
    messages, create bookings or requests, or enter expenses (prompted to renew).
- **Deferred:** invited lawyers, mediators, and family helpers (design agreed in
  the plan, not built in v1).

## Usage model

- Internet-facing, Canada-wide, English and French.
- **Parents may be adversarial toward each other.** A parent must never read
  another family's data, alter shared history, or act for the other parent.
  Enforce with Supabase row-level security scoped to family membership, not
  only in the UI.
- Append-only records: nothing is hard-deleted or edited (messages, agreement
  versions, requests, expenses, payment history, activity).
- Payments in scope; card and bank details stay with Stripe.
- Compliance: Quebec Law 25 privacy impact assessment, privacy policy and
  terms, and legal review are pre-launch requirements, not features.
- **Non-requirements for v1:** two-factor auth, international markets, invited
  third-party users, transaction fees.

## Features

In build-plan order. Headline differentiators: **6-7** (permanent record),
**10-11** (agreement enforcement), **13-15** (real payments).

**Foundation**
1. **Monorepo structure** - `apps/mobile` (this Expo app), new Next.js `apps/web`, shared packages; update `AGENTS.md`, coding standards, commands.
2. **Supabase foundation** - local Supabase, staging in `ca-central-1`, profiles/families/children schema with RLS.
3. **Web authentication** - sign up, sign in, sign out, profile.
4. **Bilingual foundation** - shared EN/FR translations and language preference on web.

**Families**
5. **Family pairing** - create family, invite co-parent by email, join, add children.

**Messaging**
6. **Permanent messaging** - one undeletable, uneditable chat per family; server timestamps; attachments.
7. **Read receipts and tamper evidence** - first-viewed receipts and a message hash chain.
8. **Message search** - EN/FR keyword search; date, sender, attachment filters; jump to result.

**Agreements and calendar**
9. **Shared calendar** - schedule patterns, custom cycles, handoff time, general events.
10. **Agreements** - structured calendar terms and allowance, signed document, mutual acceptance, versions.
11. **Calendar enforcement** - overnight allowance tracking, bookings, approve/deny requests and swaps.

**Expenses and payments**
12. **Expenses** - receipt, agreement split, approve/reject, settled-outside-Accordly.
13. **Stripe onboarding** - Connect accounts for receivers, ACSS PAD mandates for payers.
14. **Expense payments** - approval triggers debit; webhook-driven status.
15. **Recurring child support** - mutually accepted schedule with automatic debits.

**Subscriptions, exports, notifications**
16. **Subscriptions** - per-parent billing starting when both join; lapsed restrictions.
17. **Court-ready export** - bilingual PDF of messages, requests, agreements, payments with verification code.
18. **Email notifications** - messages, requests, approvals, payment events.

**Mobile (last, parity with web)**
19. **Mobile foundation** - auth, shared packages, translations, styling.
20. **Mobile messaging and push** - chat, search, push notifications.
21. **Mobile calendar and requests** - schedule, bookings, approvals.
22. **Mobile expenses and payments** - expenses, approvals, payment status.
23. **Mobile subscription, export, and release** - subscription, PDF export, EAS store submission.

## Data model

Postgres in Supabase. All ids `uuid`; all timestamps `timestamptz` set by the
server. Every family-owned table carries `family_id` and is protected by RLS
checking `family_members`. Append-only tables allow no `UPDATE`/`DELETE` of
content (status transitions are new rows or narrowly scoped columns).

> Locked early (features 2, 5, 6): `families`/`family_members` scoping and the
> append-only message shape. Later features depend on both.

### profiles
- `id` (uuid, = `auth.users.id`)
- `display_name` (text)
- `language` (`'en' | 'fr'`)
- `created_at`

### families
- `id`, `time_zone` (IANA text, e.g. `America/Toronto`), `created_at`
- `status` (`'pending' | 'active'`) - active once both parents joined

### family_members
- `family_id` -> families, `user_id` -> profiles, `joined_at`
- unique (`family_id`, `user_id`); exactly two parents per family in v1
- a user may appear in many families (v1 UI shows one)

### family_invites
- `id`, `family_id`, `invited_email` (text), `invited_by` -> profiles
- `status` (`'pending' | 'accepted' | 'expired'`), `created_at`

### children
- `id`, `family_id`, `name` (text), `birthdate` (date)

### messages (append-only)
- `id`, `family_id`, `sender_id` -> profiles, `body` (text)
- `created_at` (server), `seq` (bigint, per-family order)
- `prev_hash`, `hash` (text) - hash chain over (prev_hash, sender, body, attachments, created_at)
- search vector covering English and French

### message_attachments
- `id`, `message_id`, `storage_path`, `mime_type` (image or PDF), `size_bytes`

### message_reads
- `message_id`, `reader_id`, `first_viewed_at` - one row per recipient, never changed

### agreements and agreement_versions (append-only)
- `agreements`: `id`, `family_id`, `created_at`
- `agreement_versions`: `id`, `agreement_id`, `version` (int), `proposed_by`,
  `created_at`, `document_path` (signed agreement)
- terms: `schedule_pattern` (e.g. `week_on_week_off | 2_2_3 | 2_2_5_5 | alternating_weekends | custom`),
  `custom_cycle` (jsonb: N-day cycle mapping day -> parent), `handoff_time`,
  `anchor_date`, `vacation_overnights_per_year` per parent (jsonb by user id),
  `expense_split` (jsonb: percent per parent)
- `agreement_responses`: `version_id`, `user_id`, `response` (`'accepted' | 'disputed'`), `created_at`
- a version is **in force** only when both parents accepted it; the latest in-force version governs

### calendar_events
- `id`, `family_id`, `created_by`, `kind` (`'booking' | 'event'`)
- `starts_at`, `ends_at`, `title`, `child_ids` (uuid[]; empty = all children)
- `overnights` (int, bookings only), `request_id` (nullable)

### calendar_requests
- `id`, `family_id`, `requested_by`, `kind` (`'over_allowance' | 'swap'`)
- `starts_at`, `ends_at`, `child_ids`, `details` (jsonb, swap specifics)
- `status` (`'pending' | 'approved' | 'denied'`), `decided_by`, `decided_at`

### allowance usage
- derived per (`family_id`, `user_id`, calendar year) from bookings within the
  allowance; resets January 1. May be materialized for performance.

### expenses
- `id`, `family_id`, `logged_by`, `amount_cents` (int, CAD), `category` (text),
  `incurred_on` (date), `description`, `receipt_path` (required)
- `split` (jsonb: percent per parent, default from agreement)
- `status` (`'submitted' | 'approved' | 'rejected'`), `decided_at`, `reject_reason`
- `settlement` (`'unpaid' | 'stripe' | 'outside_accordly'`)

### stripe_accounts
- `user_id`, `stripe_account_id` (Connect Express), `onboarding_status`

### payment_mandates
- `id`, `user_id`, `stripe_payment_method_id`, `stripe_mandate_id`, `status`

### payments (status history append-only)
- `id`, `family_id`, `payer_id`, `payee_id`, `amount_cents`
- `source` (`'expense' | 'support'`), `expense_id` or `support_schedule_id`
- `stripe_payment_intent_id`, `status` (`'pending' | 'paid' | 'failed' | 'disputed'`)
- `payment_events`: `payment_id`, `status`, `stripe_event_id`, `created_at`

### support_schedules
- `id`, `family_id`, `payer_id`, `payee_id`, `amount_cents`, `frequency`,
  `start_date`, `version`; both parents' acceptance recorded like agreement responses

### subscriptions
- `user_id`, `plan` (`'monthly' | 'yearly'`), `status` (`'active' | 'lapsed'`),
  `current_period_end`, provider ids (provider TBD, see Open questions)

### activity_log (append-only)
- `id`, `family_id`, `actor_id`, `action` (text), `subject_type`, `subject_id`, `created_at`, `data` (jsonb)

## Tech stack

- **Monorepo** - `apps/web`, `apps/mobile`, `supabase/`, shared packages (types, validation, data access, business rules, translations). Workspace tooling: TODO in feature 1.
- **Next.js + TypeScript + Tailwind CSS + Tailwind Plus** - web app, the full v1 client; hosts Stripe webhooks.
- **Expo SDK 57 + React Native + Expo Router** - mobile app, built last. Styling library TODO (NativeWind likely).
- **Supabase** (`ca-central-1`) - Postgres, Auth, Storage (attachments, receipts, agreements), RLS.
- **Stripe Connect + ACSS pre-authorized debit** - expense reimbursements and recurring support. PAD settles over days, can fail, disputable 90+ days.
- **Resend or Postmark** - transactional and Supabase Auth email.
- **Supabase cron or Vercel cron** - recurring support debits, allowance resets, payment status checks.
- **Expo push** - mobile notifications.

## Monetization

- Per-parent subscription, monthly or yearly, covering any number of families.
- No free trial or tier. Billing starts only when the co-parent has joined.
- A lapse never hurts the other parent (see Users access states).
- Transaction fees later.

## UI/UX

- Design owned by the project owner: Tailwind Plus components on web; colours,
  logo, and branding set manually. Screenshots in `design/references/`
  (reference only).
- All UI, emails, notifications, and exports in English and French.
- Main web screens (route paths decided in feature specs): sign up/sign in,
  family setup and invite, children, chat with search, calendar with requests,
  agreement entry and review, expenses, payments setup and status, support
  schedule, subscription, export.

## Deployment

- **Web:** Vercel; server functions pinned to the nearest Canadian or US-East
  region (verify in `/release`).
- **Backend:** Supabase `ca-central-1`; staging and production projects;
  Supabase CLI locally.
- **Stripe:** test mode in staging, live in production.
- **Mobile:** EAS Build and Submit.
- **Env vars:** Supabase URL and keys, Stripe secret and publishable keys,
  Stripe webhook secret, email provider API key.
- **Cron:** support debits, allowance resets, payment status checks.
- Nothing provisioned yet (Vercel, Supabase, Stripe, email, domain, Apple and
  Google developer accounts).

> TODO: build/start commands and health path once the monorepo exists (feature 1).

## Open questions

> Resolve in the plans, then re-run `/overview`.

- **Subscription sales channel** - Apple/Google in-app purchase vs web (affects 16, 23).
- **Expense split entry** - plan stores the split in agreement terms, but item 10 covers only calendar terms and allowance. Which feature captures it?
- **Notification timing** - invites (5), booking notices (11), and failed-debit alerts (14) need email before item 18 builds notifications.
- **Activity log** - in the data model but no build item owns it.
- **Receiving parent not onboarded to Stripe** - what happens when an expense is approved before the payee completes Connect onboarding?
- **Sign-in method** (assumed email and password), workspace tooling, mobile styling, tone, light/dark mode, design folder path.
- **Assumptions to confirm:** attachments, first-viewed receipts, hash chaining, children as name and birthdate only.
- **Record retention** after account closure; expected launch scale; success criteria.
