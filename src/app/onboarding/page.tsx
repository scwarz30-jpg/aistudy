"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveProfile, type SaveProfileResult } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";

const initialResult: SaveProfileResult | null = null;

export default function OnboardingPage() {
  const router = useRouter();
  const [result, setResult] = useState<SaveProfileResult | null>(initialResult);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextResult = await saveProfile(formData);
      setResult(nextResult);

      if (nextResult.ok) {
        router.replace("/dashboard");
      }
    });
  }

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sky-600">온보딩</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            기본 건강 프로필을 알려주세요
          </h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            맞춤 식단과 기록 화면을 준비하기 위한 최소 정보만 먼저 받아요.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="닉네임"
              name="nickname"
              placeholder="예: 민아"
              required
            />
            <TextField
              label="생년월일"
              name="birthDate"
              type="date"
            />
            <TextField
              label="키(cm)"
              name="heightCm"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              placeholder="165"
              required
            />
            <TextField
              label="몸무게(kg)"
              name="weightKg"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              placeholder="58"
              required
            />
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
            <span>목표</span>
            <select
              name="weightGoal"
              defaultValue="maintain"
              className="min-h-12 rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="lose">감량</option>
              <option value="maintain">유지</option>
              <option value="gain">증량</option>
            </select>
          </label>

          <div className="grid gap-4">
            <TextField
              label="건강 고민"
              name="healthConcerns"
              textarea
              placeholder="예: 피로, 소화 불편, 혈당 관리"
              hint="쉼표 또는 줄바꿈으로 여러 항목을 입력할 수 있어요."
            />
            <TextField
              label="현재 컨디션"
              name="currentCondition"
              textarea
              placeholder="최근 수면, 스트레스, 식사 패턴을 간단히 적어주세요."
            />
            <TextField
              label="좋아하는 음식"
              name="favoriteFoods"
              textarea
              placeholder="예: 연어, 두부, 바나나"
              hint="쉼표 또는 줄바꿈으로 입력해 주세요."
            />
            <TextField
              label="피하고 싶은 음식"
              name="avoidedFoods"
              textarea
              placeholder="예: 튀김, 야식"
            />
            <TextField
              label="알레르기"
              name="allergies"
              textarea
              placeholder="예: 새우, 복숭아"
            />
          </div>

          <Notice tone="warning" title="건강 안내">
            이 앱의 정보는 일반적인 건강 관리 참고용이며 의료진의 진단이나
            치료를 대신하지 않습니다. 증상이 있거나 복용 중인 약이 있다면
            전문가 상담을 먼저 받아주세요.
          </Notice>

          {result && !result.ok ? (
            <Notice tone="error" title="저장에 실패했습니다">
              {result.message}
            </Notice>
          ) : null}

          <Button type="submit" pending={isPending}>
            프로필 저장하기
          </Button>
        </form>
      </section>
    </main>
  );
}
