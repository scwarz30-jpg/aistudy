import { describe, expect, it } from "vitest";

import {
  dailyCheckinSchema,
  guidanceItemSchema,
  mealPlanSchema,
  profileSchema,
  safeParseMealPlan,
} from "@/lib/health/schema";

describe("profileSchema", () => {
  it("accepts required numeric fields and allowed weight goals", () => {
    const parsed = profileSchema.parse({
      nickname: "Mina",
      birthDate: "1994-02-15",
      heightCm: 165,
      weightKg: 58,
      weightGoal: "maintain",
      healthConcerns: ["fatigue"],
      currentCondition: "steady",
      favoriteFoods: ["salmon"],
      avoidedFoods: ["peanut"],
      allergies: ["shrimp"],
    });

    expect(parsed.heightCm).toBe(165);
    expect(parsed.weightGoal).toBe("maintain");
  });

  it("rejects missing required numeric profile fields", () => {
    const result = profileSchema.safeParse({
      nickname: "Mina",
      weightGoal: "lose",
      healthConcerns: [],
      favoriteFoods: [],
      avoidedFoods: [],
      allergies: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("dailyCheckinSchema", () => {
  it("requires numeric condition, sleep, and stress values", () => {
    const result = dailyCheckinSchema.safeParse({
      exercisedToday: false,
      symptoms: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("mealPlanSchema", () => {
  function buildMealPlanDay(dayIndex: number) {
    return {
      dayIndex,
      date: `2026-07-${String(dayIndex + 6).padStart(2, "0")}`,
      breakfast: {
        name: `Breakfast ${dayIndex + 1}`,
      },
      lunch: {
        name: `Lunch ${dayIndex + 1}`,
      },
      dinner: {
        name: `Dinner ${dayIndex + 1}`,
      },
      snack: null,
      explanation: "Balanced meals",
    };
  }

  function buildMealPlan() {
    return {
      weekStartDate: "2026-07-06",
      status: "active",
      sourceProfileSnapshot: {
        nickname: "Mina",
      },
      sourceCheckinId: null,
      days: Array.from({ length: 7 }, (_, dayIndex) => buildMealPlanDay(dayIndex)),
    };
  }

  it("accepts a seven-day meal plan structure", () => {
    const result = mealPlanSchema.safeParse(buildMealPlan());

    expect(result.success).toBe(true);
  });

  it("rejects a meal plan missing one of the seven days", () => {
    const mealPlan = buildMealPlan();
    mealPlan.days.pop();

    const result = mealPlanSchema.safeParse(mealPlan);

    expect(result.success).toBe(false);
  });

  it("rejects a meal plan missing breakfast lunch or dinner", () => {
    const mealPlan = buildMealPlan();
    delete (mealPlan.days[0] as Partial<(typeof mealPlan.days)[number]>).lunch;

    const result = mealPlanSchema.safeParse(mealPlan);

    expect(result.success).toBe(false);
  });

  it("rejects a meal plan containing excluded food names", () => {
    const mealPlan = buildMealPlan();
    mealPlan.days[2].dinner.name = "Peanut noodle bowl";

    const result = safeParseMealPlan(mealPlan, ["peanut", "shrimp"]);

    expect(result.success).toBe(false);
  });
});

describe("guidanceItemSchema", () => {
  it("accepts supported guidance categories", () => {
    const result = guidanceItemSchema.safeParse({
      category: "nutrition",
      title: "Hydration",
      content: "Drink water regularly.",
      safetyNotice: null,
      sourceCheckinId: null,
    });

    expect(result.success).toBe(true);
  });
});
