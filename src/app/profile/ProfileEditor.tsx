"use client";

import { useState } from "react";

import { saveProfile, type SaveProfileResult } from "@/app/actions/profile";
import { RegenerateMealPlanButton } from "@/app/meal-plan/RegenerateMealPlanButton";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";
import type { ProfileInput } from "@/lib/health/schema";

type ProfileEditorProps = {
  profile: ProfileInput;
};

const initialResult: SaveProfileResult | null = null;

function toTextareaValue(values: string[]) {
  return values.join("\n");
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const [result, setResult] = useState<SaveProfileResult | null>(initialResult);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const nextResult = await saveProfile(formData);
      setResult(nextResult);
    } catch {
      setResult({
        ok: false,
        message: "프로필 저장 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="닉네임"
          name="nickname"
          placeholder="예: 민아"
          required
          defaultValue={profile.nickname}
        />
        <TextField
          label="생년월일"
          name="birthDate"
          type="date"
          defaultValue={profile.birthDate ?? ""}
        />
        <TextField
          label="키 (cm)"
          name="heightCm"
          type="number"
          inputMode="decimal"
          min="1"
          step="0.1"
          placeholder="165"
          required
          defaultValue={String(profile.heightCm)}
        />
        <TextField
          label="몸무게 (kg)"
          name="weightKg"
          type="number"
          inputMode="decimal"
          min="1"
          step="0.1"
          placeholder="58"
          required
          defaultValue={String(profile.weightKg)}
        />
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
        <span>목표</span>
        <select
          name="weightGoal"
          defaultValue={profile.weightGoal}
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
          defaultValue={toTextareaValue(profile.healthConcerns)}
        />
        <TextField
          label="현재 컨디션"
          name="currentCondition"
          textarea
          placeholder="최근 수면, 스트레스, 식사 패턴을 간단히 적어 주세요."
          defaultValue={profile.currentCondition ?? ""}
        />
        <TextField
          label="좋아하는 음식"
          name="favoriteFoods"
          textarea
          placeholder="예: 연어, 현미밥, 두부"
          hint="쉼표 또는 줄바꿈으로 입력해 주세요."
          defaultValue={toTextareaValue(profile.favoriteFoods)}
        />
        <TextField
          label="피하고 싶은 음식"
          name="avoidedFoods"
          textarea
          placeholder="예: 땅콩, 튀김류"
          defaultValue={toTextareaValue(profile.avoidedFoods)}
        />
        <TextField
          label="알레르기"
          name="allergies"
          textarea
          placeholder="예: 새우, 복숭아"
          defaultValue={toTextareaValue(profile.allergies)}
        />
      </div>

      <Notice tone="warning" title="건강 안내">
        입력한 내용은 건강 관리를 위한 일반 참고 정보이며, 진단이나 처방을 대신하지 않습니다.
      </Notice>

      {result && !result.ok ? (
        <Notice tone="error" title="저장에 실패했어요">
          {result.message}
        </Notice>
      ) : null}

      {result?.ok ? (
        <div className="space-y-3">
          <Notice tone="success" title="프로필을 저장했어요">
            변경된 정보로 식단을 다시 만들면 더 잘 맞는 추천을 받을 수 있어요.
          </Notice>
          <div className="max-w-sm">
            <RegenerateMealPlanButton />
          </div>
        </div>
      ) : null}

      <Button type="submit" pending={isPending}>
        프로필 저장하기
      </Button>
    </form>
  );
}
