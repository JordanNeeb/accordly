"use client";

import { getMessages, type Language, type Messages } from "@tango/shared";
import { createContext, type ReactNode, useContext } from "react";

const LanguageContext = createContext<Language>("en");

// Gives client components the page's language, set once in the root layout.
export function LanguageProvider({ lang, children }: { lang: Language; children: ReactNode }) {
  return <LanguageContext value={lang}>{children}</LanguageContext>;
}

export function useLanguage(): Language {
  return useContext(LanguageContext);
}

export function useMessages(): Messages {
  return getMessages(useLanguage());
}
