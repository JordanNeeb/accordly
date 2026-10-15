import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardMessages } from "@/lib/dashboard/messages";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: DashboardMessages.title };

// Shows the parent's name, falling back to their email when no name is saved
// or the profile can't be read. The name is non-essential, so a failed read is
// logged rather than shown.
async function Dashboard() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/sign-in");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", claims.sub)
    .single();

  if (error) {
    console.error("[dashboard] profile load failed", { code: error.code, message: error.message });
  }

  const name = [profile?.first_name, profile?.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return <DashboardShell userName={name || (claims.email ?? "")} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardShell userName="" />}>
      <Dashboard />
    </Suspense>
  );
}
