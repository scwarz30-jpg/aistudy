import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateStructuredMealPlan } from "@/lib/ai/generate";
import { calculateBmi } from "@/lib/health/rules";
import type { DailyCheckinInput, ProfileInput } from "@/lib/health/schema";

const profile: ProfileInput = {
  nickname: "민아",
  birthDate: "1994-02-15",
  heightCm: 165,
  weightKg: 58,
  weightGoal: "maintain",
  healthConcerns: ["피로"],
  currentCondition: "보통",
  favoriteFoods: ["연어"],
  avoidedFoods: [],
  allergies: [],
};

const baseCheckin: DailyCheckinInput = {
  conditionScore: 8,
  sleepQuality: 8,
  stressLevel: 2,
  exercisedToday: true,
  appetite: "normal",
  digestion: "normal",
  symptoms: [],
  symptomSeverity: 0,
  waterIntake: 7,
  notes: "가볍게 운동함",
};

describe("fallback meal-plan generation", () => {
  it("changes the visible meals when the latest check-in changes", async () => {
    const originalApiKey = process.env.AI_PROVIDER_API_KEY;
    delete process.env.AI_PROVIDER_API_KEY;

    try {
      const commonInput = {
        weekStartDate: "2026-07-13",
        profile,
        excludedFoods: [],
        preferredFoods: profile.favoriteFoods,
        bmi: calculateBmi(profile.heightCm, profile.weightKg),
        sourceProfileSnapshot: profile,
        sourceCheckinId: null,
      };

      const steadyPlan = await generateStructuredMealPlan({
        ...commonInput,
        latestCheckin: baseCheckin,
      });
      const tiredPlan = await generateStructuredMealPlan({
        ...commonInput,
        latestCheckin: {
          ...baseCheckin,
          conditionScore: 3,
          sleepQuality: 3,
          stressLevel: 8,
          appetite: "low",
          digestion: "sensitive",
          notes: "피곤하고 속이 예민함",
        },
      });

      expect(steadyPlan.days[0].breakfast.name).not.toBe(
        tiredPlan.days[0].breakfast.name,
      );
      expect(tiredPlan.days[0].explanation).toContain("최근 체크인");
    } finally {
      process.env.AI_PROVIDER_API_KEY = originalApiKey;
    }
  });
});
