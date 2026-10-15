"use client";

import { useActionState, useRef } from "react";

import { updatePassword } from "@/app/[lang]/(auth)/actions";
import { useMessages } from "@/lib/i18n/language-provider";
import { type ActionResult } from "@/lib/auth/validation";

import { FormAlert, SubmitButton, TextField } from "./fields";
import { useFocusFirstError } from "./use-focus-first-error";

export function ResetPasswordForm() {
  const { auth } = useMessages();
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
        label={auth.fields.newPassword}
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        hint={auth.fields.passwordHint}
      />

      <SubmitButton
        label={auth.resetPassword.submit}
        pendingLabel={auth.resetPassword.submitting}
      />
    </form>
  );
}
