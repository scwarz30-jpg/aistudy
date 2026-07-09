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
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email: typeof email === "string" ? email : "",
      password: typeof password === "string" ? password : "",
    });

    setIsPending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/onboarding");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sky-600">회원가입</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            건강 관리 시작하기
          </h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            이메일과 비밀번호를 등록한 뒤 바로 온보딩으로 이동합니다.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <TextField
            label="이메일"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <TextField
            label="비밀번호"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상"
            required
          />

          {errorMessage ? (
            <Notice tone="error" title="가입에 실패했습니다">
              {errorMessage}
            </Notice>
          ) : null}

          <Button type="submit" pending={isPending}>
            계정 만들기
          </Button>
        </form>

        <p className="mt-4 text-sm text-[var(--muted)]">
          이미 계정이 있나요?{" "}
          <Link className="font-semibold text-sky-600" href="/login">
            로그인
          </Link>
        </p>
      </section>
    </main>
  );
}
