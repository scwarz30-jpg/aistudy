import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUser = vi.fn();
const generateStructuredMealPlan = vi.fn(async (input) => ({
  weekStartDate: input.weekStartDate,
  status: "active",
  sourceProfileSnapshot: input.sourceProfileSnapshot,
  sourceCheckinId: input.sourceCheckinId,
  days: Array.from({ length: 7 }, (_, dayIndex) => ({
    dayIndex,
    date: `2026-07-${String(dayIndex + 6).padStart(2, "0")}`,
    breakfast: { name: `Breakfast ${dayIndex + 1}` },
    lunch: { name: `Lunch ${dayIndex + 1}` },
    dinner: { name: `Dinner ${dayIndex + 1}` },
    snack: null,
    explanation: "Balanced meals",
  })),
}));

const profileChain = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
};
const checkinChain = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
};
const mealPlansInsert = vi.fn();
const mealPlanDaysInsert = vi.fn();
const mealPlansDeleteEq = vi.fn();
const mealPlansDelete = vi.fn();
const from = vi.fn((table: string) => {
  if (table === "profiles") {
    return profileChain;
  }

  if (table === "daily_checkins") {
    return checkinChain;
  }

  if (table === "meal_plans") {
    return {
      insert: mealPlansInsert,
      delete: mealPlansDelete,
    };
  }

  if (table === "meal_plan_days") {
    return {
      insert: mealPlanDaysInsert,
    };
  }

  throw new Error(`Unexpected table: ${table}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createServerActionSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: authGetUser,
    },
    from,
  })),
}));

vi.mock("@/lib/ai/generate", () => ({
  generateStructuredMealPlan,
}));

describe("generateWeeklyMealPlan", () => {
  beforeEach(() => {
    vi.resetModules();
    authGetUser.mockReset();
    from.mockClear();
    generateStructuredMealPlan.mockClear();

    profileChain.select.mockReturnValue(profileChain);
    profileChain.eq.mockReturnValue(profileChain);
    profileChain.single.mockResolvedValue({
      data: {
        user_id: "user-123",
        nickname: "Mina",
        birth_date: "1994-02-15",
        height_cm: 165,
        weight_kg: 58,
        weight_goal: "maintain",
        health_concerns: ["fatigue"],
        current_condition: "steady",
        favorite_foods: ["salmon"],
        avoided_foods: ["peanut"],
        allergies: ["shrimp"],
      },
      error: null,
    });

    checkinChain.select.mockReturnValue(checkinChain);
    checkinChain.eq.mockReturnValue(checkinChain);
    checkinChain.order.mockReturnValue(checkinChain);
    checkinChain.limit.mockResolvedValue({
      data: [],
      error: null,
    });

    mealPlansDeleteEq.mockReset();
    mealPlansDelete.mockReset();
    mealPlansDelete.mockReturnValue({
      eq: mealPlansDeleteEq,
    });
    mealPlansDeleteEq.mockResolvedValue({
      error: null,
    });

    mealPlansInsert.mockReset();
    mealPlansInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "meal-plan-123",
          },
          error: null,
        }),
      }),
    });

    mealPlanDaysInsert.mockReset();
    mealPlanDaysInsert.mockResolvedValue({ error: null });
  });

  it("deletes the inserted parent meal plan when saving days fails", async () => {
    authGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    });
    mealPlanDaysInsert.mockResolvedValue({
      error: {
        message: "insert failed",
      },
    });

    const { generateWeeklyMealPlan } = await import(
      "@/app/actions/recommendations"
    );

    await expect(generateWeeklyMealPlan("user-123")).rejects.toThrow(
      "식단 상세 정보를 저장하지 못했습니다.",
    );

    expect(mealPlansDelete).toHaveBeenCalledTimes(1);
    expect(mealPlansDeleteEq).toHaveBeenCalledWith("id", "meal-plan-123");
  });

  it("blocks meal-plan generation when the latest check-in requires professional care", async () => {
    authGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    });
    checkinChain.limit.mockResolvedValue({
      data: [
        {
          id: "checkin-123",
          user_id: "user-123",
          condition_score: 4,
          sleep_quality: 4,
          stress_level: 7,
          exercised_today: false,
          appetite: "low",
          digestion: "normal",
          symptoms: [],
          symptom_severity: 9,
          water_intake: null,
          notes: null,
          created_at: "2026-07-10T00:00:00.000Z",
        },
      ],
      error: null,
    });

    const { generateWeeklyMealPlan } = await import(
      "@/app/actions/recommendations"
    );

    await expect(generateWeeklyMealPlan("user-123")).rejects.toThrow(
      "최근 체크인에 전문가 상담이 필요한 신호가 있어 새 식단표 생성보다 진료나 상담을 먼저 권장합니다.",
    );
    expect(generateStructuredMealPlan).not.toHaveBeenCalled();
    expect(mealPlansInsert).not.toHaveBeenCalled();
    expect(mealPlanDaysInsert).not.toHaveBeenCalled();
  });
});
