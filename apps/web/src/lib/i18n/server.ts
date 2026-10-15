import "server-only";

import { type SupabaseClient } from "@supabase/supabase-js";
import {
  type Database,
  getMessages,
  isLanguage,
  type Language,
  type Messages,
} from "@tango/shared";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { LANGUAGE_COOKIE, LANGUAGE_COOKIE_OPTIONS } from "./language";

// The language of a page, from the `[lang]` segment the proxy rewrites to.
export async function pageLanguage(params: Promise<{ lang: string }>): Promise<Language> {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();
  return lang;
}

export async function pageMessages(params: Promise<{ lang: string }>): Promise<Messages> {
  return getMessages(await pageLanguage(params));
}

// The language for Server Actions and Route Handlers, which have no `[lang]`
// param. The proxy sets the cookie on every page request.
export async function requestLanguage(): Promise<Language> {
  const value = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  return isLanguage(value) ? value : "en";
}

export async function requestMessages(): Promise<Messages> {
  return getMessages(await requestLanguage());
}

// After sign-in, switches this browser to the parent's saved language. A failed
// read is logged and the current language is kept; sign-in still succeeds.
export async function restoreProfileLanguage(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("profiles")
    .select("language")
    .eq("id", userId)
    .single();
  if (error || !isLanguage(data.language)) {
    console.error("[i18n] profile language read failed", { code: error?.code, message: error?.message });
    return;
  }
  (await cookies()).set(LANGUAGE_COOKIE, data.language, LANGUAGE_COOKIE_OPTIONS);
}
