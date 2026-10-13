"use client";

import { type RefObject, useEffect } from "react";

import { type ActionResult } from "@/lib/auth/validation";

// After a submission returns field errors, move focus to the first invalid field.
export function useFocusFirstError(
  formRef: RefObject<HTMLFormElement | null>,
  state: ActionResult,
) {
  useEffect(() => {
    if (!state.fieldErrors) return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [formRef, state]);
}
