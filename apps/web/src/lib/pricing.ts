import { type Language } from "@tango/shared";

export type TierId = "basic" | "standard" | "premium";

export type Interval = "month" | "year";

// CAD cents, from the project plan's Monetize table. The ids are the `tier`
// values sign-up receives; they map to subscriptions.tier 1, 2, and 3.
export const TIERS: { id: TierId; price: Record<Interval, number>; featured: boolean }[] = [
  { id: "basic", price: { month: 1199, year: 11999 }, featured: false },
  { id: "standard", price: { month: 1799, year: 17999 }, featured: true },
  { id: "premium", price: { month: 2499, year: 24999 }, featured: false },
];

export function formatPrice(cents: number, language: Language): string {
  return new Intl.NumberFormat(`${language}-CA`, { style: "currency", currency: "CAD" }).format(
    cents / 100,
  );
}
