import { type Messages } from "@tango/shared";
import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { signOut } from "@/app/[lang]/(auth)/actions";
import { SubmitButton } from "@/components/auth/fields";
import { textButtonClass } from "@/components/auth/styles";
import { Logo } from "@/components/common/logo";
import { ProfileForm } from "@/components/profile/profile-form";
import { pageMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/profile">): Promise<Metadata> {
  const { auth } = await pageMessages(params);
  return { title: auth.profile.title };
}

async function Profile({ auth }: { auth: Messages["auth"] }) {
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
        {auth.errors.unexpected}
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

export default async function ProfilePage({ params }: PageProps<"/[lang]/profile">) {
  const { auth } = await pageMessages(params);
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <Logo href="/dashboard" />
        <form action={signOut}>
          <SubmitButton
            label={auth.profile.signOut}
            pendingLabel={auth.profile.signOut}
            className={textButtonClass}
          />
        </form>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {auth.profile.loading}
          </p>
        }
      >
        <Profile auth={auth} />
      </Suspense>
    </main>
  );
}
