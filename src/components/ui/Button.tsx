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
    "border-2 border-[var(--border)] bg-[var(--accent)] text-[var(--foreground)] shadow-[0_3px_0_var(--border)] hover:bg-[var(--accent-strong)] disabled:bg-[var(--surface)] disabled:shadow-none",
  secondary:
    "border-2 border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-white disabled:text-[var(--muted)]",
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
      className={`inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] disabled:cursor-not-allowed ${variantClassNames[variant]} ${className}`.trim()}
      disabled={disabled || pending}
      aria-busy={pending}
      {...props}
    >
      {pending ? "처리 중..." : children}
    </button>
  );
}
