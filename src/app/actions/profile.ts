"use server";

import { profileSchema } from "@/lib/health/schema";
import { createServerActionSupabaseClient } from "@/lib/supabase/server";

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; message: string };

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value.length > 0 ? value : null;
}

function getNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  return Number(value);
}

function getStringList(formData: FormData, key: string) {
  return getString(formData, key)
    .split(/[\n,]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function saveProfile(
  formData: FormData,
): Promise<SaveProfileResult> {
  const supabase = await createServerActionSupabaseClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return {
      ok: false,
      message: "로그인이 필요합니다.",
    };
  }

  const parsed = profileSchema.safeParse({
    nickname: getString(formData, "nickname"),
    birthDate: getOptionalString(formData, "birthDate"),
    heightCm: getNumber(formData, "heightCm"),
    weightKg: getNumber(formData, "weightKg"),
    weightGoal: getString(formData, "weightGoal"),
    healthConcerns: getStringList(formData, "healthConcerns"),
    currentCondition: getOptionalString(formData, "currentCondition"),
    favoriteFoods: getStringList(formData, "favoriteFoods"),
    avoidedFoods: getStringList(formData, "avoidedFoods"),
    allergies: getStringList(formData, "allergies"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "입력한 정보를 다시 확인해 주세요.",
    };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: data.user.id,
      nickname: parsed.data.nickname,
      birth_date: parsed.data.birthDate ?? null,
      height_cm: parsed.data.heightCm,
      weight_kg: parsed.data.weightKg,
      weight_goal: parsed.data.weightGoal,
      health_concerns: parsed.data.healthConcerns,
      current_condition: parsed.data.currentCondition ?? null,
      favorite_foods: parsed.data.favoriteFoods,
      avoided_foods: parsed.data.avoidedFoods,
      allergies: parsed.data.allergies,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    return {
      ok: false,
      message: "프로필 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { ok: true };
}
