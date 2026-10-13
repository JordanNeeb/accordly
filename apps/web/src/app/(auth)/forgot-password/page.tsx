import { type Metadata } from "next";
import Link from "next/link";

import { AuthSimple } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { linkClass } from "@/components/auth/styles";
import { AuthMessages } from "@/lib/auth/messages";

export const metadata: Metadata = { title: AuthMessages.forgotPassword.title };

export default function ForgotPasswordPage() {
  return (
    <AuthSimple
      title={AuthMessages.forgotPassword.title}
      description={AuthMessages.forgotPassword.description}
      footer={
        <Link href="/sign-in" className={linkClass}>
          {AuthMessages.forgotPassword.backToSignIn}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthSimple>
  );
}
