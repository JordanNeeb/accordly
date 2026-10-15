import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Google sends the parent back here with a one-time code (or an error, such as
// when they cancel). The destination is fixed, never taken from the URL.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/dashboard", request.url));
    console.error("[auth] exchangeCodeForSession failed", { code: error.code });
  }

  return NextResponse.redirect(new URL("/sign-in?error=google-failed", request.url));
}
