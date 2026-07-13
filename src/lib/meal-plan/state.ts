import type { Database } from "@/lib/supabase/types";

type MealPlanRow = Database["public"]["Tables"]["meal_plans"]["Row"];

export function isCurrentMealPlan(mealPlan: MealPlanRow | null) {
  return mealPlan !== null && mealPlan.status !== "stale";
}
