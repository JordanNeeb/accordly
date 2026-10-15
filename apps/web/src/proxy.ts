import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Signed-out visitors to these pages go to the paired page.
const SIGNED_IN_ONLY: Record<string, string> = {
  "/dashboard": "/sign-in",
  "/profile": "/sign-in",
  "/reset-password": "/forgot-password",
};
// Signed-in visitors to these pages go to their dashboard.
const SIGNED_OUT_ONLY = ["/", "/sign-in", "/sign-up"];

// Refreshes the Supabase session cookie on every page request and routes
// visitors by session state. Pages still verify the session themselves; this
// check is only optimistic.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims.sub);
  const { pathname } = request.nextUrl;

  const target = signedIn
    ? SIGNED_OUT_ONLY.includes(pathname)
      ? "/dashboard"
      : undefined
    : SIGNED_IN_ONLY[pathname];

  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
