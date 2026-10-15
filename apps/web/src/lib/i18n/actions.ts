"use server";

import { isLanguage } from "@tango/shared";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { LANGUAGE_COOKIE, LANGUAGE_COOKIE_OPTIONS } from "./language";
import { requestMessages } from "./server";

export type LanguageResult = { formError?: string };

// Switches the visitor's language. A signed-in parent's choice is saved to
// their profile first; if that fails, nothing changes, so the cookie and the
// profile never disagree. The proxy picks the language when a request arrives,
// so the action then redirects back to the page for a fresh request in the new
// language.
export async function setLanguage(
  _previous: LanguageResult,
  formData: FormData,
): Promise<LanguageResult> {
  const { auth } = await requestMessages();
  const lang = formData.get("lang");
  if (!isLanguage(lang)) return { formError: auth.errors.unexpected };

  const supabase = await createClient();
  // The row id comes from the verified session, never the form; RLS also
  // limits updates to the signed-in parent's own profile.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (userId) {
    const { error } = await supabase
      .from("profiles")
      .update({ language: lang })
      .eq("id", userId);
    if (error) {
      console.error("[i18n] language update failed", { code: error.code, message: error.message });
      return { formError: auth.errors.unexpected };
    }
  }

  (await cookies()).set(LANGUAGE_COOKIE, lang, LANGUAGE_COOKIE_OPTIONS);
  redirect(await currentPath());
}

// The path of the page the menu was used on. Only the path of the Referer is
// kept, and a protocol-relative "//host" path falls back to "/", so this can
// never redirect off the site.
async function currentPath(): Promise<string> {
  const referer = (await headers()).get("referer");
  if (!referer) return "/";
  try {
    const { pathname } = new URL(referer);
    return pathname.startsWith("//") ? "/" : pathname;
  } catch {
    return "/";
  }
}
