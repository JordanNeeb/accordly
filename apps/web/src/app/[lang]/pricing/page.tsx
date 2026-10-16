import { type Metadata } from "next";

import { PricingTiers } from "@/components/pricing/pricing-tiers";
import { pageLanguage, pageMessages } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const { pricing } = await pageMessages(params);
  return { title: pricing.title };
}

export default async function PricingPage({ params }: PageProps<"/[lang]/pricing">) {
  const { pricing } = await pageMessages(params);
  return <PricingTiers messages={pricing} language={await pageLanguage(params)} />;
}
