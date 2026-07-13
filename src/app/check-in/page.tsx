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
      label: `${value}/10`,
    };
  });
}

const scoreOptions = buildScoreOptions();
const symptomSeverityOptions = [{ value: "0", label: "0/10" }, ...scoreOptions];

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

      if (nextResult.ok && nextResult.status === "saved") {
        router.replace("/dashboard");
      }
    } catch {
      setResult({
        ok: false,
        status: "error",
        message: "체크인을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsPending(false);
    }
  }

  const hasSavedWarning =
    result?.ok === true && result.status === "saved_with_warning";

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-600">
            매일 체크인
          </p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            오늘 몸상태를 기록하세요
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            기본 상태를 먼저 입력하고, 필요하면 증상이나 메모를 추가하세요.
          </p>
        </div>

        <Notice tone="warning" title="안전 안내">
          이 기능은 매일 상태를 기록하기 위한 도구입니다. 심한 증상, 호흡곤란, 흉통, 심한 출혈이 있으면 먼저 의료진의 도움을 받아 주세요.
        </Notice>

        {result && "message" in result ? (
          <Notice
            tone={result.ok ? "warning" : "error"}
            title={result.ok ? "전문가 상담을 권장합니다" : "저장에 실패했습니다"}
          >
            {result.message}
          </Notice>
        ) : null}

        {hasSavedWarning ? (
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                체크인이 저장되었습니다
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                긴급 신호가 포함된 체크인을 저장했습니다. 같은 내용을 다시 제출하지 말고 대시보드나 식단표로 이동해 주세요.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                대시보드로 이동
              </Link>
              <Link
                href="/meal-plan"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
              >
                식단표 보기
              </Link>
            </div>
          </section>
        ) : (
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
                  오늘 몸상태를 가장 잘 설명하는 항목을 기록해 주세요.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="컨디션 점수"
                  name="conditionScore"
                  defaultValue="5"
                  options={scoreOptions}
                />
                <SelectField
                  label="수면의 질"
                  name="sleepQuality"
                  defaultValue="5"
                  options={scoreOptions}
                />
                <SelectField
                  label="스트레스"
                  name="stressLevel"
                  defaultValue="5"
                  options={scoreOptions}
                />
                <SelectField
                  label="증상 심각도"
                  name="symptomSeverity"
                  defaultValue="0"
                  options={symptomSeverityOptions}
                />
                <SelectField
                  label="식욕"
                  name="appetite"
                  defaultValue=""
                  options={[
                    { value: "", label: "선택" },
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
                    { value: "", label: "선택" },
                    { value: "normal", label: "보통" },
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
                  오늘 가벼운 움직임이라도 운동을 했어요.
                </span>
              </label>
            </section>

            <details className="rounded-lg border border-[var(--border)] bg-[var(--background)]">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                자세히 입력하기
              </summary>
              <div className="grid gap-4 border-t border-[var(--border)] px-4 py-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    label="증상"
                    name="symptoms"
                    textarea
                    placeholder="두통, 어지러움, 메스꺼움"
                    hint="쉼표 또는 줄바꿈으로 여러 항목을 입력할 수 있어요."
                  />
                </div>
                <TextField
                  label="물 섭취량 (컵)"
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
                    placeholder="증상이 나타난 시간, 음식 반응, 관리 계획 등을 적어 주세요."
                  />
                </div>
              </div>
            </details>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" pending={isPending}>
                체크인 저장
              </Button>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
              >
                대시보드로 돌아가기
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
