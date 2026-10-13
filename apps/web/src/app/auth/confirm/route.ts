import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Where each email link lands after it is verified. The destination is fixed
// per link type, never taken from the URL, so this can't be an open redirect.
const DESTINATIONS: Partial<Record<EmailOtpType, string>> = {
  email: "/profile",
  recovery: "/reset-password",
};

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const destination = type ? DESTINATIONS[type] : undefined;

  if (tokenHash && type && destination) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.redirect(new URL("/sign-in?error=link-invalid", request.url));
}
