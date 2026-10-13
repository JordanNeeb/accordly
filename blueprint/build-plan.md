# Build Plan

Features in rough build order. Keep each item to one line; details come later
in `/feature`. When both planning docs are ready, run `/overview`.

Run `/feature` to spec the next unchecked item, or `/feature 2` to pick one.
Keep completed items checked and append new features as the project grows.
Do not renumber completed features; their archived specs refer to those IDs.

## Your features

### Foundation

- [x] 1. **Monorepo structure** - move the Expo app to `apps/mobile`, add a Next.js `apps/web`, shared packages, and update `AGENTS.md`, coding standards, and commands
- [x] 2. **Supabase foundation** - local Supabase, staging project in `ca-central-1`, base schema for profiles, families, and family membership with row-level security
- [ ] 3. **Web authentication** - sign up, sign in, sign out, and profile on web via Supabase Auth
  - [x] 3a. **Email and password authentication** - sign up with email confirmation, sign in, sign out, forgot password, and profile
  - [ ] 3b. **Google sign-in** - sign up and sign in with Google, linked to the same profile
- [ ] 4. **Bilingual foundation** - shared English and French translations with a language preference, wired into web

### Families

- [ ] 5. **Family pairing** - invite the co-parent by email, create the family when they accept, block duplicate pairings, and add children

### Messaging

- [ ] 6. **Permanent messaging** - one undeletable, uneditable chat per family with server timestamps and attachments
- [ ] 7. **Read receipts and tamper evidence** - first-viewed receipts and a hash chain over messages
- [ ] 8. **Message search** - English and French keyword search with date, sender, and attachment filters

### Agreements and calendar

- [ ] 9. **Shared calendar** - regular schedule patterns, custom cycles, handoff times, and general events
- [ ] 10. **Agreements** - enter calendar terms and allowance, attach the signed document, mutual acceptance, and versions
- [ ] 11. **Calendar enforcement** - overnight allowance tracking, bookings, and approve-or-deny requests and swaps

### Expenses and payments

- [ ] 12. **Expenses** - log with receipt, agreement split, approve or reject, and record settled outside Accordly
- [ ] 13. **Stripe onboarding** - Connect accounts for receiving parents and pre-authorized debit mandates for payers
- [ ] 14. **Expense payments** - approval triggers a debit, with webhook-driven pending, paid, failed, and disputed status
- [ ] 15. **Recurring child support** - mutually accepted schedule with automatic recurring debits

### Subscriptions, exports, and notifications

- [ ] 16. **Subscriptions** - per-parent billing that starts when both parents join, with lapsed-parent restrictions
- [ ] 17. **Court-ready export** - bilingual PDF of messages, requests, agreements, and payments with verification code
- [ ] 18. **Email notifications** - messages, requests, approvals, and payment events

### Mobile

- [ ] 19. **Mobile foundation** - auth, shared packages, translations, and styling on the Expo app
- [ ] 20. **Mobile messaging and push** - chat, search, and push notifications
- [ ] 21. **Mobile calendar and requests** - schedule, bookings, and request approvals
- [ ] 22. **Mobile expenses and payments** - expenses, approvals, and payment status
- [ ] 23. **Mobile subscription, export, and release** - subscription flow, PDF export, and EAS store submission
