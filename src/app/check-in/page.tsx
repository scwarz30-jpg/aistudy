"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  saveDailyCheckin,
  type SaveDailyCheckinResult,
} from "@/app/actions/checkins";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";

const initialResult: SaveDailyCheckinResult | null = null;

type SelectFieldProps = {
  defaultValue?: string;
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
};

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: SelectFieldProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="min-h-12 rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildScoreOptions() {
  return Array.from({ length: 10 }, (_, index) => {
    const value = String(index + 1);

    return {
      value,
      label: `${value}점`,
    };
  });
}

const scoreOptions = buildScoreOptions();
const symptomSeverityOptions = [
  { value: "0", label: "0점" },
  ...scoreOptions,
];

export default function CheckInPage() {
  const router = useRouter();
  const [result, setResult] = useState<SaveDailyCheckinResult | null>(
    initialResult,
  );
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setIsPending(true);

    try {
      const nextResult = await saveDailyCheckin(
        new FormData(event.currentTarget),
      );

      setResult(nextResult);

      if (nextResult.ok) {
        router.replace("/dashboard");
      }
    } catch {
      setResult({
        ok: false,
        message: "체크인을 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsPending(false);
    }
  }

  const isProfessionalCareNotice =
    result &&
    !result.ok &&
    result.message.startsWith("체크인은 저장되었어요.");

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-600">
            Daily Check-In
          </p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            오늘 컨디션을 빠르게 기록해 보세요
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            기본 항목만 먼저 입력하고, 필요할 때만 상세 메모를 더해도 충분해요.
          </p>
        </div>

        <Notice tone="warning" title="안전 안내">
          이 체크인은 일상적인 건강 기록용입니다. 흉통, 호흡곤란, 심한 출혈처럼
          응급 신호가 있거나 증상이 심하면 식단 조정보다 전문 진료를 먼저 받아
          주세요.
        </Notice>

        {result && !result.ok ? (
          <Notice
            tone={isProfessionalCareNotice ? "warning" : "error"}
            title={isProfessionalCareNotice ? "전문가 상담 권장" : "저장 실패"}
          >
            {result.message}
          </Notice>
        ) : null}

        <form
          className="space-y-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                빠른 체크
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                오늘 상태를 한 번에 파악할 수 있는 핵심 항목이에요.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="전반적인 컨디션"
                name="conditionScore"
                defaultValue="5"
                options={scoreOptions}
              />
              <SelectField
                label="수면 만족도"
                name="sleepQuality"
                defaultValue="5"
                options={scoreOptions}
              />
              <SelectField
                label="스트레스 수준"
                name="stressLevel"
                defaultValue="5"
                options={scoreOptions}
              />
              <SelectField
                label="증상 강도"
                name="symptomSeverity"
                defaultValue="0"
                options={symptomSeverityOptions}
              />
              <SelectField
                label="식욕"
                name="appetite"
                defaultValue=""
                options={[
                  { value: "", label: "선택 안 함" },
                  { value: "normal", label: "보통" },
                  { value: "low", label: "낮음" },
                  { value: "high", label: "높음" },
                ]}
              />
              <SelectField
                label="소화 상태"
                name="digestion"
                defaultValue=""
                options={[
                  { value: "", label: "선택 안 함" },
                  { value: "normal", label: "편안함" },
                  { value: "bloated", label: "더부룩함" },
                  { value: "sensitive", label: "예민함" },
                  { value: "upset", label: "불편함" },
                ]}
              />
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                name="exercisedToday"
                className="mt-1 h-4 w-4 rounded border-[var(--border)] text-sky-600 focus:ring-sky-500"
              />
              <span className="leading-6">
                오늘 운동했어요. 가벼운 산책부터 본운동까지 모두 포함해요.
              </span>
            </label>
          </section>

          <details className="rounded-lg border border-[var(--border)] bg-[var(--background)]">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
              상세 메모 열기
            </summary>
            <div className="grid gap-4 border-t border-[var(--border)] px-4 py-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField
                  label="세부 증상"
                  name="symptoms"
                  textarea
                  placeholder="예: 두통, 속쓰림, 어지러움"
                  hint="쉼표나 줄바꿈으로 여러 항목을 적을 수 있어요."
                />
              </div>
              <TextField
                label="물 섭취 컵 수"
                name="waterIntake"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="6"
              />
              <div className="sm:col-span-2">
                <TextField
                  label="메모"
                  name="notes"
                  textarea
                  placeholder="불편한 시점, 식사 반응, 병원 방문 예정 등을 자유롭게 남겨 주세요."
                />
              </div>
            </div>
          </details>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" pending={isPending}>
              체크인 저장하기
            </Button>
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              대시보드로 돌아가기
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
