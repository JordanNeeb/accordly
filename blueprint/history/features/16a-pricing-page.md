# Feature: Pricing page

**From build-plan:** feature 16a
**Build attempt:** 1
**Branch:** feature/pricing-page

## Goal

Parents who choose Parent on `/get-started` land on `/pricing`, compare the
Basic, Standard, and Premium tiers, switch between monthly and annual prices,
and continue to sign-up with their tier and billing interval in the URL. This
closes the gap left by 31a, where `/pricing` returned 404.

## Design reference

- `design/references/tailwind-plus/marketing/pricing.jsx` (Tailwind Plus
  pricing section with a frequency switch, dark in both themes). Catalyst has
  no pricing section, so the layout comes from this reference, ported as
  closely as possible.
- The switch stays CSS-only, as in the reference: a `form` with two radio
  inputs, and Tailwind `group-has` selectors that show the matching prices.
  No client JavaScript.
- Owner changes: tiers are titled Basic, Standard, and Premium. Standard and
  Premium descriptions read "Everything in Basic, plus:" and "Everything in
  Standard, plus:", and their feature lists show only what they add.
- The Tango logo sits top left, as on `/get-started`.

## In scope

- New public route `/pricing` (`apps/web/src/app/[lang]/pricing/page.tsx`).
- Header (eyebrow, title, paragraph), the monthly/annual switch (Monthly
  selected by default), and three tier cards. Standard is the featured card.
- Prices in CAD, formatted for the page language (`en-CA` gives `$11.99`,
  `fr-CA` gives `11,99 $`).
- Each card's button goes to `/sign-up?type=parent&tier=<tier>&interval=<interval>`
  for the selected interval.
- English and French copy.

## Out of scope

- Sign-up reading or storing `tier` and `interval`, Stripe, card collection,
  charging, and lapsed restrictions (16b and 16c).
- The fee waiver link (feature 29).
- A signed-in upgrade or plan-change page.
- Changes to the proxy: `/pricing` stays public. A signed-in visitor who picks a
  tier is sent from `/sign-up` to `/dashboard` by the existing rule.
- Mobile.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`:
implement all steps, verifying each one's Done when, then present one review
packet. No checkpoint commits; `/complete` makes the feature commit.

## Build steps

- [x] **1. Tier data and copy.** Add `apps/web/src/lib/pricing.ts` with the tier
  list (id, monthly and annual price in cents, featured flag) and a
  `formatPrice(cents, language)` helper using `Intl.NumberFormat` with
  `currency: "CAD"`. Add the `pricing` messages to `en.ts` and `fr.ts`.
  - Done when: `npm run typecheck` passes, proving `fr` matches the `Messages` shape.
- [x] **2. Pricing page.** Port the reference into
  `apps/web/src/components/pricing/pricing-tiers.tsx` (server component) and add
  the page with `generateMetadata` and `pageMessages`, following
  `get-started/page.tsx`.
  - Done when: `/pricing` renders in English and French; the switch toggles all
    three prices between monthly and annual; each visible button links to the
    matching `/sign-up?type=parent&tier=...&interval=...`; Standard shows the
    featured ring and badge; the cards stack below `lg`; keyboard alone can
    switch the frequency and reach each button; from `/get-started`, Continue as
    a parent opens this page; `npm run typecheck`, `npm run lint:web`, and
    `npm run build:web` pass.

## Files / areas

- `apps/web/src/lib/pricing.ts` - new
- `apps/web/src/components/pricing/pricing-tiers.tsx` - new
- `apps/web/src/app/[lang]/pricing/page.tsx` - new
- `packages/shared/src/i18n/en.ts`, `fr.ts` - `pricing` section
- `design/references/tailwind-plus/marketing/pricing.jsx` - the owner's reference, committed with this feature

## Data / contracts

- **Tiers:**

| id | Monthly | Annual | Featured |
| --- | --- | --- | --- |
| `basic` | 1199 | 11999 | no |
| `standard` | 1799 | 17999 | yes |
| `premium` | 2499 | 24999 | no |

  Amounts are CAD cents, from the project plan's Monetize table; the owner
  confirmed the annual amounts $179.99 and $249.99. The URL `tier`
  ids are the stable values 16b reads. They map to the data model's
  `subscriptions.tier` 1, 2, and 3 in that order.
- **URL contract (16b depends on this):** `/sign-up?type=parent&tier=basic|standard|premium&interval=month|year`.
  `interval` uses the data model's `subscriptions.interval` values. The proxy
  only checks `type`, so sign-up keeps working; 16b validates `tier` and `interval`.
- **Switch:** reference markup, with radio values `month` and `year` (instead of
  `monthly` and `annually`) so the CSS selectors and the URL use one vocabulary.
  The fieldset's accessible name comes from the copy (`frequencyLabel`).
- **Buttons:** each card renders two links, one per interval, and the inactive
  one is hidden with the same `group-has` selector that hides its price.
  Hidden links use `display: none`, so they are out of the tab order and the
  accessibility tree. Links use `next/link`.
- **Accessibility fix:** the reference sets the button's `aria-describedby` to an
  id the heading doesn't have. Give each tier heading the id `tier-<id>` and
  point both of its links at it.
- **Copy** (plain text). Prices are formatted, never written in copy.

| Key | English | French |
| --- | --- | --- |
| `eyebrow` | Pricing | Tarifs |
| `title` | Choose your plan | Choisissez votre forfait |
| `description` | Everything you need to co-parent with less conflict, all in one place. You won't be charged until your co-parent joins. | Tout ce qu'il vous faut pour une coparentalité avec moins de conflits, au même endroit. Vous ne serez pas facturé avant que votre coparent se joigne. |
| `frequencyLabel` | Payment frequency | Fréquence de paiement |
| `monthly` / `annually` | Monthly / Annually | Mensuel / Annuel |
| `perMonth` / `perYear` | /month / /year | /mois / /an |
| `featured` | Most popular | Le plus populaire |
| `choose` | Choose {tier} | Choisir {tier} |
| `basic.name` | Basic | Essentiel |
| `basic.description` | The essentials for co-parenting on the record. | L'essentiel pour une coparentalité bien documentée. |
| `basic.features` | Permanent messaging with tone meter; Shared calendar and agreements; Expenses and child support payments; Verifiable PDF exports; 60 min of video and 240 min of voice calls a month; 1 GB of document storage | Messagerie permanente avec indicateur de ton; Calendrier et ententes partagés; Paiement des dépenses et de la pension alimentaire; Exports PDF vérifiables; 60 min d'appels vidéo et 240 min d'appels vocaux par mois; 1 Go de stockage de documents |
| `standard.name` | Standard | Standard |
| `standard.description` | Everything in Basic, plus: | Tout ce qu'offre Essentiel, plus : |
| `standard.features` | Unlimited calls; Unlimited document storage; Certified records (affidavits) | Appels illimités; Stockage de documents illimité; Dossiers certifiés (affidavits) |
| `premium.name` | Premium | Premium |
| `premium.description` | Everything in Standard, plus: | Tout ce qu'offre Standard, plus : |
| `premium.features` | Unlimited call and video recording; Call and video transcription | Enregistrement illimité des appels vocaux et vidéo; Transcription des appels vocaux et vidéo |

  Feature lists are string arrays in the messages. The button reads
  `Choose Basic`, `Choose Standard`, and so on; `choose` is a plain string with
  a `{tier}` placeholder replaced in the component.

## Testing

- No test or Verify command is declared, so no unit tests.
- Gates: `npm run typecheck`, `npm run lint:web`, `npm run build:web`.
- Live checks against `npm run dev:web` (signed out): render both languages,
  toggle the switch, inspect each visible link, and use keyboard only.

## Notes for the AI

- Port the reference markup and classes as closely as possible, apart from the
  owner changes and contracts above. Remove its placeholder data.
- Pass the `pricing` messages and the page language to the section as props,
  as `AccountTypeChoice` does.
- `CheckIcon` comes from `@heroicons/react/20/solid`, already installed.
- `Messages` widens strings, so check that `Widen` handles the string arrays,
  and adjust its type only if typecheck fails.
- No em dashes, en dashes, or ellipsis characters in copy or comments.

## Open questions

- **French tier name.** "Basic" is rendered as "Essentiel" in French. Standard
  and Premium stay as they are. Change if you prefer another name.
- **Taxes.** Whether prices show "plus applicable taxes" depends on the Stripe Tax
  decision, which is still an assumption. The page doesn't mention tax yet.

## Implementation notes

- **Status:** verified (typecheck, lint, build; live checks in Chrome and with curl).
- Heading levels: the reference's eyebrow `h2` and title `p` became `p` and
  `h1` so the page has one `h1`, and the tier names became `h2` (same classes).
- The reference's radios had no visible focus style. They now use the same
  `focus-visible` indigo outline as the buttons.



<!-- blueprint:completion {"schemaVersion":2,"specBytes":8980,"specSha256":"9c9dcb252e7fb1018f3b1f5f6497219550ea48589fd9e9718f2351d7cc646b97","branch":"refs/heads/feature/pricing-page","head":"d38459465ff2f3ca58a8d28179cf1c467f0a85c7","baseRef":"refs/heads/dev","baseCommit":"d38459465ff2f3ca58a8d28179cf1c467f0a85c7","sourceTree":"778497d9467e0d2d51f6945722165cd790115bc5","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

With `npm run dev:web` running, open http://localhost:3000/pricing and click **Annually**.

Expected:

The prices change from $11.99, $17.99, and $24.99 (/month) to $119.99, $179.99, and $249.99 (/year), and **Choose Standard** opens `/sign-up?type=parent&tier=standard&interval=year`.

This proves:

The monthly/annual switch and the tier and interval each button passes to sign-up.
