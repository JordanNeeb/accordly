"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { LanguageIcon } from "@heroicons/react/24/outline";
import { type Language } from "@tango/shared";
import { useActionState, useId } from "react";

import { type LanguageResult, setLanguage } from "@/lib/i18n/actions";
import { useLanguage, useMessages } from "@/lib/i18n/language-provider";

// Each language is named in its own language, whichever one is active.
export const LANGUAGES: { lang: Language; name: string }[] = [
  { lang: "en", name: "English" },
  { lang: "fr", name: "Français" },
];

// Language picker: the Tailwind Plus dropdown from the dashboard's account
// menu, opened by a language icon. `onDark` uses the dark menu on surfaces that
// are dark in both themes.
export function LanguageMenu({ onDark = false }: { onDark?: boolean }) {
  const lang = useLanguage();
  const messages = useMessages();
  const formId = useId();
  const [state, formAction, pending] = useActionState<LanguageResult, FormData>(
    setLanguage,
    {},
  );

  return (
    <div className="relative">
      {/* The form lives outside the menu, which unmounts its items when closed. */}
      <form id={formId} action={formAction} />
      <Menu as="div" className="relative">
        <MenuButton
          disabled={pending}
          className={`relative -m-2.5 flex p-2.5 disabled:opacity-60 ${
            onDark
              ? "text-gray-400 hover:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          <span className="sr-only">{messages.languageMenu.label}</span>
          <LanguageIcon aria-hidden="true" className="size-6" />
        </MenuButton>
        <MenuItems
          transition
          anchor="bottom end"
          className={`z-50 w-36 origin-top-right rounded-md py-2 [--anchor-gap:--spacing(2.5)] transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in ${
            onDark
              ? "bg-gray-800 outline -outline-offset-1 outline-white/10"
              : "bg-white shadow-lg outline outline-gray-900/5 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
          }`}
        >
          {LANGUAGES.map((item) => (
            <MenuItem key={item.lang} disabled={item.lang === lang}>
              <button
                type="submit"
                form={formId}
                name="lang"
                value={item.lang}
                lang={item.lang}
                disabled={item.lang === lang}
                aria-current={item.lang === lang ? "true" : undefined}
                className={`flex w-full items-center justify-between px-3 py-1 text-left text-sm/6 data-focus:outline-hidden ${
                  onDark
                    ? "text-white data-focus:bg-white/5"
                    : "text-gray-900 data-focus:bg-gray-50 dark:text-white dark:data-focus:bg-white/5"
                }`}
              >
                {item.name}
                {item.lang === lang ? (
                  <CheckIcon aria-hidden="true" className="size-4 text-indigo-500" />
                ) : null}
              </button>
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>
      {state.formError ? (
        <p
          role="alert"
          className="absolute top-full right-0 z-50 mt-3 w-max max-w-xs rounded-md bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {state.formError}
        </p>
      ) : null}
    </div>
  );
}
