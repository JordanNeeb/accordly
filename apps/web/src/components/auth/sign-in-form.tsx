"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";

import { resendConfirmation, signIn } from "@/app/[lang]/(auth)/actions";
import { useMessages } from "@/lib/i18n/language-provider";
import { type ActionResult } from "@/lib/auth/validation";

import { FormAlert, SubmitButton, TextField } from "./fields";
import { GoogleSignInButton } from "./google-sign-in-button";
import { linkClass, textButtonClass } from "./styles";
import { useFocusFirstError } from "./use-focus-first-error";

export function SignInForm() {
  const { auth } = useMessages();
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
          label={auth.fields.email}
          autoComplete="email"
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
        />

        <TextField
          id="password"
          name="password"
          type="password"
          label={auth.fields.password}
          autoComplete="current-password"
          error={state.fieldErrors?.password}
          labelAction={
            <Link href="/forgot-password" className={`text-sm/6 ${linkClass}`}>
              {auth.signIn.forgotPassword}
            </Link>
          }
        />

        <SubmitButton
          label={auth.signIn.submit}
          pendingLabel={auth.signIn.submitting}
        />
      </form>

      {showResend ? (
        <form action={resendAction} className="text-center">
          <input type="hidden" name="email" value={state.values?.email ?? ""} />
          <SubmitButton
            label={auth.signIn.resend}
            pendingLabel={auth.signIn.resending}
            className={textButtonClass}
          />
        </form>
      ) : null}
      <FormAlert error={resendState.formError} notice={resendState.notice} />

      <GoogleSignInButton />
    </div>
  );
}
