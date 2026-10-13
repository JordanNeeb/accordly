"use client";

import { type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  errorTextClass,
  hintTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "./styles";

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
};

function describedBy(id: string, error?: string, hint?: string) {
  const ids = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function TextField({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  error,
  hint,
  labelAction,
}: TextFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className="mt-2">
        <input
          id={id}
          name={name}
          type={type}
          required
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={inputClass}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className={errorTextClass}>
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className={hintTextClass}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  label,
  pendingLabel,
  className = primaryButtonClass,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

// Announces form-level errors and notices to assistive technology.
export function FormAlert({ error, notice }: { error?: string; notice?: string }) {
  return (
    <div aria-live="polite" role="status">
      {error ? (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-500/15 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-500/15 dark:text-green-300">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
