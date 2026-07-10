"use server";

import { revalidatePath } from "next/cache";

import { profileSchema } from "@/lib/health/schema";
import { createServerActionSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; message: string };

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const signInRequiredMessage = "로그인이 필요합니다.";
const invalidProfileMessage = "입력값을 확인해 주세요.";
const saveFailedMessage =
  "프로필을 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";

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

function asStringArray(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeList(values: string[]) {
  return [
    ...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)),
  ]
    .sort()
    .join("|");
}

function shouldMarkMealPlansStale(
  previousProfile: ProfileRow | null,
  nextProfile: {
    favorite_foods: string[];
    avoided_foods: string[];
    allergies: string[];
  },
) {
  if (!previousProfile) {
    return false;
  }

  return (
    normalizeList(asStringArray(previousProfile.favorite_foods)) !==
      normalizeList(nextProfile.favorite_foods) ||
    normalizeList(asStringArray(previousProfile.avoided_foods)) !==
      normalizeList(nextProfile.avoided_foods) ||
    normalizeList(asStringArray(previousProfile.allergies)) !==
      normalizeList(nextProfile.allergies)
  );
}

export async function saveProfile(
  formData: FormData,
): Promise<SaveProfileResult> {
  const supabase = await createServerActionSupabaseClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return {
      ok: false,
      message: signInRequiredMessage,
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
      message: invalidProfileMessage,
    };
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (existingProfileError) {
    return {
      ok: false,
      message: saveFailedMessage,
    };
  }

  const profilePayload = {
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
  };

  const { error } = await supabase.from("profiles").upsert(profilePayload, {
    onConflict: "user_id",
  });

  if (error) {
    return {
      ok: false,
      message: saveFailedMessage,
    };
  }

  if (
    shouldMarkMealPlansStale(existingProfile, {
      favorite_foods: profilePayload.favorite_foods,
      avoided_foods: profilePayload.avoided_foods,
      allergies: profilePayload.allergies,
    })
  ) {
    const { error: stalePlansError } = await supabase
      .from("meal_plans")
      .update({ status: "stale" })
      .eq("user_id", data.user.id)
      .eq("status", "active");

    if (stalePlansError) {
      return {
        ok: false,
        message: saveFailedMessage,
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/guidance");
  revalidatePath("/meal-plan");
  revalidatePath("/profile");

  return { ok: true };
}
