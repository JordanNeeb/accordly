import { AuthMessages } from "./messages";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthField = "firstName" | "lastName" | "email" | "password";

export type FieldErrors = Partial<Record<AuthField, string>>;

export type ActionResult = {
  fieldErrors?: FieldErrors;
  formError?: string;
  notice?: string;
  // Lets the sign-in form offer "resend confirmation" only when it applies.
  unconfirmed?: boolean;
  // Submitted values to re-show after React resets the form. Never passwords.
  values?: { firstName?: string; lastName?: string; email?: string };
};

export function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function validateEmail(raw: string): { email: string; error?: string } {
  const email = raw.trim();
  if (!email) return { email, error: AuthMessages.errors.emailRequired };
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { email, error: AuthMessages.errors.emailInvalid };
  }
  return { email };
}

// Sign-in only checks presence; length rules apply when a password is set.
export function validateNewPassword(password: string): string | undefined {
  if (password.length < 8 || password.length > 72) {
    return AuthMessages.errors.passwordLength;
  }
  return undefined;
}

// First and last name: required when saved, 1-100 characters after trimming.
export function validateName(
  raw: string,
  error: string,
): { name: string; error?: string } {
  const name = raw.trim();
  if (name.length < 1 || name.length > 100) return { name, error };
  return { name };
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
