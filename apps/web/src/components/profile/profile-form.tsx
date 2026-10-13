"use client";

import { useActionState, useRef } from "react";

import { updateProfile } from "@/app/profile/actions";
import { FormAlert, SubmitButton, TextField } from "@/components/auth/fields";
import {
  hintTextClass,
  labelClass,
  readOnlyInputClass,
  saveButtonClass,
} from "@/components/auth/styles";
import { useFocusFirstError } from "@/components/auth/use-focus-first-error";
import { AuthMessages } from "@/lib/auth/messages";
import { type ActionResult } from "@/lib/auth/validation";

type ProfileFormProps = {
  email: string;
  firstName: string;
  lastName: string;
  notice?: string;
};

// Layout from the Tailwind Plus settings form, trimmed to the profile fields.
export function ProfileForm({ email, firstName, lastName, notice }: ProfileFormProps) {
  const [state, formAction] = useActionState<ActionResult, FormData>(updateProfile, {
    notice,
  });
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);

  // Prompt until both names have been saved.
  const saved = state.notice === AuthMessages.profile.saved;
  const needsName = !saved && (!firstName || !lastName);

  return (
    <form ref={formRef} action={formAction} noValidate>
      <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
        <h1 className="text-base/7 font-semibold text-gray-900 dark:text-white">
          {AuthMessages.profile.title}
        </h1>
        <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
          {AuthMessages.profile.description}
        </p>

        <div className="mt-6 space-y-4">
          {needsName ? (
            <p className="rounded-md bg-indigo-50 p-4 text-sm text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300">
              {AuthMessages.profile.completePrompt}
            </p>
          ) : null}
          <FormAlert error={state.formError} notice={state.notice} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label htmlFor="email" className={labelClass}>
              {AuthMessages.fields.email}
            </label>
            <div className="mt-2">
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                aria-describedby="email-hint"
                className={readOnlyInputClass}
              />
            </div>
            <p id="email-hint" className={hintTextClass}>
              {AuthMessages.profile.emailHint}
            </p>
          </div>

          <div className="sm:col-span-3">
            <TextField
              id="firstName"
              name="firstName"
              label={AuthMessages.fields.firstName}
              autoComplete="given-name"
              defaultValue={state.values?.firstName ?? firstName}
              error={state.fieldErrors?.firstName}
            />
          </div>

          <div className="sm:col-span-3">
            <TextField
              id="lastName"
              name="lastName"
              label={AuthMessages.fields.lastName}
              autoComplete="family-name"
              defaultValue={state.values?.lastName ?? lastName}
              error={state.fieldErrors?.lastName}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <SubmitButton
          label={AuthMessages.profile.save}
          pendingLabel={AuthMessages.profile.saving}
          className={saveButtonClass}
        />
      </div>
    </form>
  );
}
