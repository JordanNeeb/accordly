import { type Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { linkClass } from "@/components/auth/styles";
import { AuthMessages } from "@/lib/auth/messages";

export const metadata: Metadata = { title: AuthMessages.signUp.submit };

export default function SignUpPage() {
  return (
    <AuthCard
      title={AuthMessages.signUp.title}
      footer={
        <>
          {AuthMessages.signUp.haveAccount}{" "}
          <Link href="/sign-in" className={linkClass}>
            {AuthMessages.signUp.signIn}
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
