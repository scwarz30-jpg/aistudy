"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type BaseProps = {
  error?: string;
  hint?: ReactNode;
  label: string;
  name: string;
  textarea?: boolean;
};

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextField(props: InputProps | TextareaProps) {
  const { error, hint, label, name, textarea = false, ...fieldProps } = props;
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  const sharedClassName =
    "min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          className={`${sharedClassName} min-h-28 resize-y`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...(fieldProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={name}
          name={name}
          className={sharedClassName}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...(fieldProps as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {hint ? (
        <span id={`${name}-hint`} className="text-xs text-[var(--muted)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${name}-error`} className="text-xs text-rose-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
