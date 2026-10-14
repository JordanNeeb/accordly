"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";

import { resendConfirmation, signIn } from "@/app/(auth)/actions";
import { AuthMessages } from "@/lib/auth/messages";
import { type ActionResult } from "@/lib/auth/validation";

import { FormAlert, SubmitButton, TextField } from "./fields";
import { GoogleSignInButton } from "./google-sign-in-button";
import { linkClass, textButtonClass } from "./styles";
import { useFocusFirstError } from "./use-focus-first-error";

export function SignInForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(signIn, {});
  const [resendState, resendAction] = useActionState<ActionResult, FormData>(
    resendConfirmation,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);

  const showResend = state.unconfirmed && !resendState.notice;

  return (
    <div className="space-y-6">
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

        <TextField
          id="password"
          name="password"
          type="password"
          label={AuthMessages.fields.password}
          autoComplete="current-password"
          error={state.fieldErrors?.password}
          labelAction={
            <Link href="/forgot-password" className={`text-sm/6 ${linkClass}`}>
              {AuthMessages.signIn.forgotPassword}
            </Link>
          }
        />

        <SubmitButton
          label={AuthMessages.signIn.submit}
          pendingLabel={AuthMessages.signIn.submitting}
        />
      </form>

      {showResend ? (
        <form action={resendAction} className="text-center">
          <input type="hidden" name="email" value={state.values?.email ?? ""} />
          <SubmitButton
            label={AuthMessages.signIn.resend}
            pendingLabel={AuthMessages.signIn.resending}
            className={textButtonClass}
          />
        </form>
      ) : null}
      <FormAlert error={resendState.formError} notice={resendState.notice} />

      <GoogleSignInButton />
    </div>
  );
}
