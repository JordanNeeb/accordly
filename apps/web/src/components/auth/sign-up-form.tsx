"use client";

import { useActionState, useRef } from "react";

import { signUp } from "@/app/(auth)/actions";
import { AuthMessages } from "@/lib/auth/messages";
import { type ActionResult } from "@/lib/auth/validation";

import { FormAlert, SubmitButton, TextField } from "./fields";
import { GoogleSignInButton } from "./google-sign-in-button";
import { useFocusFirstError } from "./use-focus-first-error";

export function SignUpForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(signUp, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);

  if (state.notice) return <FormAlert notice={state.notice} />;

  return (
    <>
      <form ref={formRef} action={formAction} noValidate className="space-y-6">
        <FormAlert error={state.formError} />

        <TextField
          id="name"
          name="name"
          label={AuthMessages.fields.name}
          autoComplete="name"
          defaultValue={state.values?.name}
          error={state.fieldErrors?.name}
        />

        <TextField
          id="email"
          name="email"
          type="email"
          label={AuthMessages.fields.email}
          autoComplete="email"
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
        />

        <TextField
          id="password"
          name="password"
          type="password"
          label={AuthMessages.fields.password}
          autoComplete="new-password"
          error={state.fieldErrors?.password}
          hint={AuthMessages.fields.passwordHint}
        />

        <SubmitButton
          label={AuthMessages.signUp.submit}
          pendingLabel={AuthMessages.signUp.submitting}
        />
      </form>

      <GoogleSignInButton />
    </>
  );
}
