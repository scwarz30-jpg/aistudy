"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type LoginAuthError = {
  code?: string;
  message: string;
  status?: number;
};

function getLoginErrorMessage(error: LoginAuthError) {
  const code = error.code ?? "no_code";
  const message = error.message;
  const normalizedMessage = message.toLowerCase();
  const originalError = `Supabase 원문: [${code}] ${message}`;

  if (
    code === "email_not_confirmed" ||
    normalizedMessage.includes("email not confirmed")
  ) {
    return `이메일 인증이 아직 완료되지 않았습니다. 메일함에서 인증 메일을 확인하거나, 개발 중이라면 Supabase에서 이메일 인증을 잠시 꺼 주세요. ${originalError}`;
  }

  if (
    code === "invalid_credentials" ||
    normalizedMessage.includes("invalid login credentials")
  ) {
    return `이메일 또는 비밀번호가 맞지 않습니다. 가입한 이메일과 비밀번호를 다시 확인해 주세요. ${originalError}`;
  }

  if (
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("project") ||
    normalizedMessage.includes("fetch")
  ) {
    return `배포 환경의 Supabase 설정을 확인해야 합니다. Vercel Production 환경변수에 Supabase URL과 Publishable Key가 들어 있는지 확인해 주세요. ${originalError}`;
  }

  return `로그인에 실패했습니다. ${originalError}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email");
      const password = formData.get("password");

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: typeof email === "string" ? email.trim() : "",
        password: typeof password === "string" ? password : "",
      });

      if (error) {
        setErrorMessage(getLoginErrorMessage(error));
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage(
        "로그인 중 문제가 생겼습니다. Vercel 환경변수와 Supabase 프로젝트 설정을 확인해 주세요.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sky-600">로그인</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            다시 만나서 반가워요
          </h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            등록한 계정으로 로그인하고 대시보드로 이동하세요.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <TextField
            label="이메일"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@gmail.com"
            required
          />
          <TextField
            label="비밀번호"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            required
          />

          {errorMessage ? (
            <Notice tone="error" title="로그인에 실패했습니다">
              {errorMessage}
            </Notice>
          ) : null}

          <Button type="submit" pending={isPending}>
            로그인
          </Button>
        </form>

        <p className="mt-4 text-sm text-[var(--muted)]">
          아직 계정이 없나요?{" "}
          <Link className="font-semibold text-sky-600" href="/signup">
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );
}
