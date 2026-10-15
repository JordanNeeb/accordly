"use server";

import { AuthMessages } from "@/lib/auth/messages";
import {
  type ActionResult,
  type FieldErrors,
  hasErrors,
  readText,
  validateName,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { name, error: nameError } = validateName(
    readText(formData, "name"),
    AuthMessages.errors.nameLength,
  );
  const fieldErrors: FieldErrors = { name: nameError };
  const values = { name };
  if (hasErrors(fieldErrors)) return { fieldErrors, values };

  const supabase = await createClient();
  // The row id comes from the verified session, never the form; RLS also
  // limits updates to the signed-in parent's own profile.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { formError: AuthMessages.errors.signedOut, values };

  const { error } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", userId);

  if (error) {
    console.error("[profile] update failed", { code: error.code, message: error.message });
    return { formError: AuthMessages.errors.unexpected, values };
  }

  return { notice: AuthMessages.profile.saved, values };
}
