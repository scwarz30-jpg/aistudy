"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pending?: boolean;
  variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-600 text-white shadow-sm hover:bg-sky-500 disabled:bg-sky-300",
  secondary:
    "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-white disabled:text-[var(--muted)]",
};

export function Button({
  children,
  className = "",
  pending = false,
  type = "button",
  variant = "primary",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed ${variantClassNames[variant]} ${className}`.trim()}
      disabled={disabled || pending}
      aria-busy={pending}
      {...props}
    >
      {pending ? "처리 중..." : children}
    </button>
  );
}
