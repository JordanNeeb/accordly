import { type Metadata } from "next";

import { AccountTypeChoice } from "@/components/onboarding/account-type-choice";
import { pageMessages } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/get-started">): Promise<Metadata> {
  const { onboarding } = await pageMessages(params);
  return { title: onboarding.accountType.title };
}

export default async function GetStartedPage({ params }: PageProps<"/[lang]/get-started">) {
  const { onboarding, auth } = await pageMessages(params);
  return (
    <AccountTypeChoice
      messages={onboarding.accountType}
      signIn={{ prompt: auth.signUp.haveAccount, link: auth.signUp.signIn }}
    />
  );
}
