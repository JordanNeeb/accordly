import { type ReactNode } from "react";

import { AuthMessages } from "@/lib/auth/messages";

// Card layout from the Tailwind Plus sign-in component. The logo images are
// replaced by a text wordmark until branding exists. Below `sm` the card has no
// panel, so the full-width form sits on the page background.
export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
          {AuthMessages.appName}
        </p>
        <h1 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="px-6 py-12 sm:rounded-lg sm:bg-white sm:px-12 sm:shadow-sm sm:dark:bg-gray-800/50 sm:dark:shadow-none sm:dark:outline sm:dark:-outline-offset-1 sm:dark:outline-white/10">
          {children}
        </div>

        {footer ? (
          <p className="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// Plain layout from the Tailwind Plus forgot-password component.
export function AuthSimple({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <p className="text-center text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
          {AuthMessages.appName}
        </p>
        <h1 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-center text-sm/6 text-gray-600 dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {children}
        {footer ? (
          <p className="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  );
}
