import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUser = vi.fn();
const from = vi.fn();
const revalidatePath = vi.fn();

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

describe("saveProfile", () => {
  beforeEach(() => {
    authGetUser.mockReset();
    from.mockReset();
    revalidatePath.mockReset();
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
      message: "입력한 정보를 다시 확인해 주세요.",
    });
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

    const upsert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ upsert });

    const { saveProfile } = await import("@/app/actions/profile");
    const formData = new FormData();
    formData.set("nickname", "민아");
    formData.set("birthDate", "1994-02-15");
    formData.set("heightCm", "165");
    formData.set("weightKg", "58");
    formData.set("weightGoal", "maintain");
    formData.set("healthConcerns", "피로, 소화");
    formData.set("currentCondition", "수면이 조금 부족해요");
    formData.set("favoriteFoods", "연어\n현미밥");
    formData.set("avoidedFoods", "땅콩");
    formData.set("allergies", "새우, 복숭아");

    const result = await saveProfile(formData);

    expect(from).toHaveBeenCalledWith("profiles");
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: "user-123",
        nickname: "민아",
        birth_date: "1994-02-15",
        height_cm: 165,
        weight_kg: 58,
        weight_goal: "maintain",
        health_concerns: ["피로", "소화"],
        current_condition: "수면이 조금 부족해요",
        favorite_foods: ["연어", "현미밥"],
        avoided_foods: ["땅콩"],
        allergies: ["새우", "복숭아"],
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
});
