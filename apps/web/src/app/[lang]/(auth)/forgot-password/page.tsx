import { type Metadata } from "next";
import Link from "next/link";

import { AuthSimple } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { linkClass } from "@/components/auth/styles";
import { pageMessages } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/forgot-password">): Promise<Metadata> {
  const { auth } = await pageMessages(params);
  return { title: auth.forgotPassword.title };
}

export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[lang]/forgot-password">) {
  const { auth } = await pageMessages(params);
  return (
    <AuthSimple
      title={auth.forgotPassword.title}
      description={auth.forgotPassword.description}
      footer={
        <Link href="/sign-in" className={linkClass}>
          {auth.forgotPassword.backToSignIn}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthSimple>
  );
}
