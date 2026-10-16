import { type Messages } from "@tango/shared";
import Link from "next/link";

import { Button } from "@/components/catalyst/button";
import { Logo } from "@/components/common/logo";

type Option = Messages["onboarding"]["accountType"]["parent"];

// Ported from the Tailwind Plus two-column section
// (design/references/tailwind-plus/marketing/user-type-select.jsx). Each
// column's logo becomes the option's title, its quote the description, and its
// attribution the button. Dark in both themes, like the landing hero.
export function AccountTypeChoice({
  messages,
  signIn,
}: {
  messages: Messages["onboarding"]["accountType"];
  signIn: { prompt: string; link: string };
}) {
  return (
    <div className="min-h-dvh bg-gray-900">
      <header className="mx-auto max-w-7xl px-6 pt-10 lg:px-8">
        <Logo onDark />
      </header>
      <main className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">
              {messages.title}
            </h1>
            <p className="mt-6 text-lg/8 text-pretty text-gray-400">{messages.description}</p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div className="flex flex-col pb-10 sm:pb-16 lg:pr-8 lg:pb-0 xl:pr-20">
              <OptionContent option={messages.parent} href="/pricing" />
            </div>
            <div className="flex flex-col border-t border-white/10 pt-10 sm:pt-16 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 xl:pl-20">
              <OptionContent option={messages.professional} href="/sign-up?type=professional" />
            </div>
          </div>
          <p className="mt-16 text-center text-sm/6 text-gray-400 sm:mt-20">
            {signIn.prompt}{" "}
            <Link href="/sign-in" className="font-semibold text-indigo-400 hover:text-indigo-300">
              {signIn.link}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function OptionContent({ option, href }: { option: Option; href: string }) {
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-white">{option.label}</h2>
      <div className="mt-6 flex flex-auto flex-col justify-between">
        <p className="text-lg/8 text-gray-100">{option.description}</p>
        <div className="mt-10">
          <Button color="indigo" href={href}>
            {option.action}
          </Button>
        </div>
      </div>
    </>
  );
}
