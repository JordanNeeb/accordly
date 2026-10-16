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
- [x] 3. **Web authentication** - sign up, sign in, sign out, and profile on web via Supabase Auth
  - [x] 3a. **Email and password authentication** - sign up with email confirmation, sign in, sign out, forgot password, and profile
  - [x] 3b. **Google sign-in** - sign up and sign in with Google, linked to the same profile
- [x] 4. **Bilingual foundation** - shared English and French translations with a language preference, wired into web
- [x] 24. **Landing page and dashboard** - public home page for signed-out visitors (logo top left, log in top right, headline for parents in a high-conflict separation, get started), and a dashboard shell where signed-in parents land

### Families

- [ ] 5. **Family pairing** - invite the co-parent by email, create the family when they accept, block duplicate pairings, and add children

### Messaging

- [ ] 6. **Subject conversations** - permanent conversations titled by the parent who starts them, in one scrollable list, with server timestamps, attachments, and no editing or deleting
- [ ] 7. **Access log and tamper evidence** - first-viewed timestamps shown to both parents, an append-only log of sign-ins, views, and replies, and a hash chain over messages
- [ ] 8. **Message search** - English and French keyword search across subjects and messages with date, sender, and attachment filters
- [ ] 25. **AI tone meter** - warn about hostile wording while a parent writes and suggest a calmer rewrite, never blocking a message

### Agreements and calendar

- [ ] 9. **Shared calendar** - regular schedule patterns, custom cycles, handoff times, and general events
- [ ] 10. **Agreements** - enter calendar terms and allowance, attach the signed document, mutual acceptance, and versions
- [ ] 11. **Calendar enforcement** - overnight allowance tracking, bookings, and approve-or-deny requests and swaps

### Expenses and payments

- [ ] 12. **Expenses** - log with receipt, agreement split, approve or reject, and record settled outside Tango
- [ ] 13. **Stripe onboarding** - Connect accounts for receiving parents and pre-authorized debit mandates for payers
- [ ] 14. **Expense payments** - approval triggers a debit, with webhook-driven pending, paid, failed, and disputed status
- [ ] 15. **Recurring child support** - mutually accepted schedule with automatic recurring debits

### Subscriptions

- [ ] 16. **Tiered subscriptions** - three per-parent tiers, monthly or annual, billing that starts when both parents join, and lapsed-parent restrictions
- [ ] 29. **Fee waivers** - honour-system request for free access, approved or denied by the owner, lasting one year

### Calls

- [ ] 26. **Voice and video calls** - in-app calls between co-parents through Agora, with every call logged
- [ ] 27. **Call recording** - top-tier callers choose to record, both parents consent before the call connects, and both can play back recordings

### Exports, professionals, and notifications

- [ ] 17. **Court-ready export** - bilingual PDF of conversations, the access log, calls, requests, agreements, and payments, with a fingerprint and a public verification page
- [ ] 28. **Professional portal** - free accounts for lawyers and mediators, access only by a parent's invitation, read-only areas, exports, and full logging
- [ ] 18. **Email notifications** - messages, requests, approvals, calls, and payment events, without message text

### Tier contents

- [ ] 30. **Tier features** - decide and enforce what each subscription tier includes

### Mobile

- [ ] 19. **Mobile foundation** - auth, shared packages, translations, and styling on the Expo app
- [ ] 20. **Mobile messaging, calls, and push** - conversations, search, tone meter, calls, and push notifications
- [ ] 21. **Mobile calendar and requests** - schedule, bookings, and request approvals
- [ ] 22. **Mobile expenses and payments** - expenses, approvals, and payment status
- [ ] 23. **Mobile subscription, export, and release** - subscription flow, PDF export, and EAS store submission
