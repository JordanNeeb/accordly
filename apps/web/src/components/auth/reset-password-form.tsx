"use client";

import { useActionState, useRef } from "react";

import { updatePassword } from "@/app/(auth)/actions";
import { AuthMessages } from "@/lib/auth/messages";
import { type ActionResult } from "@/lib/auth/validation";

import { FormAlert, SubmitButton, TextField } from "./fields";
import { useFocusFirstError } from "./use-focus-first-error";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    updatePassword,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-6">
      <FormAlert error={state.formError} />

      <TextField
        id="password"
        name="password"
        type="password"
        label={AuthMessages.fields.newPassword}
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        hint={AuthMessages.fields.passwordHint}
      />

      <SubmitButton
        label={AuthMessages.resetPassword.submit}
        pendingLabel={AuthMessages.resetPassword.submitting}
      />
    </form>
  );
}
