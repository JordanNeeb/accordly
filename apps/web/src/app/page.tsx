import { LandingHero } from "@/components/landing/landing-hero";

// The public landing page. The proxy sends signed-in visitors on to /dashboard.
export default function Home() {
  return <LandingHero />;
}
