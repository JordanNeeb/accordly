import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { signOut } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/auth/fields";
import { textButtonClass } from "@/components/auth/styles";
import { Logo } from "@/components/common/logo";
import { ProfileForm } from "@/components/profile/profile-form";
import { AuthMessages } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: AuthMessages.profile.title };

async function Profile() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/sign-in");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", claims.sub)
    .single();

  if (error || !profile) {
    console.error("[profile] load failed", { code: error?.code, message: error?.message });
    return (
      <p className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-500/15 dark:text-red-300">
        {AuthMessages.errors.unexpected}
      </p>
    );
  }

  return (
    <ProfileForm
      email={claims.email ?? ""}
      name={profile.name ?? ""}
    />
  );
}

export default function ProfilePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <Logo />
        <form action={signOut}>
          <SubmitButton
            label={AuthMessages.profile.signOut}
            pendingLabel={AuthMessages.profile.signOut}
            className={textButtonClass}
          />
        </form>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {AuthMessages.profile.loading}
          </p>
        }
      >
        <Profile />
      </Suspense>
    </main>
  );
}
