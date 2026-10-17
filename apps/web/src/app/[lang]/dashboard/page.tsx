import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ParentDashboard } from "@/components/dashboard/parent-dashboard";
import { ProfessionalDashboard } from "@/components/dashboard/professional-dashboard";
import { pageMessages, requestMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/dashboard">): Promise<Metadata> {
  const { dashboard } = await pageMessages(params);
  return { title: dashboard.title };
}

// Shows the user's name, falling back to their email when no name is saved or
// the profile can't be read. Professionals get the professional dashboard;
// parents and accounts without a type get the parent dashboard. A failed read
// shows an error in the bare shell rather than guessing which one to show.
async function Dashboard() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/sign-in");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name, account_type")
    .eq("id", claims.sub)
    .single();

  const userName = profile?.name?.trim() || (claims.email ?? "");

  if (error) {
    console.error("[dashboard] profile load failed", { code: error.code, message: error.message });
    const { auth } = await requestMessages();
    return (
      <DashboardShell userName={userName} navigation={[]}>
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-500/15 dark:text-red-300">
          {auth.errors.unexpected}
        </p>
      </DashboardShell>
    );
  }

  return profile.account_type === "professional" ? (
    <ProfessionalDashboard userName={userName} />
  ) : (
    <ParentDashboard userName={userName} />
  );
}

export default function DashboardPage() {
  return (
    // The fallback is the bare shell, since the dashboard type isn't known yet.
    <Suspense fallback={<DashboardShell userName="" navigation={[]} />}>
      <Dashboard />
    </Suspense>
  );
}
