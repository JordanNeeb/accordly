import "server-only";

import { type Database } from "@tango/shared";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

// One client per request. Call this inside a Suspense boundary, a Server
// Action, or a Route Handler. `connection()` marks everything after it as
// request-time: the auth client reads the clock (`Date.now()`) to check session
// expiry, which Next.js must not run while prerendering.
export async function createClient() {
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies; the proxy refreshes them.
          }
        },
      },
    },
  );
}

// The signed-in user's id from verified session claims, or null.
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}
