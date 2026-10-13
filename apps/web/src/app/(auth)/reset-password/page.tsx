import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthSimple } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthMessages } from "@/lib/auth/messages";
import { getUserId } from "@/lib/supabase/server";

export const metadata: Metadata = { title: AuthMessages.resetPassword.title };

// The recovery email link signs the parent in; without that session there is
// nothing to reset.
async function RequireRecoverySession() {
  if (!(await getUserId())) redirect("/forgot-password");
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <AuthSimple title={AuthMessages.resetPassword.title}>
      <Suspense fallback={null}>
        <RequireRecoverySession />
      </Suspense>
    </AuthSimple>
  );
}
