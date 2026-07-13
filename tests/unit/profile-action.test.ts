import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUser = vi.fn();
const revalidatePath = vi.fn();
const profileMaybeSingle = vi.fn();
const profileUpsert = vi.fn();
const mealPlansUpdateEqStatus = vi.fn();
const mealPlansUpdateEqUser = vi.fn();
const mealPlansUpdate = vi.fn();

const profileChain = {
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: profileMaybeSingle,
  upsert: profileUpsert,
};

const mealPlansChain = {
  update: mealPlansUpdate,
};

const from = vi.fn((table: string) => {
  if (table === "profiles") {
    return profileChain;
  }

  if (table === "meal_plans") {
    return mealPlansChain;
  }

  throw new Error(`Unexpected table: ${table}`);
});

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerActionSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: authGetUser,
    },
    from,
  })),
}));

function buildValidFormData() {
  const formData = new FormData();
  formData.set("nickname", "민지");
  formData.set("birthDate", "1994-02-15");
  formData.set("heightCm", "165");
  formData.set("weightKg", "58");
  formData.set("weightGoal", "maintain");
  formData.set("healthConcerns", "피로, 소화");
  formData.set("currentCondition", "수면이 부족하지만 안정적");
  formData.set("favoriteFoods", "닭가슴살\n현미밥");
  formData.set("avoidedFoods", "튀김");
  formData.set("allergies", "우유, 땅콩");

  return formData;
}

describe("saveProfile", () => {
  beforeEach(() => {
    vi.resetModules();
    authGetUser.mockReset();
    from.mockClear();
    revalidatePath.mockReset();

    profileChain.select.mockReturnValue(profileChain);
    profileChain.eq.mockReturnValue(profileChain);
    profileMaybeSingle.mockReset();
    profileMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });
    profileUpsert.mockReset();
    profileUpsert.mockResolvedValue({ error: null });

    mealPlansUpdateEqStatus.mockReset();
    mealPlansUpdateEqStatus.mockResolvedValue({ error: null });
    mealPlansUpdateEqUser.mockReset();
    mealPlansUpdateEqUser.mockReturnValue({
      eq: mealPlansUpdateEqStatus,
    });
    mealPlansUpdate.mockReset();
    mealPlansUpdate.mockReturnValue({
      eq: mealPlansUpdateEqUser,
    });
  });

  it("returns an error when there is no authenticated user", async () => {
    authGetUser.mockResolvedValue({
      data: {
        user: null,
      },
      error: null,
    });

    const { saveProfile } = await import("@/app/actions/profile");

    const result = await saveProfile(new FormData());

    expect(result).toEqual({
      ok: false,
      message: "로그인이 필요합니다.",
    });
  });

  it("returns a validation error for invalid profile data", async () => {
    authGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    });

    const { saveProfile } = await import("@/app/actions/profile");
    const formData = new FormData();
    formData.set("nickname", "");
    formData.set("heightCm", "0");
    formData.set("weightKg", "");
    formData.set("weightGoal", "maintain");

    const result = await saveProfile(formData);

    expect(result).toEqual({
      ok: false,
      message: "입력값을 확인해 주세요. 문제가 있는 항목: 닉네임, 키, 몸무게",
    });
  });

  it("accepts comma decimal profile numbers", async () => {
    authGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    });

    const { saveProfile } = await import("@/app/actions/profile");
    const formData = buildValidFormData();
    formData.set("heightCm", "165,5");
    formData.set("weightKg", "58,4");

    const result = await saveProfile(formData);

    expect(profileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        height_cm: 165.5,
        weight_kg: 58.4,
      }),
      {
        onConflict: "user_id",
      },
    );
    expect(result).toEqual({ ok: true });
  });

  it("upserts a validated profile for the signed-in user", async () => {
    authGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    });

    const { saveProfile } = await import("@/app/actions/profile");
    const result = await saveProfile(buildValidFormData());

    expect(from).toHaveBeenCalledWith("profiles");
    expect(profileUpsert).toHaveBeenCalledWith(
      {
        user_id: "user-123",
        nickname: "민지",
        birth_date: "1994-02-15",
        height_cm: 165,
        weight_kg: 58,
        weight_goal: "maintain",
        health_concerns: ["피로", "소화"],
        current_condition: "수면이 부족하지만 안정적",
        favorite_foods: ["닭가슴살", "현미밥"],
        avoided_foods: ["튀김"],
        allergies: ["우유", "땅콩"],
      },
      {
        onConflict: "user_id",
      },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/guidance");
    expect(revalidatePath).toHaveBeenCalledWith("/meal-plan");
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
    expect(result).toEqual({ ok: true });
  });

  it("marks active meal plans stale when food preferences or exclusions change", async () => {
    authGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    });
    profileMaybeSingle.mockResolvedValue({
      data: {
        id: "profile-123",
        user_id: "user-123",
        nickname: "민지",
        birth_date: "1994-02-15",
        height_cm: 165,
        weight_kg: 58,
        weight_goal: "maintain",
        health_concerns: [],
        current_condition: null,
        favorite_foods: ["닭가슴살"],
        avoided_foods: ["라면"],
        allergies: ["우유"],
        created_at: "2026-07-10T00:00:00.000Z",
        updated_at: "2026-07-10T00:00:00.000Z",
      },
      error: null,
    });

    const { saveProfile } = await import("@/app/actions/profile");
    const result = await saveProfile(buildValidFormData());

    expect(mealPlansUpdate).toHaveBeenCalledWith({ status: "stale" });
    expect(mealPlansUpdateEqUser).toHaveBeenCalledWith("user_id", "user-123");
    expect(mealPlansUpdateEqStatus).toHaveBeenCalledWith("status", "active");
    expect(result).toEqual({ ok: true });
  });
});
