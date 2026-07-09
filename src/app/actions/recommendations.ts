"use server";

import { revalidatePath } from "next/cache";

import { generateStructuredMealPlan } from "@/lib/ai/generate";
import { getSeoulWeekStartDate } from "@/lib/date/seoul";
import { profileSchema, safeParseMealPlan } from "@/lib/health/schema";
import {
  buildFoodConstraints,
  calculateBmi,
  requiresProfessionalCare,
} from "@/lib/health/rules";
import { createServerActionSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type CheckinRow = Database["public"]["Tables"]["daily_checkins"]["Row"];

function asStringArray(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapProfileRowToInput(row: ProfileRow) {
  return profileSchema.safeParse({
    nickname: row.nickname,
    birthDate: row.birth_date,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    weightGoal: row.weight_goal,
    healthConcerns: asStringArray(row.health_concerns),
    currentCondition: row.current_condition,
    favoriteFoods: asStringArray(row.favorite_foods),
    avoidedFoods: asStringArray(row.avoided_foods),
    allergies: asStringArray(row.allergies),
  });
}

function mapCheckinRowToInput(row: CheckinRow | null) {
  if (!row) {
    return null;
  }

  return {
    conditionScore: row.condition_score,
    sleepQuality: row.sleep_quality,
    stressLevel: row.stress_level,
    exercisedToday: row.exercised_today,
    appetite: row.appetite,
    digestion: row.digestion,
    symptoms: asStringArray(row.symptoms),
    symptomSeverity: row.symptom_severity,
    waterIntake: row.water_intake,
    notes: row.notes,
  };
}

export async function generateWeeklyMealPlan(
  userId: string,
): Promise<{ mealPlanId: string }> {
  const supabase = await createServerActionSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user || authData.user.id !== userId) {
    throw new Error("Unauthorized meal plan request.");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (profileError || !profileRow) {
    throw new Error("Profile not found.");
  }

  const parsedProfile = mapProfileRowToInput(profileRow);

  if (!parsedProfile.success) {
    throw new Error("Profile data is incomplete.");
  }

  const { data: latestCheckins, error: checkinError } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (checkinError) {
    throw new Error("Unable to load the latest check-in.");
  }

  const latestCheckinRow = latestCheckins?.[0] ?? null;
  const latestCheckin = mapCheckinRowToInput(latestCheckinRow);
  if (latestCheckin && requiresProfessionalCare(latestCheckin)) {
    throw new Error(
      "Your latest check-in needs professional follow-up before generating a new meal plan.",
    );
  }

  const foodConstraints = buildFoodConstraints(parsedProfile.data);
  const bmi = calculateBmi(parsedProfile.data.heightCm, parsedProfile.data.weightKg);
  const weekStartDate = getSeoulWeekStartDate(new Date());

  const generatedMealPlan = await generateStructuredMealPlan({
    weekStartDate,
    profile: parsedProfile.data,
    latestCheckin,
    excludedFoods: foodConstraints.excludedFoods,
    preferredFoods: foodConstraints.preferredFoods,
    bmi,
    sourceProfileSnapshot: {
      nickname: parsedProfile.data.nickname,
      birthDate: parsedProfile.data.birthDate,
      heightCm: parsedProfile.data.heightCm,
      weightKg: parsedProfile.data.weightKg,
      weightGoal: parsedProfile.data.weightGoal,
      healthConcerns: parsedProfile.data.healthConcerns,
      currentCondition: parsedProfile.data.currentCondition,
      favoriteFoods: parsedProfile.data.favoriteFoods,
      avoidedFoods: parsedProfile.data.avoidedFoods,
      allergies: parsedProfile.data.allergies,
    },
    sourceCheckinId: latestCheckinRow?.id ?? null,
  });

  const validatedMealPlan = safeParseMealPlan(
    generatedMealPlan,
    foodConstraints.excludedFoods,
  );

  if (!validatedMealPlan.success) {
    throw new Error("Generated meal plan failed validation.");
  }

  const { data: insertedPlan, error: insertPlanError } = await supabase
    .from("meal_plans")
    .insert({
      user_id: userId,
      week_start_date: validatedMealPlan.data.weekStartDate,
      source_profile_snapshot:
        validatedMealPlan.data.sourceProfileSnapshot as Json,
      source_checkin_id: validatedMealPlan.data.sourceCheckinId ?? null,
      status: validatedMealPlan.data.status,
    })
    .select("id")
    .single();

  if (insertPlanError || !insertedPlan) {
    throw new Error("Unable to save meal plan.");
  }

  const { error: insertDaysError } = await supabase.from("meal_plan_days").insert(
    validatedMealPlan.data.days.map((day) => ({
      user_id: userId,
      meal_plan_id: insertedPlan.id,
      day_index: day.dayIndex,
      date: day.date,
      breakfast: day.breakfast,
      lunch: day.lunch,
      dinner: day.dinner,
      snack: day.snack ?? null,
      explanation: day.explanation ?? null,
    })),
  );

  if (insertDaysError) {
    const { error: cleanupError } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", insertedPlan.id);

    if (cleanupError) {
      throw new Error(
        "Unable to save meal plan days, and failed to roll back the incomplete meal plan.",
      );
    }

    throw new Error("Unable to save meal plan days.");
  }

  return { mealPlanId: insertedPlan.id };
}

export async function regenerateMealPlan(): Promise<
  { ok: true; mealPlanId: string } | { ok: false; message: string }
> {
  const supabase = await createServerActionSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      message: "You need to sign in before generating a meal plan.",
    };
  }

  try {
    const { mealPlanId } = await generateWeeklyMealPlan(data.user.id);

    revalidatePath("/dashboard");
    revalidatePath("/guidance");
    revalidatePath("/meal-plan");
    revalidatePath("/profile");

    return {
      ok: true,
      mealPlanId,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to generate a meal plan right now.",
    };
  }
}
