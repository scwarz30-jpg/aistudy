"use server";

import { revalidatePath } from "next/cache";

import { dailyCheckinSchema } from "@/lib/health/schema";
import { requiresProfessionalCare } from "@/lib/health/rules";
import { createServerActionSupabaseClient } from "@/lib/supabase/server";

export type SaveDailyCheckinResult =
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

function getOptionalNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value.length > 0 ? Number(value) : null;
}

function getBoolean(formData: FormData, key: string) {
  return getString(formData, key) === "on";
}

function getStringList(formData: FormData, key: string) {
  return getString(formData, key)
    .split(/[\n,]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function saveDailyCheckin(
  formData: FormData,
): Promise<SaveDailyCheckinResult> {
  const supabase = await createServerActionSupabaseClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return {
      ok: false,
      message: "로그인이 필요합니다.",
    };
  }

  const parsed = dailyCheckinSchema.safeParse({
    conditionScore: getNumber(formData, "conditionScore"),
    sleepQuality: getNumber(formData, "sleepQuality"),
    stressLevel: getNumber(formData, "stressLevel"),
    exercisedToday: getBoolean(formData, "exercisedToday"),
    appetite: getOptionalString(formData, "appetite"),
    digestion: getOptionalString(formData, "digestion"),
    symptoms: getStringList(formData, "symptoms"),
    symptomSeverity: getOptionalNumber(formData, "symptomSeverity"),
    waterIntake: getOptionalNumber(formData, "waterIntake"),
    notes: getOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "입력한 체크인 정보를 다시 확인해 주세요.",
    };
  }

  const { error } = await supabase.from("daily_checkins").insert({
    user_id: data.user.id,
    condition_score: parsed.data.conditionScore,
    sleep_quality: parsed.data.sleepQuality,
    stress_level: parsed.data.stressLevel,
    exercised_today: parsed.data.exercisedToday,
    appetite: parsed.data.appetite ?? null,
    digestion: parsed.data.digestion ?? null,
    symptoms: parsed.data.symptoms,
    symptom_severity: parsed.data.symptomSeverity ?? null,
    water_intake: parsed.data.waterIntake ?? null,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return {
      ok: false,
      message: "체크인을 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/check-in");

  if (requiresProfessionalCare(parsed.data)) {
    return {
      ok: false,
      message:
        "체크인은 저장되었어요. 증상이 심하거나 응급 신호가 보여서 오늘은 식단 조정보다 병원이나 전문가 상담을 우선해 주세요.",
    };
  }

  return { ok: true };
}
