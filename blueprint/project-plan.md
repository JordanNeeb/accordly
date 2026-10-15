# Project Plan

> Developed through `/discovery`. Items marked **Assumption** were proposed and
> not objected to; confirm or correct them. Items marked **TODO** are open.

## 1. Problem - What problem are we solving?

Separated and divorced parents have to keep communicating, sharing costs, and
coordinating parenting time, often while in conflict. Informal tools (texts,
email, shared calendars, e-Transfers) leave no reliable record, are easy to
dispute, and do nothing to hold either parent to what they agreed.

Tango is a Canadian co-parenting app and a direct competitor to
OurFamilyWizard. It gives co-parents one place to communicate, plan schedules,
and handle shared expenses, with three differentiators:

- **A permanent, court-ready record.** Messages cannot be edited or deleted,
  are timestamped by the server, and export to a court-ready PDF.
- **Agreements the app enforces.** Parents enter the terms of their parenting
  agreement, and the calendar blocks bookings that exceed those terms unless
  the other parent approves.
- **Money that actually moves.** Shared expenses and recurring child support
  are collected through Stripe pre-authorized debit, not just tracked.

## 2. Users - Who is this for?

- **Primary:** separated or divorced parents in Canada who share children.
  Many are in high-conflict relationships, so the product must stay neutral and
  assume either parent may act against the other.
- Each parent has their own account and their own subscription.
- A parent may share children with more than one co-parent. Each co-parent
  pair plus their shared children is a separate **family**, and nothing is
  shared between families.
- **Later (not v1):** lawyers, mediators, and family helpers invited by a
  parent (see Deferred).

## 3. Features - What does the MVP need?

### Platforms and build order

1. Monorepo foundation
2. Backend (Supabase)
3. Web app (Next.js), the full v1 client
4. Mobile app (Expo, iOS and Android), shipped last and reaching parity with web

### Accounts, families, and children

- Sign up, sign in, sign out, profile via Supabase Auth. Sign-in methods:
  email and password (with email confirmation and password reset) and Google.
  Other providers (Apple, Facebook) later.
- Sign-up asks only for email and password. Parents add their first and last
  name on their profile afterward; names are required before sending a
  co-parent invite. Language is chosen with an EN/FR toggle, not a form field.
- Starting a family and inviting the co-parent by email is one step. The
  family is created only when the co-parent accepts, so every family has both
  parents from the start.
- One co-parent pair is one family. An invite between two parents who already
  share a family, or who already have a pending invite between them in either
  direction, is blocked; the parent is pointed to the existing family or invite.
- A parent can belong to multiple families from v1 (one per co-parent), and the
  UI lets them switch between families.
- Accepting an invite requires a verified email address, since invites are
  matched by email.
- Children: name and birthdate only in v1, added after the family exists.
  **Assumption.**
- English and French throughout: UI, emails, notifications, and PDF export.

### Messaging

- One continuous chat per family between the two parents (no subject threads).
- **No editing and no deleting, by anyone, ever.** Corrections are new messages.
- Server-assigned timestamps, never device time.
- Attachments: photos and PDFs, stored permanently, included in exports.
  **Assumption.**
- Read receipts record when the recipient first viewed each message, shown to
  the sender and included in exports. **Assumption.**
- Tamper evidence: each message is chained to the previous one with a
  cryptographic hash, so any later change is detectable; exports carry a
  verification code. **Assumption.**
- Search: keyword search in English and French, filters by date range, sender,
  and has-attachment, jump from a result to its place in the chat, and export a
  date range to PDF. Smarter search (tags, summaries) is later.

### Agreements

- A parent enters agreement terms as structured fields and attaches the signed
  agreement (PDF or photo) for reference.
- The other parent reviews and accepts or disputes. **Nothing is enforced until
  both parents have accepted.**
- Changes go through the same propose-and-accept flow. Every version is kept.
- If terms are disputed, never accepted, or the other parent never joins, there
  is nothing to enforce and the calendar works as a plain shared calendar.
  Resolving disputes is outside the app.
- v1 terms cover the calendar only: the regular schedule and each parent's
  annual vacation allowance. Expense split percentages and recurring support
  are also agreed in-app (see Expenses).

### Calendar and enforcement

- Regular schedule from common repeating patterns (week on/week off, 2-2-3,
  2-2-5-5, alternating weekends) or a custom repeating cycle, plus handoff time.
- One time zone per family.
- **Vacation allowance:** counted in **overnights** per parent, resetting every
  **calendar year** (January 1).
- A booking within the allowance is added to the calendar, notifies the other
  parent, and reduces the allowance.
- A booking that exceeds the allowance becomes a **request**. The other parent
  approves (added to the calendar) or denies (recorded, not added).
- Swaps and trades are always requests and never use allowance.
- General events (appointments, school events) can be added freely by either
  parent; informational only, never counted or enforced.
- Bookings can cover all children or specific children.
- Holidays are booked manually in v1; rotating holiday rules are later.

### Expenses and payments

- A parent logs an expense: amount, category, date, description, and a
  **required receipt** (photo or PDF).
- The split defaults to the accepted agreement percentage and can be adjusted
  per expense.
- The other parent approves or rejects with an optional reason.
- **Approval automatically triggers a pre-authorized debit** of the approving
  parent's share, paid to the logging parent.
- If the paying parent has no debit mandate, the expense is marked approved but
  unpaid and they are prompted to set one up.
- Either parent can record an expense as paid outside Tango (cash,
  e-Transfer).
- Payment status is always visible: pending, paid, failed, disputed. Failed
  debits notify both parents.
- **Recurring child support:** amount, frequency, and start date, accepted by
  both parents; the payer signs the debit mandate and payments run
  automatically. Changes need both parents again, plus a new mandate when the
  bank terms require it.
- Payments use Stripe Connect: the receiving parent completes Stripe identity
  and bank verification; the paying parent signs a Canadian pre-authorized
  debit (ACSS) mandate. PAD settles over several business days, can fail for
  insufficient funds, and can be disputed for 90 days or more.

### Court-ready export

- PDF export of messages (with attachments and read receipts), calendar
  requests and decisions, agreement versions, and expenses and payments, for a
  chosen date range, in English or French, with the tamper-evidence
  verification code.
- Available to lapsed parents.

### Notifications

- Email notifications on web (new messages, requests, approvals, payment
  events). Push notifications on mobile.

### Deferred (not v1)

- Invited users: lawyers, mediators, parenting coordinators (read-only, areas
  chosen by the inviting parent) and family helpers (calendar only). The other
  parent is always notified and sees who has access; every invitee action is
  recorded; access is revocable. Design agreed, build later.
- Customizable roles and permissions.
- Agreement enforcement beyond the calendar (expenses, travel notice, support
  changes).
- Rotating holiday schedules; anniversary-based allowance resets.
- Multiple families in the UI.
- Two-factor authentication.
- Tone assistance for messages; smarter search.
- Transaction fees on payments.
- International markets.

## 4. Data - What are we storing?

Everything belongs to a family except the user's own profile and subscription.

- **Users/profiles:** identity, first and last name, language preference,
  subscription status.
- **Families:** members (exactly two parents in v1), time zone.
- **Children:** name, birthdate.
- **Messages:** append-only; sender, server timestamp, body, attachments, hash
  chain link, first-viewed timestamp.
- **Agreements:** append-only versions with structured terms (schedule pattern,
  vacation allowance, expense split), attached documents, and each parent's
  acceptance or dispute.
- **Calendar:** schedule pattern, bookings, events, requests and decisions,
  allowance usage per parent per year.
- **Expenses:** amount, category, receipt, split, approval decision, payment
  status.
- **Payments:** Stripe connected accounts, mandates, payment intents, recurring
  support schedules, webhook-driven status history.
- **Subscriptions:** per parent, status, period.
- **Activity history:** an append-only log of significant actions.

Records are never hard-deleted. Account closure and legal retention rules are a
**TODO** for the privacy review.

## 5. Tech - What stack are we using?

- **Monorepo:** `apps/web`, `apps/mobile` (this Expo app, moved in), `supabase/`,
  and shared packages for types, validation, data access, business rules
  (allowance math, expense splits), and translations. **TODO:** workspace
  tooling, decided in the monorepo feature.
- **Web:** Next.js, TypeScript, Tailwind CSS, Tailwind Plus components.
- **Mobile:** Expo SDK 57, React Native, Expo Router, TypeScript. **TODO:**
  styling library (NativeWind likely, so Tailwind settings carry over).
- **Backend:** Supabase (Postgres, Auth, Storage) in `ca-central-1`. Access
  control enforced with row-level security, scoped to family membership.
- **Payments:** Stripe Connect with ACSS pre-authorized debit; webhooks handled
  by the Next.js server.
- **Email:** transactional provider (Resend or Postmark), also used by Supabase
  Auth.
- **Scheduled jobs:** recurring support debits, allowance resets, payment status
  checks (Supabase cron or Vercel cron).
- **Context files:** `AGENTS.md`, coding standards, and commands are updated for
  Next.js and the monorepo as part of the monorepo feature.

## 6. Monetize - How will this make money?

- Per-parent subscription, monthly or yearly. One subscription covers any number
  of families. No free trial and no free tier.
- A parent is not charged until the co-parent has joined.
- **Lapsed parents** can read everything, export the court PDF, approve or deny
  the other parent's requests and expenses, and their pre-authorized debits keep
  running. They cannot send messages, create bookings or requests, or enter
  expenses; trying prompts them to renew. **A lapse never hurts the other
  parent.**
- Transaction fees on payments later.
- **TODO:** whether subscriptions are sold through Apple and Google in-app
  purchase or on the web (under research).

## 7. UI/UX - How should this look and feel?

- Design is owned by the project owner. Components come from Tailwind Plus on
  web; colours, logo, and branding are set manually.
- A public landing page at `/` for signed-out visitors, aimed at parents going
  through a high-conflict separation; signed-in visitors go to the dashboard.
- Screenshots for reference live in `design/references/` (reference only, never
  shipped). **TODO:** confirm the path.
- **TODO:** tone, light/dark mode, mobile component library.
- Accessibility follows the coding standards on both platforms.

## 8. Deployment - Where and how will this ship?

- **Web:** Vercel, server functions pinned to the closest Canadian or US-East
  region (verify during `/release`).
- **Backend:** Supabase, `ca-central-1`; separate staging and production
  projects; Supabase CLI for local development.
- **Stripe:** test mode in staging, live mode in production.
- **Mobile:** EAS Build and Submit to the App Store and Google Play.
- **Env vars (by name, values TBD):** Supabase URL and keys, Stripe secret and
  publishable keys, Stripe webhook secret, email provider API key.
- Nothing is set up yet: Vercel, Supabase, Stripe, email provider, domain, and
  Apple and Google developer accounts all need creating.

### Pre-launch requirements (not features)

- Quebec Law 25 privacy impact assessment covering every processor that handles
  data outside Quebec (Stripe, email, push, Supabase subprocessors).
- Privacy policy and terms of service.
- Review by a Canadian privacy lawyer and a family-law lawyer, including what
  makes the message record admissible.

## 9. Usage model and constraints

- Internet-facing, Canada-wide, bilingual.
- **Users may be adversarial toward each other.** Each parent must be unable to
  read another family's data, alter shared history, or act on the other
  parent's behalf. Enforced in the database, not only in the UI.
- Single product, many independent families.
- Financial data and payments are in scope; card and bank details stay with
  Stripe.
- **Non-requirements for v1:** two-factor authentication, international
  markets, invited third-party users.
- **TODO:** expected launch scale, success criteria.
