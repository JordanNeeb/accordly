import { isLanguage, type Language } from "@tango/shared";

// Holds the visitor's language. It is a display preference, never an
// authorization input; any value other than a supported language is ignored.
export const LANGUAGE_COOKIE = "tango-lang";

export const LANGUAGE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
} as const;

// The highest-ranked supported language in an Accept-Language header
// ("fr-CA,fr;q=0.9,en;q=0.8"), or English when none is supported.
export function preferredLanguage(header: string | null): Language {
  let best: { lang: Language; q: number } | undefined;
  for (const part of (header ?? "").split(",")) {
    const [tag, ...params] = part.trim().split(";");
    const lang = tag.split("-")[0].toLowerCase();
    if (!isLanguage(lang)) continue;
    const qParam = params.find((p) => p.trim().startsWith("q="));
    const q = qParam ? Number(qParam.trim().slice(2)) : 1;
    if (Number.isFinite(q) && q > 0 && (!best || q > best.q)) best = { lang, q };
  }
  return best?.lang ?? "en";
}
