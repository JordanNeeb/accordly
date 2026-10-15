"use client";

import { useActionState, useRef } from "react";

import { updateProfile } from "@/app/[lang]/profile/actions";
import { FormAlert, SubmitButton, TextField } from "@/components/auth/fields";
import {
  hintTextClass,
  labelClass,
  readOnlyInputClass,
  saveButtonClass,
} from "@/components/auth/styles";
import { useFocusFirstError } from "@/components/auth/use-focus-first-error";
import { useMessages } from "@/lib/i18n/language-provider";
import { type ActionResult } from "@/lib/auth/validation";

type ProfileFormProps = {
  email: string;
  name: string;
};

// Layout from the Tailwind Plus settings form, trimmed to the profile fields.
export function ProfileForm({ email, name }: ProfileFormProps) {
  const { auth } = useMessages();
  const [state, formAction] = useActionState<ActionResult, FormData>(updateProfile, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);

  // Prompt until a name has been saved.
  const saved = state.notice === auth.profile.saved;
  const needsName = !saved && !name;

  return (
    <form ref={formRef} action={formAction} noValidate>
      <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
        <h1 className="text-base/7 font-semibold text-gray-900 dark:text-white">
          {auth.profile.title}
        </h1>
        <p className="mt-1 text-sm/6 text-gray-600 dark:text-gray-400">
          {auth.profile.description}
        </p>

        <div className="mt-6 space-y-4">
          {needsName ? (
            <p className="rounded-md bg-indigo-50 p-4 text-sm text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300">
              {auth.profile.completePrompt}
            </p>
          ) : null}
          <FormAlert error={state.formError} notice={state.notice} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label htmlFor="email" className={labelClass}>
              {auth.fields.email}
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
              {auth.profile.emailHint}
            </p>
          </div>

          <div className="sm:col-span-4">
            <TextField
              id="name"
              name="name"
              label={auth.fields.name}
              autoComplete="name"
              defaultValue={state.values?.name ?? name}
              error={state.fieldErrors?.name}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <SubmitButton
          label={auth.profile.save}
          pendingLabel={auth.profile.saving}
          className={saveButtonClass}
        />
      </div>
    </form>
  );
}
