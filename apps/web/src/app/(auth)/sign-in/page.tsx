import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormAlert } from "@/components/auth/fields";
import { SignInForm } from "@/components/auth/sign-in-form";
import { linkClass } from "@/components/auth/styles";
import { AuthMessages } from "@/lib/auth/messages";

export const metadata: Metadata = { title: AuthMessages.signIn.submit };

// Only a known error or notice code from the URL maps to a message; the URL
// never supplies text.
const URL_ERRORS: Record<string, string> = {
  "link-invalid": AuthMessages.errors.linkInvalid,
  "google-failed": AuthMessages.errors.googleFailed,
};
const URL_NOTICES: Record<string, string> = {
  "password-updated": AuthMessages.notices.passwordUpdated,
};

function known(map: Record<string, string>, code: string | string[] | undefined) {
  return typeof code === "string" && Object.hasOwn(map, code) ? map[code] : undefined;
}

async function LinkNotice({ searchParams }: PageProps<"/sign-in">) {
  const { error, notice } = await searchParams;
  const errorMessage = known(URL_ERRORS, error);
  const noticeMessage = known(URL_NOTICES, notice);
  if (!errorMessage && !noticeMessage) return null;
  return <FormAlert error={errorMessage} notice={noticeMessage} />;
}

export default function SignInPage(props: PageProps<"/sign-in">) {
  return (
    <AuthCard
      title={AuthMessages.signIn.title}
      footer={
        <>
          {AuthMessages.signIn.noAccount}{" "}
          <Link href="/sign-up" className={linkClass}>
            {AuthMessages.signIn.createAccount}
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Suspense fallback={null}>
          <LinkNotice {...props} />
        </Suspense>
        <SignInForm />
      </div>
    </AuthCard>
  );
}
