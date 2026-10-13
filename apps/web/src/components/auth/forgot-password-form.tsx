"use client";

import { useActionState, useRef } from "react";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { AuthMessages } from "@/lib/auth/messages";
import { type ActionResult } from "@/lib/auth/validation";

import { FormAlert, SubmitButton, TextField } from "./fields";
import { useFocusFirstError } from "./use-focus-first-error";

export function ForgotPasswordForm() {
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
        label={AuthMessages.fields.email}
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />

      <SubmitButton
        label={AuthMessages.forgotPassword.submit}
        pendingLabel={AuthMessages.forgotPassword.submitting}
      />
    </form>
  );
}
