import { describe, expect, it } from "vitest";

import { buildGuidance } from "@/lib/health/guidance";

describe("buildGuidance", () => {
  it("returns the required guidance categories with the exact medicine safety sentence", () => {
    const guidance = buildGuidance(
      {
        nickname: "민아",
        birthDate: "1994-02-15",
        heightCm: 165,
        weightKg: 58,
        weightGoal: "maintain",
        healthConcerns: ["피로"],
        currentCondition: "수면이 조금 부족해요",
        favoriteFoods: ["연어", "현미밥"],
        avoidedFoods: ["땅콩"],
        allergies: ["새우"],
      },
      {
        conditionScore: 5,
        sleepQuality: 4,
        stressLevel: 8,
        exercisedToday: false,
        appetite: "low",
        digestion: "bloated",
        symptoms: ["fatigue"],
        symptomSeverity: 4,
        waterIntake: 4,
        notes: "오후에 피로감이 올라왔어요.",
      },
    );

    expect(guidance.map((item) => item.category)).toEqual([
      "exercise",
      "lifestyle",
      "nutrition",
      "medicine_info",
    ]);
    expect(guidance[3]?.content).toContain(
      "This is general information, not diagnosis or prescription. Consult a doctor or pharmacist before using medicine.",
    );
  });
});
