import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormAlert } from "@/components/auth/fields";
import { SignInForm } from "@/components/auth/sign-in-form";
import { linkClass } from "@/components/auth/styles";
import { AuthMessages } from "@/lib/auth/messages";

export const metadata: Metadata = { title: AuthMessages.signIn.submit };

// Only a known error code from the URL maps to a message; the URL never
// supplies text.
async function LinkNotice({ searchParams }: PageProps<"/sign-in">) {
  const { error } = await searchParams;
  if (error !== "link-invalid") return null;
  return <FormAlert error={AuthMessages.errors.linkInvalid} />;
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
