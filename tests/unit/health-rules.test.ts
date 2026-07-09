import { describe, expect, it } from "vitest";

import {
  buildFoodConstraints,
  calculateBmi,
  requiresProfessionalCare,
} from "@/lib/health/rules";

describe("calculateBmi", () => {
  it("classifies bmi ranges with one decimal precision", () => {
    expect(calculateBmi(170, 50)).toEqual({
      value: 17.3,
      category: "underweight",
    });

    expect(calculateBmi(170, 65)).toEqual({
      value: 22.5,
      category: "normal",
    });

    expect(calculateBmi(170, 75)).toEqual({
      value: 26,
      category: "overweight",
    });

    expect(calculateBmi(170, 95)).toEqual({
      value: 32.9,
      category: "obese",
    });
  });

  it("classifies using the raw bmi before rounding for display", () => {
    expect(calculateBmi(170, 72.1344)).toEqual({
      value: 25,
      category: "normal",
    });
  });

  it("uses threshold values for category transitions", () => {
    expect(calculateBmi(170, 72.25)).toEqual({
      value: 25,
      category: "overweight",
    });

    expect(calculateBmi(170, 53.465)).toEqual({
      value: 18.5,
      category: "normal",
    });
  });
});

describe("buildFoodConstraints", () => {
  it("combines allergies and avoided foods into excluded foods", () => {
    const constraints = buildFoodConstraints({
      nickname: "Mina",
      birthDate: "1994-02-15",
      heightCm: 165,
      weightKg: 58,
      weightGoal: "maintain",
      healthConcerns: ["fatigue"],
      currentCondition: "steady",
      favoriteFoods: ["salmon", "rice"],
      avoidedFoods: ["broccoli", "peanut"],
      allergies: ["peanut", "shrimp"],
    });

    expect(constraints.excludedFoods).toEqual([
      "broccoli",
      "peanut",
      "shrimp",
    ]);
    expect(constraints.preferredFoods).toEqual(["salmon", "rice"]);
  });
});

describe("requiresProfessionalCare", () => {
  it("returns true for symptom severity of at least 8", () => {
    expect(
      requiresProfessionalCare({
        conditionScore: 4,
        sleepQuality: 5,
        stressLevel: 7,
        exercisedToday: false,
        appetite: "low",
        digestion: "normal",
        symptoms: ["fatigue"],
        symptomSeverity: 8,
        waterIntake: 4,
        notes: "persistent fatigue",
      }),
    ).toBe(true);
  });

  it("returns true for urgent English and Korean symptom terms", () => {
    expect(
      requiresProfessionalCare({
        conditionScore: 6,
        sleepQuality: 6,
        stressLevel: 5,
        exercisedToday: true,
        appetite: "normal",
        digestion: "normal",
        symptoms: ["흉통"],
        symptomSeverity: 2,
        waterIntake: 6,
        notes: null,
      }),
    ).toBe(true);

    expect(
      requiresProfessionalCare({
        conditionScore: 6,
        sleepQuality: 6,
        stressLevel: 5,
        exercisedToday: true,
        appetite: "normal",
        digestion: "normal",
        symptoms: ["difficulty breathing"],
        symptomSeverity: 2,
        waterIntake: 6,
        notes: null,
      }),
    ).toBe(true);
  });

  it("returns false for non-urgent symptoms below the severity threshold", () => {
    expect(
      requiresProfessionalCare({
        conditionScore: 7,
        sleepQuality: 7,
        stressLevel: 4,
        exercisedToday: true,
        appetite: "normal",
        digestion: "normal",
        symptoms: ["mild headache"],
        symptomSeverity: 3,
        waterIntake: 7,
        notes: null,
      }),
    ).toBe(false);
  });
});
