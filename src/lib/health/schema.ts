import { z } from "zod";

import type { Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DailyCheckinRow = Database["public"]["Tables"]["daily_checkins"]["Row"];
type MealPlanRow = Database["public"]["Tables"]["meal_plans"]["Row"];
type GuidanceItemRow = Database["public"]["Tables"]["guidance_items"]["Row"];

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, {
  message: "Expected a YYYY-MM-DD date string.",
});

const optionalTextSchema = z.string().trim().min(1).nullable().optional();
const stringListSchema = z.array(z.string().trim().min(1)).default([]);

export const weightGoalSchema = z.enum(["lose", "maintain", "gain"]);

export const profileSchema = z.object({
  nickname: z.string().trim().min(1),
  birthDate: dateStringSchema.nullable().optional(),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  weightGoal: weightGoalSchema,
  healthConcerns: stringListSchema,
  currentCondition: optionalTextSchema,
  favoriteFoods: stringListSchema,
  avoidedFoods: stringListSchema,
  allergies: stringListSchema,
});

const scoreSchema = z.number().int().min(1).max(10);

export const dailyCheckinSchema = z.object({
  conditionScore: scoreSchema,
  sleepQuality: scoreSchema,
  stressLevel: scoreSchema,
  exercisedToday: z.boolean().default(false),
  appetite: optionalTextSchema,
  digestion: optionalTextSchema,
  symptoms: stringListSchema,
  symptomSeverity: z.number().int().min(0).max(10).nullable().optional(),
  waterIntake: z.number().int().min(0).nullable().optional(),
  notes: optionalTextSchema,
});

export const mealEntrySchema = z.object({
  name: z.string().trim().min(1),
  description: optionalTextSchema,
});

export const mealPlanDaySchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  date: dateStringSchema,
  breakfast: mealEntrySchema,
  lunch: mealEntrySchema,
  dinner: mealEntrySchema,
  snack: mealEntrySchema.nullable().optional(),
  explanation: optionalTextSchema,
});

export const mealPlanSchema = z.object({
  weekStartDate: dateStringSchema,
  status: z.string().trim().min(1).default("active"),
  sourceProfileSnapshot: z.record(z.string(), z.unknown()),
  sourceCheckinId: z.string().uuid().nullable().optional(),
  days: z.array(mealPlanDaySchema).length(7),
});

function normalizeFoodName(value: string) {
  return value.trim().toLowerCase();
}

function containsExcludedFood(
  value: string | null | undefined,
  excludedFoods: string[],
) {
  if (!value) {
    return false;
  }

  const normalizedValue = normalizeFoodName(value);

  return excludedFoods.some((food) => normalizedValue.includes(food));
}

export function safeParseMealPlan(
  input: unknown,
  excludedFoods: string[] = [],
) {
  const result = mealPlanSchema.safeParse(input);

  if (!result.success) {
    return result;
  }

  const normalizedExcludedFoods = excludedFoods
    .map(normalizeFoodName)
    .filter(Boolean);

  if (normalizedExcludedFoods.length === 0) {
    const dayIndexIssues = buildMealPlanDayIndexIssues(result.data.days);

    if (dayIndexIssues.length === 0) {
      return result;
    }

    return {
      success: false as const,
      error: new z.ZodError(dayIndexIssues),
    };
  }

  const dayIndexIssues = buildMealPlanDayIndexIssues(result.data.days);
  const issuePaths = result.data.days.flatMap((day, dayPosition) => {
    const mealFields = [
      ["breakfast", day.breakfast.name],
      ["breakfast", day.breakfast.description ?? undefined],
      ["lunch", day.lunch.name],
      ["lunch", day.lunch.description ?? undefined],
      ["dinner", day.dinner.name],
      ["dinner", day.dinner.description ?? undefined],
      ["snack", day.snack?.name],
      ["snack", day.snack?.description ?? undefined],
    ] as const;

    return mealFields
      .filter(([, value]) =>
        containsExcludedFood(value, normalizedExcludedFoods),
      )
      .map(([fieldName]) => ({
        code: "custom" as const,
        message: "Meal plan contains an excluded food.",
        path: ["days", dayPosition, fieldName],
      }));
  });

  const issues = [...dayIndexIssues, ...issuePaths];

  if (issues.length === 0) {
    return result;
  }

  return {
    success: false as const,
    error: new z.ZodError(issues),
  };
}

function buildMealPlanDayIndexIssues(
  days: Array<z.infer<typeof mealPlanDaySchema>>,
) {
  const dayIndexes = days.map((day) => day.dayIndex);
  const uniqueIndexes = new Set(dayIndexes);

  if (
    uniqueIndexes.size === 7 &&
    Array.from({ length: 7 }, (_, index) => index).every((index) =>
      uniqueIndexes.has(index),
    )
  ) {
    return [];
  }

  return [
    {
      code: "custom" as const,
      message: "Meal plan must contain exactly one entry for each day index from 0 to 6.",
      path: ["days"],
    },
  ];
}

export const guidanceCategorySchema = z.enum([
  "exercise",
  "lifestyle",
  "nutrition",
  "medicine_info",
]);

export const guidanceItemSchema = z.object({
  category: guidanceCategorySchema,
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  safetyNotice: optionalTextSchema,
  sourceCheckinId: z.string().uuid().nullable().optional(),
});

export type ProfileRecord = ProfileRow;
export type DailyCheckinRecord = DailyCheckinRow;
export type MealPlanRecord = MealPlanRow;
export type GuidanceItemRecord = GuidanceItemRow;

export type ProfileInput = z.infer<typeof profileSchema>;
export type DailyCheckinInput = z.infer<typeof dailyCheckinSchema>;
export type MealPlanInput = z.infer<typeof mealPlanSchema>;
export type GuidanceItemInput = z.infer<typeof guidanceItemSchema>;
