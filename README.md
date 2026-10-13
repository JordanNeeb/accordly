# Accordly

A Canadian, bilingual co-parenting app: permanent court-ready messaging, a
calendar that enforces the parents' agreement, and shared expenses and child
support paid by Stripe pre-authorized debit.

## Layout

| Path | What it is |
|---|---|
| `apps/web` | Next.js web app (App Router, TypeScript, Tailwind CSS) |
| `apps/mobile` | Expo app for iOS and Android (React Native, Expo Router) |
| `packages/shared` | `@accordly/shared`, code shared by both apps |
| `supabase/` | Supabase config, migrations, and policies |
| `design/references/` | Design screenshots (reference only) |
| `blueprint/` | Plans, project overview, coding standards, and feature history |

## Getting started

Requires Node.js and npm. From the repo root:

```bash
npm install          # install every workspace
npm run dev:web      # web app at http://localhost:3000
npm run start:mobile # Expo dev server (press i or a)
```

## Commands

| Command | What it does |
|---|---|
| `npm run typecheck` | Typecheck every workspace |
| `npm run dev:web` / `build:web` / `lint:web` | Web dev server, production build, lint |
| `npm run start:mobile` | Expo dev server |
| `npm run ios` / `npm run android` | Run on the iOS Simulator or Android Emulator |
| `npx supabase@latest start` | Local Supabase stack (requires Docker) |

See `AGENTS.md` for the full command list and conventions.
