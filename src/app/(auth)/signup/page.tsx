"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SignupAuthError = {
  code?: string;
  message: string;
  status?: number;
};

function getSignupErrorMessage(error: SignupAuthError) {
  const code = error.code ?? "no_code";
  const message = error.message;
  const normalizedMessage = message.toLowerCase();
  const originalError = `Supabase 원문: [${code}] ${message}`;

  if (code === "email_address_invalid") {
    return `이메일 주소 형식이 Supabase에서 거부되었습니다. 입력한 이메일에 공백, 한글 문자, 빠진 @ 기호가 없는지 확인해 주세요. ${originalError}`;
  }

  if (
    code === "over_email_send_rate_limit" ||
    normalizedMessage.includes("rate") ||
    normalizedMessage.includes("too many")
  ) {
    return `회원가입 또는 인증 메일 요청이 너무 많아 잠시 제한되었습니다. 몇 분 뒤 다시 시도해 주세요. ${originalError}`;
  }

  if (
    code === "weak_password" ||
    normalizedMessage.includes("password")
  ) {
    return `비밀번호 조건을 만족하지 못했습니다. 8자 이상으로 입력해 주세요. ${originalError}`;
  }

  if (normalizedMessage.includes("confirmation email")) {
    return `계정은 만들 수 있지만 인증 메일 발송 단계에서 실패했습니다. Supabase Auth 메일 설정이나 발송 제한을 확인해야 합니다. ${originalError}`;
  }

  return `회원가입에 실패했습니다. ${originalError}`;
}

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
        email: typeof email === "string" ? email.trim() : "",
        password: typeof password === "string" ? password : "",
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setErrorMessage(getSignupErrorMessage(error));
        return;
      }

      if (!data.session) {
        setSuccessMessage(
          "인증 메일을 보냈습니다. 메일함에서 계정을 확인한 뒤 로그인해 주세요.",
        );
        return;
      }

      router.replace("/onboarding");
    } catch {
      setErrorMessage("회원가입 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sky-600">회원가입</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            건강 관리를 시작하세요
          </h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            이메일과 비밀번호로 계정을 만들고 기본 건강 정보를 입력하세요.
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
            autoComplete="new-password"
            placeholder="8자 이상"
            required
          />

          {successMessage ? (
            <Notice tone="success" title="이메일을 확인해 주세요">
              {successMessage}
            </Notice>
          ) : null}

          {errorMessage ? (
            <Notice tone="error" title="회원가입에 실패했습니다">
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
