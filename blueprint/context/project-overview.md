# Tango - Project Overview

<!-- blueprint:source-hash b0f725804609c704aadb6b881727684ed3126705f51cb70f156322753f650abd -->

> A Canadian, bilingual co-parenting app (web first, then iOS and Android) that
> gives separated parents a permanent court-ready record of messages and calls,
> a calendar that enforces their agreement, and shared expenses and child
> support paid by Stripe pre-authorized debit.

## Problem

Separated parents coordinate messages, money, and parenting time through texts,
email, and e-Transfers that leave no reliable record and hold no one to what was
agreed. Tango competes with OurFamilyWizard (OFW) and TalkingParents: a
permanent, verifiable record (messages, calls, access log), enforced calendar
terms, and money that actually moves, priced about 20% below OFW and free for
low-income parents who ask.

## Users

- **Parents** - separated or divorced parents in Canada sharing children, often
  in high conflict. Each has their own account and subscription.
- **Family** - one co-parent pair plus their shared children. A parent may
  belong to several families (one per co-parent) and switches between them in
  the UI. A family exists only once the invited co-parent accepts.
- **Professionals** - lawyers, mediators, other family-law professionals. Free
  accounts, no credential check; they see a family only when a parent invites
  them, read-only, limited to granted areas.
- **Parent access states:**
  - *Unpaired* - no family yet; not charged.
  - *Active subscriber* - access per tier (tier contents TBD, item 30).
  - *Fee waiver* - free for one year on honour-system request approved by the owner.
  - *Lapsed* - can read everything, export, play back recordings, approve or
    deny the other parent's requests and expenses; debits keep running; cannot
    send messages, place calls, create bookings or requests, or enter expenses.
    A lapse never hurts the other parent.
- **Deferred:** family helpers (calendar only).

## Usage model

- Internet-facing, **Canada only in v1**, English and French.
- **Parents may be adversarial.** A parent must never read another family's
  data, alter shared history, or act for the other parent; professionals see
  only granted families and areas. Enforce with Supabase RLS, not only the UI.
- Append-only records: nothing is hard-deleted or edited (conversations,
  messages, access log, calls and recordings, exports, agreement versions,
  requests, expenses, payment history).
- Payments in scope; card and bank details stay with Stripe.
- Admissibility target: Canada Evidence Act ss. 30, 31.1-31.8 and provincial
  acts; records practices aligned with CAN/CGSB-72.34-2024.
- **Non-requirements for v1:** two-factor auth, international markets
  (including the US), professional credential checks, digital signatures on
  exports, transaction fees.

## Features

In build-plan order. Headline differentiators: **6-7, 17** (permanent,
verifiable record), **10-11** (agreement enforcement), **13-15** (real payments).

**Foundation** (done)
1. **Monorepo structure** - npm workspaces: `apps/web`, `apps/mobile`, `packages/shared`.
2. **Supabase foundation** - local and staging, profiles, families, membership with RLS.
3. **Web authentication** - 3a email and password, 3b Google; same profile.
4. **Bilingual foundation** - shared EN/FR dictionaries, `profiles.language`, language menu and dashboard Settings.
24. **Landing page and dashboard** - public `/`, `/dashboard` shell.

**Families**
5. **Family pairing** - invite co-parent by email; family created on acceptance; duplicates blocked; add children.

**Messaging**
6. **Subject conversations** - parent-titled conversations in one scrollable list, never closed; server timestamps; attachments; no edits or deletes.
7. **Access log and tamper evidence** - first-viewed timestamps shown to both parents; append-only log of sign-ins, views, replies; hash chain.
8. **Message search** - EN/FR keyword search over subjects and messages; date, sender, attachment filters; jump to result.
25. **AI tone meter** - flags hostile wording while writing and suggests a rewrite; never blocks.

**Agreements and calendar**
9. **Shared calendar** - schedule patterns, custom cycles, handoff time, general events.
10. **Agreements** - structured calendar terms and allowance, signed document, mutual acceptance, versions.
11. **Calendar enforcement** - overnight allowance tracking, bookings, approve/deny requests and swaps.

**Expenses and payments**
12. **Expenses** - receipt, agreement split, approve/reject, settled outside Tango.
13. **Stripe onboarding** - Connect accounts for receivers, ACSS PAD mandates for payers.
14. **Expense payments** - approval triggers debit; webhook-driven status.
15. **Recurring child support** - mutually accepted schedule with automatic debits.

**Subscriptions**
16. **Tiered subscriptions** - three per-parent tiers, monthly or annual; billing starts when both join; lapsed restrictions.
29. **Fee waivers** - honour-system request, owner approves or denies, one year.

**Calls**
26. **Voice and video calls** - Agora calls without sharing numbers; every call logged.
27. **Call recording** - top-tier caller opts in per call; both consent before connecting; both parents (and granted professionals) can play back.

**Exports, professionals, notifications**
17. **Court-ready export** - EN/FR PDF of conversations, access log, calls, requests, agreements, payments; fingerprint and public verification page.
28. **Professional portal** - free accounts, parent invitation per family, granted areas, exports, full logging, revocable.
18. **Email notifications** - messages, requests, approvals, calls, payments; never message text.

**Tier contents**
30. **Tier features** - decide and enforce what each tier includes.

**Mobile (last, parity with web)**
19. **Mobile foundation** - auth, shared packages, translations, styling.
20. **Mobile messaging, calls, and push** - conversations, search, tone meter, calls, push.
21. **Mobile calendar and requests** - schedule, bookings, approvals.
22. **Mobile expenses and payments** - expenses, approvals, payment status.
23. **Mobile subscription, export, and release** - subscription, export, EAS submission.

## Data model

Postgres in Supabase. All ids `uuid`; all timestamps `timestamptz` set by the
server. Family-owned tables carry `family_id` with RLS on `family_members`
(plus active professional grants for granted areas). Append-only tables allow
no `UPDATE`/`DELETE` of content.

> Locked early (features 2, 5, 6, 7): family scoping, the append-only
> conversation and message shape, and the access log. Later features depend on them.

### profiles
- `id` (= `auth.users.id`), `name` (text, nullable, 1-100), `language` (`'en' | 'fr'`, default `en`), `created_at`
- name required before sending an invite (5)

### families / family_members
- `families`: `id`, `time_zone` (IANA), `created_at`; created only on invite acceptance
- `family_members`: `family_id`, `user_id`, `joined_at`; unique pair; exactly two parents in v1

### family_invites
- `id`, `invited_email`, `invited_by`, `status` (`pending | accepted | expired`), `created_at`
- blocked when the parents share a family or a pending invite exists either way; acceptance needs a verified email

### children
- `id`, `family_id`, `name`, `birthdate` (date)

### conversations (append-only)
- `id`, `family_id`, `subject` (text), `started_by`, `created_at`; never closed or hidden

### messages (append-only)
- `id`, `family_id`, `conversation_id`, `sender_id`, `body`, `created_at` (server), `seq` (bigint)
- `prev_hash`, `hash` - chain over (prev_hash, sender, conversation, body, attachments, created_at)
- search vector covering EN and FR (subject included via conversation)
- `message_attachments`: `id`, `message_id`, `storage_path`, `mime_type` (image or PDF), `size_bytes`
- `message_reads`: `message_id`, `reader_id`, `first_viewed_at` - shown to both parents

### access_log (append-only)
- `id`, `family_id` (nullable for sign-ins), `actor_id`, `actor_role` (`parent | professional`)
- `event` (`sign_in | message_view | message_reply | export | call_event | professional_action`), `subject_type`, `subject_id`, `created_at`, `data` (jsonb)
- parents do not see each other's sign-ins or repeat views in the app; included in exports, affidavits, professional portal

### calls and call_recordings
- `calls`: `id`, `family_id`, `caller_id`, `callee_id`, `kind` (`voice | video`), `started_at`, `answered_at`, `ended_at`, `recorded` (bool)
- `call_events`: `call_id`, `user_id`, `event` (e.g. mute, unmute), `created_at`
- `call_recording_consents`: `call_id`, `user_id`, `consented_at` - both required before connecting
- `call_recordings` (append-only): `call_id`, `storage_path`, `duration_s`, `created_at`
> TODO: recording retention and storage location; transcription.

### exports (append-only)
- `id` (export ID), `family_id`, `generated_by`, `generated_at`, `range_start`, `range_end`, `language`
- `areas` (text[]), `latest_message_hash`, `pdf_sha256`, `verification_code`
- the verification page returns match/no-match and this metadata only, never content

### professional_accounts and professional_grants
- `professional_accounts`: `user_id`, `name`, `professional_type` (`lawyer | mediator | other`), `created_at`
- `professional_grants`: `id`, `family_id`, `professional_id`, `granted_by`, `areas` (text[]), `status` (`invited | active | revoked`), `created_at`, `revoked_at`
- the other parent is notified and sees every grant

### agreements and agreement_versions (append-only)
- `agreement_versions`: `id`, `agreement_id`, `version`, `proposed_by`, `created_at`, `document_path`
- terms: `schedule_pattern` (`week_on_week_off | 2_2_3 | 2_2_5_5 | alternating_weekends | custom`), `custom_cycle` (jsonb), `handoff_time`, `anchor_date`, `vacation_overnights_per_year` (jsonb per parent), `expense_split` (jsonb percent per parent)
- `agreement_responses`: `version_id`, `user_id`, `response` (`accepted | disputed`); in force only when both accepted

### calendar_events and calendar_requests
- `calendar_events`: `id`, `family_id`, `created_by`, `kind` (`booking | event`), `starts_at`, `ends_at`, `title`, `child_ids` (empty = all), `overnights`, `request_id`
- `calendar_requests`: `id`, `family_id`, `requested_by`, `kind` (`over_allowance | swap`), `starts_at`, `ends_at`, `child_ids`, `details`, `status` (`pending | approved | denied`), `decided_by`, `decided_at`
- allowance usage derived per (family, parent, calendar year); resets January 1

### expenses
- `id`, `family_id`, `logged_by`, `amount_cents` (CAD), `category`, `incurred_on`, `description`, `receipt_path` (required)
- `split` (jsonb), `status` (`submitted | approved | rejected`), `decided_at`, `reject_reason`, `settlement` (`unpaid | stripe | outside_tango`)

### payments
- `stripe_accounts`: `user_id`, `stripe_account_id`, `onboarding_status`
- `payment_mandates`: `id`, `user_id`, `stripe_payment_method_id`, `stripe_mandate_id`, `status`
- `payments`: `id`, `family_id`, `payer_id`, `payee_id`, `amount_cents`, `source` (`expense | support`), `stripe_payment_intent_id`, `status` (`pending | paid | failed | disputed`); `payment_events` history append-only
- `support_schedules`: `id`, `family_id`, `payer_id`, `payee_id`, `amount_cents`, `frequency`, `start_date`, `version`; both parents accept

### subscriptions and fee_waivers
- `subscriptions`: `user_id`, `tier` (`1 | 2 | 3`), `interval` (`month | year`), `status` (`active | lapsed`), `current_period_end`, Stripe ids
- `fee_waivers`: `id`, `user_id`, `reason` (`social_assistance | legal_aid | financial_hardship | safety`, nullable), `note`, `status` (`pending | approved | denied`), `decided_by`, `decided_at`, `starts_on`, `ends_on`

### activity_log (append-only)
- `id`, `family_id`, `actor_id`, `action`, `subject_type`, `subject_id`, `created_at`, `data` (jsonb)

## Tech stack

- **Monorepo** - npm workspaces; `packages/shared` holds types, validation, business rules, and translations.
- **Next.js + TypeScript + Tailwind CSS + Catalyst UI kit** - web, the full v1 client; hosts Stripe webhooks.
- **Expo SDK 57 + React Native + Expo Router** - mobile, built last. Styling TODO (NativeWind likely).
- **Supabase** (`ca-central-1`) - Postgres, Auth, Storage, RLS.
- **Agora** - voice and video calls and cloud recording (about $1.49 per 1,000 audio minutes, $5.99 per 1,000 HD video minutes, plus call minutes).
- **AI provider** - tone meter. TODO: provider and model.
- **Stripe** - Connect + ACSS PAD for expenses and support; Billing for tiered subscriptions in CAD; Tax for GST/HST/QST (assumption).
- **Resend or Postmark** - transactional and Supabase Auth email.
- **Supabase cron or Vercel cron** - support debits, allowance resets, payment status checks, fee waiver expiry.
- **Expo push** - mobile notifications.

## Monetization

| Tier | Monthly | Annual |
|---|---|---|
| 1 | $11.99 | $119.99 |
| 2 | $17.99 | ~$179.99 |
| 3 (top) | $24.99 | ~$249.99 |

- Per parent, covering any number of families; annual about 17% off. No free trial; billing starts only when the co-parent has joined.
- Tier contents TBD (item 30); call recording is top tier only.
- Fee waivers: honour system, owner approval, one year, tier 1 plus unlimited calling (assumption).
- Professionals are always free. Transaction fees later.

## UI/UX

- Design owned by the project owner: every UI element from the Tailwind Plus Catalyst UI kit (`design/references/tailwind-plus/catalyst-ui-kit/`), other Tailwind Plus references only where Catalyst has no fit; colours, logo, and branding set manually.
- All UI, emails, notifications, and exports in English and French. Language menu on landing and auth pages; Settings > Language on the dashboard.
- `/` landing (signed out), `/dashboard` (signed in); the logo always links home.
- Main web screens (routes decided in feature specs): family setup and invite, children, conversations with search and tone meter, calls, calendar with requests, agreements, expenses, payments, support schedule, subscription and fee waiver, export, verification page, professional portal.

## Deployment

- **Web:** Vercel; functions pinned to the nearest Canadian or US-East region (verify in `/release`).
- **Backend:** Supabase `ca-central-1`; staging and production; Supabase CLI locally.
- **Stripe:** test mode in staging, live in production. **Mobile:** EAS Build and Submit.
- **Env vars:** Supabase URL and keys, Stripe secret, publishable, and webhook keys, email provider key, Agora app ID and certificate, AI provider key.
- Nothing provisioned yet (Vercel, Supabase staging and production, Stripe, email, Agora, AI provider, domain, Apple and Google developer accounts).
- **Pre-launch (not features):** Law 25 privacy impact assessment (Stripe, email, push, Agora, AI provider, Supabase subprocessors); privacy policy and terms with recording consent; CGSB-aligned records-management policy; named records custodian and affidavit template; privacy and family-law lawyer review.

> TODO: build/start commands and health path (`/release`).

## Open questions

> Resolve in the plans, then re-run `/overview`.

- **Tier contents and call minutes** (30) come after calls (26, 27); calls need interim limits or none until then.
- **Recording retention and storage**; transcription; affidavit fee and turnaround.
- **Tone meter** - AI provider, whether drafts are kept, whether warnings are logged.
- **Hash chain scope** - per family or per conversation (feature 7).
- **Two logs** - `access_log` and `activity_log` overlap; decide whether one replaces the other.
- **Notification timing** - invites (5), booking notices (11), failed debits (14), and professional grants (28) need email before item 18.
- **Fee waiver approval** - owner-only page or Supabase Studio.
- **Lapsed parents receiving calls** - placing is blocked; receiving is unspecified.
- **Subscription sales channel** - in-app purchase vs web (16, 23).
- **Expense split entry** - stored in agreement terms, but item 10 covers only calendar terms.
- **Receiving parent not onboarded to Stripe** when an expense is approved.
- **Family time zone** - who sets it and when.
- **Assumptions to confirm:** attachments, children fields, access-log visibility, call event detail, professional area limits, Stripe Tax.
- **Record retention** after account closure; launch scale; success criteria; mobile styling, tone, light/dark mode.
