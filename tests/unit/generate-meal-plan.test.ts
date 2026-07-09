import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalApiKey = process.env.AI_PROVIDER_API_KEY;
const originalBaseUrl = process.env.AI_PROVIDER_BASE_URL;
const originalModel = process.env.AI_PROVIDER_MODEL;

function buildInput() {
  return {
    weekStartDate: "2026-07-06",
    profile: {
      nickname: "Mina",
      birthDate: "1994-02-15",
      heightCm: 165,
      weightKg: 58,
      weightGoal: "maintain" as const,
      healthConcerns: ["fatigue"],
      currentCondition: "steady",
      favoriteFoods: ["salmon"],
      avoidedFoods: ["peanut"],
      allergies: ["shrimp"],
    },
    latestCheckin: null,
    excludedFoods: ["peanut", "shrimp"],
    preferredFoods: ["salmon"],
    bmi: {
      value: 21.3,
      category: "normal" as const,
    },
    sourceProfileSnapshot: {
      nickname: "Mina",
    },
    sourceCheckinId: null,
  };
}

describe("generateStructuredMealPlan", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.AI_PROVIDER_API_KEY;
    delete process.env.AI_PROVIDER_BASE_URL;
    delete process.env.AI_PROVIDER_MODEL;
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.AI_PROVIDER_API_KEY;
    } else {
      process.env.AI_PROVIDER_API_KEY = originalApiKey;
    }

    if (originalBaseUrl === undefined) {
      delete process.env.AI_PROVIDER_BASE_URL;
    } else {
      process.env.AI_PROVIDER_BASE_URL = originalBaseUrl;
    }

    if (originalModel === undefined) {
      delete process.env.AI_PROVIDER_MODEL;
    } else {
      process.env.AI_PROVIDER_MODEL = originalModel;
    }
  });

  it("returns the deterministic mock meal plan only when no API key is configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { generateStructuredMealPlan } = await import("@/lib/ai/generate");

    const result = await generateStructuredMealPlan(buildInput());

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.days).toHaveLength(7);
    expect(result.days[0].breakfast.name).toBe("Greek yogurt berry bowl");
  });

  it("throws a provider error instead of silently returning the mock when an API key is configured", async () => {
    process.env.AI_PROVIDER_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 502,
      }),
    );

    const { generateStructuredMealPlan } = await import("@/lib/ai/generate");

    await expect(generateStructuredMealPlan(buildInput())).rejects.toThrow(
      "AI meal plan generation failed: AI provider request failed with status 502.",
    );
  });

  it("throws a validation error instead of silently returning the mock when AI output is invalid", async () => {
    process.env.AI_PROVIDER_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  weekStartDate: "2026-07-06",
                  status: "active",
                  sourceProfileSnapshot: {
                    nickname: "Mina",
                  },
                  sourceCheckinId: null,
                  days: [],
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const { generateStructuredMealPlan } = await import("@/lib/ai/generate");

    await expect(generateStructuredMealPlan(buildInput())).rejects.toThrow(
      "AI meal plan generation failed: AI meal plan failed validation.",
    );
  });
});
