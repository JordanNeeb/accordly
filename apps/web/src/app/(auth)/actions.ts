"use server";

import { type AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { AuthMessages } from "@/lib/auth/messages";
import {
  type ActionResult,
  type FieldErrors,
  hasErrors,
  readText,
  validateEmail,
  validateNewPassword,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
]);

// Maps Supabase errors we expect to friendly messages; anything else is logged
// and shown as a generic failure. Raw Supabase messages never reach the UI.
function unexpected(action: string, error: AuthError | Error): ActionResult {
  const code = "code" in error ? error.code : undefined;
  console.error(`[auth] ${action} failed`, { code, message: error.message });
  return { formError: AuthMessages.errors.unexpected };
}

export async function signUp(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { email, error: emailError } = validateEmail(readText(formData, "email"));
  const password = readText(formData, "password");
  const fieldErrors: FieldErrors = {
    email: emailError,
    password: validateNewPassword(password),
  };
  const values = { email };
  if (hasErrors(fieldErrors)) return { fieldErrors, values };

  const supabase = await createClient();
  // Names are added on the profile page after sign-up.
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.code === "weak_password") {
      return { fieldErrors: { password: AuthMessages.errors.passwordWeak }, values };
    }
    if (error.code && RATE_LIMIT_CODES.has(error.code)) {
      return { formError: AuthMessages.errors.rateLimited, values };
    }
    return { ...unexpected("signUp", error), values };
  }

  // Supabase answers the same way for an email that is already registered, so
  // this notice never reveals whether an account exists.
  return { notice: AuthMessages.signUp.checkEmail };
}

export async function signIn(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { email, error: emailError } = validateEmail(readText(formData, "email"));
  const password = readText(formData, "password");
  const fieldErrors: FieldErrors = {
    email: emailError,
    password: password ? undefined : AuthMessages.errors.passwordRequired,
  };
  const values = { email };
  if (hasErrors(fieldErrors)) return { fieldErrors, values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials") {
      return { formError: AuthMessages.errors.invalidCredentials, values };
    }
    if (error.code === "email_not_confirmed") {
      return {
        formError: AuthMessages.errors.emailNotConfirmed,
        unconfirmed: true,
        values,
      };
    }
    if (error.code && RATE_LIMIT_CODES.has(error.code)) {
      return { formError: AuthMessages.errors.rateLimited, values };
    }
    return { ...unexpected("signIn", error), values };
  }

  redirect("/profile");
}

export async function resendConfirmation(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { email, error: emailError } = validateEmail(readText(formData, "email"));
  if (emailError) return { fieldErrors: { email: emailError } };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    if (error.code && RATE_LIMIT_CODES.has(error.code)) {
      return { formError: AuthMessages.errors.rateLimited, unconfirmed: true };
    }
    return { ...unexpected("resendConfirmation", error), unconfirmed: true };
  }

  return { notice: AuthMessages.notices.confirmationSent };
}

export async function requestPasswordReset(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { email, error: emailError } = validateEmail(readText(formData, "email"));
  const values = { email };
  if (emailError) return { fieldErrors: { email: emailError }, values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    if (error.code && RATE_LIMIT_CODES.has(error.code)) {
      return { formError: AuthMessages.errors.rateLimited, values };
    }
    return { ...unexpected("requestPasswordReset", error), values };
  }

  // Same notice whether or not the account exists.
  return { notice: AuthMessages.forgotPassword.sent };
}

export async function updatePassword(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const password = readText(formData, "password");
  const passwordError = validateNewPassword(password);
  if (passwordError) return { fieldErrors: { password: passwordError } };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) return { formError: AuthMessages.errors.sessionExpired };

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.code === "weak_password") {
      return { fieldErrors: { password: AuthMessages.errors.passwordWeak } };
    }
    if (error.code === "same_password") {
      return { fieldErrors: { password: AuthMessages.errors.passwordSame } };
    }
    return unexpected("updatePassword", error);
  }

  redirect("/profile?notice=password-updated");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) unexpected("signOut", error);
  redirect("/sign-in");
}
