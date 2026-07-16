import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUser = vi.fn();
function addDays(dateString: string, dayOffset: number) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

const generateStructuredMealPlan = vi.fn(async (input) => ({
  weekStartDate: input.weekStartDate,
  status: "active",
  sourceProfileSnapshot: input.sourceProfileSnapshot,
  sourceCheckinId: input.sourceCheckinId,
  days: Array.from({ length: 7 }, (_, dayIndex) => ({
    dayIndex,
    date: addDays(input.weekStartDate, dayIndex),
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
const mealPlansSelectChain = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
};
const mealPlanDaysSelectChain = {
  select: vi.fn(),
  eq: vi.fn(),
  lt: vi.fn(),
  order: vi.fn(),
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
      select: mealPlansSelectChain.select,
      insert: mealPlansInsert,
      delete: mealPlansDelete,
    };
  }

  if (table === "meal_plan_days") {
    return {
      select: mealPlanDaysSelectChain.select,
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
    vi.useRealTimers();
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

    mealPlansSelectChain.select.mockReset();
    mealPlansSelectChain.eq.mockReset();
    mealPlansSelectChain.order.mockReset();
    mealPlansSelectChain.limit.mockReset();
    mealPlansSelectChain.select.mockReturnValue(mealPlansSelectChain);
    mealPlansSelectChain.eq.mockReturnValue(mealPlansSelectChain);
    mealPlansSelectChain.order.mockReturnValue(mealPlansSelectChain);
    mealPlansSelectChain.limit.mockResolvedValue({
      data: [],
      error: null,
    });

    mealPlanDaysSelectChain.select.mockReset();
    mealPlanDaysSelectChain.eq.mockReset();
    mealPlanDaysSelectChain.lt.mockReset();
    mealPlanDaysSelectChain.order.mockReset();
    mealPlanDaysSelectChain.select.mockReturnValue(mealPlanDaysSelectChain);
    mealPlanDaysSelectChain.eq.mockReturnValue(mealPlanDaysSelectChain);
    mealPlanDaysSelectChain.lt.mockReturnValue(mealPlanDaysSelectChain);
    mealPlanDaysSelectChain.order.mockResolvedValue({
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

  it("preserves past days from this week's latest meal plan when regenerating", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T02:00:00.000Z"));
    authGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    });
    mealPlansSelectChain.limit.mockResolvedValue({
      data: [
        {
          id: "meal-plan-old",
          user_id: "user-123",
          week_start_date: "2026-07-13",
          source_profile_snapshot: {},
          source_checkin_id: null,
          status: "active",
          created_at: "2026-07-13T00:00:00.000Z",
          updated_at: "2026-07-13T00:00:00.000Z",
        },
      ],
      error: null,
    });
    mealPlanDaysSelectChain.order.mockResolvedValue({
      data: [
        {
          id: "day-1",
          user_id: "user-123",
          meal_plan_id: "meal-plan-old",
          day_index: 0,
          date: "2026-07-13",
          breakfast: { name: "지난 월요일 아침" },
          lunch: { name: "지난 월요일 점심" },
          dinner: { name: "지난 월요일 저녁" },
          snack: null,
          explanation: "보존된 식단",
        },
        {
          id: "day-2",
          user_id: "user-123",
          meal_plan_id: "meal-plan-old",
          day_index: 2,
          date: "2026-07-15",
          breakfast: { name: "지난 수요일 아침" },
          lunch: { name: "지난 수요일 점심" },
          dinner: { name: "지난 수요일 저녁" },
          snack: null,
          explanation: "보존된 식단",
        },
      ],
      error: null,
    });

    const { generateWeeklyMealPlan } = await import(
      "@/app/actions/recommendations"
    );

    await expect(generateWeeklyMealPlan("user-123")).resolves.toEqual({
      mealPlanId: "meal-plan-123",
    });

    const insertedDays = mealPlanDaysInsert.mock.calls[0][0];
    expect(insertedDays).toHaveLength(7);
    expect(insertedDays[0]).toMatchObject({
      date: "2026-07-13",
      breakfast: { name: "지난 월요일 아침" },
      explanation: "보존된 식단",
    });
    expect(insertedDays[2]).toMatchObject({
      date: "2026-07-15",
      breakfast: { name: "지난 수요일 아침" },
      explanation: "보존된 식단",
    });
    expect(insertedDays[3]).toMatchObject({
      date: "2026-07-16",
      breakfast: { name: "Breakfast 4" },
    });
    expect(mealPlanDaysSelectChain.lt).toHaveBeenCalledWith(
      "date",
      "2026-07-16",
    );
  });
});
