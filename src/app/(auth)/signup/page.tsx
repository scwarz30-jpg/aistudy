"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email");
      const password = formData.get("password");

      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email: typeof email === "string" ? email : "",
        password: typeof password === "string" ? password : "",
      });

      if (error) {
        setErrorMessage(
          "We could not create your account. Double-check your details and try again.",
        );
        return;
      }

      if (!data.session) {
        setSuccessMessage(
          "Check your email to confirm the account request before continuing.",
        );
        return;
      }

      router.replace("/onboarding");
    } catch {
      setErrorMessage(
        "Something went wrong while creating the account. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sky-600">Sign up</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Start managing your health
          </h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Create your account with an email address and password, then move
            straight into onboarding.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />

          {successMessage ? (
            <Notice tone="success" title="Check your email">
              {successMessage}
            </Notice>
          ) : null}

          {errorMessage ? (
            <Notice tone="error" title="Sign-up failed">
              {errorMessage}
            </Notice>
          ) : null}

          <Button type="submit" pending={isPending}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link className="font-semibold text-sky-600" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
