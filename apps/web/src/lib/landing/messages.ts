// Every English landing-page string lives here so feature 4 can swap in EN/FR
// translations without touching the page. "Learn more" and the screenshot
// text are Tailwind Plus placeholders, kept until real content exists.
export const LandingMessages = {
  nav: {
    label: "Main",
    logIn: "Log in",
  },
  headline: "Co-parent without the conflict.",
  description:
    "Built in Canada for Canadian families. Permanent, court-ready messages, a schedule both parents stick to, and expenses and support paid from your Canadian bank.",
  getStarted: "Get started",
  learnMore: "Learn more",
  screenshotAlt: "App screenshot",
} as const;
