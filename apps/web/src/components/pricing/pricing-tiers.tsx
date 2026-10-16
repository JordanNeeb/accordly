import { CheckIcon } from "@heroicons/react/20/solid";
import { type Language, type Messages } from "@tango/shared";
import Link from "next/link";

import { Logo } from "@/components/common/logo";
import { formatPrice, type Interval, TIERS } from "@/lib/pricing";

// Ported from the Tailwind Plus pricing section
// (design/references/tailwind-plus/marketing/pricing.jsx). The frequency switch
// stays CSS-only: each card renders both intervals' price and link, and the
// `group-has` selectors hide the ones for the unchecked radio. Hidden links are
// `display: none`, so only the visible link is focusable. The eyebrow and
// title swap elements so the title is the page's h1, and the radios get a
// focus ring the reference lacks.
const HIDDEN_UNLESS: Record<Interval, string> = {
  month: "group-not-has-[[name=frequency][value=month]:checked]/tiers:hidden",
  year: "group-not-has-[[name=frequency][value=year]:checked]/tiers:hidden",
};

export function PricingTiers({
  messages,
  language,
}: {
  messages: Messages["pricing"];
  language: Language;
}) {
  const frequencies: { value: Interval; label: string; suffix: string }[] = [
    { value: "month", label: messages.monthly, suffix: messages.perMonth },
    { value: "year", label: messages.annually, suffix: messages.perYear },
  ];

  return (
    <div className="min-h-dvh bg-gray-900">
      <header className="mx-auto max-w-7xl px-6 pt-10 lg:px-8">
        <Logo onDark />
      </header>
      <form className="group/tiers bg-gray-900 pt-12 pb-24 sm:pt-16 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-base/7 font-semibold text-indigo-400">{messages.eyebrow}</p>
            <h1 className="mt-2 text-5xl font-semibold tracking-tight text-balance text-white sm:text-6xl">
              {messages.title}
            </h1>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
            {messages.description}
          </p>
          <div className="mt-16 flex justify-center">
            <fieldset aria-label={messages.frequencyLabel}>
              <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs/5 font-semibold inset-ring inset-ring-white/10">
                {frequencies.map((frequency) => (
                  <label
                    key={frequency.value}
                    className="group relative rounded-full px-2.5 py-1 has-checked:bg-indigo-500"
                  >
                    <input
                      defaultValue={frequency.value}
                      defaultChecked={frequency.value === "month"}
                      name="frequency"
                      type="radio"
                      className="absolute inset-0 appearance-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    />
                    <span className="text-gray-400 group-has-checked:text-white">
                      {frequency.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {TIERS.map((tier) => {
              const copy = messages.tiers[tier.id];
              const headingId = `tier-${tier.id}`;
              return (
                <div
                  key={tier.id}
                  data-featured={tier.featured ? "true" : undefined}
                  className="group/tier rounded-3xl bg-gray-800/50 p-8 ring-1 ring-white/15 data-featured:ring-2 data-featured:ring-indigo-400 xl:p-10"
                >
                  <div className="flex items-center justify-between gap-x-4">
                    <h2
                      id={headingId}
                      className="text-lg/8 font-semibold text-white group-data-featured/tier:text-indigo-400"
                    >
                      {copy.name}
                    </h2>
                    <p className="rounded-full bg-indigo-500 px-2.5 py-1 text-xs/5 font-semibold text-white group-not-data-featured/tier:hidden">
                      {messages.featured}
                    </p>
                  </div>
                  <p className="mt-4 text-sm/6 text-gray-300">{copy.description}</p>
                  {frequencies.map((frequency) => (
                    <p
                      key={frequency.value}
                      className={`mt-6 flex items-baseline gap-x-1 ${HIDDEN_UNLESS[frequency.value]}`}
                    >
                      <span className="text-4xl font-semibold tracking-tight text-white">
                        {formatPrice(tier.price[frequency.value], language)}
                      </span>
                      <span className="text-sm/6 font-semibold text-gray-400">
                        {frequency.suffix}
                      </span>
                    </p>
                  ))}
                  {frequencies.map((frequency) => (
                    <Link
                      key={frequency.value}
                      href={`/sign-up?type=parent&tier=${tier.id}&interval=${frequency.value}`}
                      aria-describedby={headingId}
                      className={`mt-6 block w-full rounded-md bg-white/10 px-3 py-2 text-center text-sm/6 font-semibold text-white inset-ring inset-ring-white/5 group-data-featured/tier:bg-indigo-500 group-data-featured/tier:inset-ring-0 hover:bg-white/20 group-data-featured/tier:hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 group-not-data-featured/tier:focus-visible:outline-white/75 ${HIDDEN_UNLESS[frequency.value]}`}
                    >
                      {messages.choose.replace("{tier}", copy.name)}
                    </Link>
                  ))}
                  <ul role="list" className="mt-8 space-y-3 text-sm/6 text-gray-300 xl:mt-10">
                    {copy.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}
