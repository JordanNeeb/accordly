import { type Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { linkClass } from "@/components/auth/styles";
import { pageMessages } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sign-up">): Promise<Metadata> {
  const { auth } = await pageMessages(params);
  return { title: auth.signUp.submit };
}

export default async function SignUpPage({ params }: PageProps<"/[lang]/sign-up">) {
  const { auth } = await pageMessages(params);
  return (
    <AuthCard
      title={auth.signUp.title}
      footer={
        <>
          {auth.signUp.haveAccount}{" "}
          <Link href="/sign-in" className={linkClass}>
            {auth.signUp.signIn}
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
