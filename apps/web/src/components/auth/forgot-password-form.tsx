"use client";

import { useActionState, useRef } from "react";

import { requestPasswordReset } from "@/app/[lang]/(auth)/actions";
import { useMessages } from "@/lib/i18n/language-provider";
import { type ActionResult } from "@/lib/auth/validation";

import { FormAlert, SubmitButton, TextField } from "./fields";
import { useFocusFirstError } from "./use-focus-first-error";

export function ForgotPasswordForm() {
  const { auth } = useMessages();
  const [state, formAction] = useActionState<ActionResult, FormData>(
    requestPasswordReset,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);

  if (state.notice) return <FormAlert notice={state.notice} />;

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-6">
      <FormAlert error={state.formError} />

      <TextField
        id="email"
        name="email"
        type="email"
        label={auth.fields.email}
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />

      <SubmitButton
        label={auth.forgotPassword.submit}
        pendingLabel={auth.forgotPassword.submitting}
      />
    </form>
  );
}
