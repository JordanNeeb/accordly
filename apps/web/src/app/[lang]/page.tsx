import { LandingHero } from "@/components/landing/landing-hero";
import { pageMessages } from "@/lib/i18n/server";

// The public landing page. The proxy sends signed-in visitors on to /dashboard.
export default async function Home({ params }: PageProps<"/[lang]">) {
  const messages = await pageMessages(params);
  return <LandingHero messages={messages.landing} />;
}
