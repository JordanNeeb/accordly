import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthSimple } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { pageMessages } from "@/lib/i18n/server";
import { getUserId } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/reset-password">): Promise<Metadata> {
  const { auth } = await pageMessages(params);
  return { title: auth.resetPassword.title };
}

// The recovery email link signs the parent in; without that session there is
// nothing to reset.
async function RequireRecoverySession() {
  if (!(await getUserId())) redirect("/forgot-password");
  return <ResetPasswordForm />;
}

export default async function ResetPasswordPage({
  params,
}: PageProps<"/[lang]/reset-password">) {
  const { auth } = await pageMessages(params);
  return (
    <AuthSimple title={auth.resetPassword.title}>
      <Suspense fallback={null}>
        <RequireRecoverySession />
      </Suspense>
    </AuthSimple>
  );
}
