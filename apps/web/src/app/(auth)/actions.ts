"use server";

import { type AuthError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthMessages } from "@/lib/auth/messages";
import {
  type ActionResult,
  type FieldErrors,
  hasErrors,
  readText,
  validateEmail,
  validateName,
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
  const { name, error: nameError } = validateName(
    readText(formData, "name"),
    AuthMessages.errors.nameLength,
  );
  const { email, error: emailError } = validateEmail(readText(formData, "email"));
  const password = readText(formData, "password");
  const fieldErrors: FieldErrors = {
    name: nameError,
    email: emailError,
    password: validateNewPassword(password),
  };
  const values = { name, email };
  if (hasErrors(fieldErrors)) return { fieldErrors, values };

  const supabase = await createClient();
  // The sign-up trigger copies the name into the new profile.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

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

  redirect("/dashboard");
}

// Starts Google's OAuth flow (PKCE; the code verifier is stored in a cookie).
// Google returns to /auth/callback on this origin; Supabase's redirect
// allow-list still applies, and nothing from the form shapes the URL.
export async function signInWithGoogle(): Promise<ActionResult> {
  const origin = (await headers()).get("origin");
  if (!origin) return { formError: AuthMessages.errors.googleFailed };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    if (error) unexpected("signInWithGoogle", error);
    return { formError: AuthMessages.errors.googleFailed };
  }

  redirect(data.url);
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

  // The parent signs in again with the new password. A failed sign-out is
  // logged but doesn't block: the password has already changed, and the proxy
  // sends a still-signed-in parent from /sign-in on to /dashboard.
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) unexpected("updatePassword signOut", signOutError);
  redirect("/sign-in?notice=password-updated");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) unexpected("signOut", error);
  redirect("/sign-in");
}
