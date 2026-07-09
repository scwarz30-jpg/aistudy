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
  formData.set("nickname", "誘쇱븘");
  formData.set("birthDate", "1994-02-15");
  formData.set("heightCm", "165");
  formData.set("weightKg", "58");
  formData.set("weightGoal", "maintain");
  formData.set("healthConcerns", "?쇰줈, ?뚰솕");
  formData.set("currentCondition", "?섎㈃??議곌툑 遺議깊빐??");
  formData.set("favoriteFoods", "?곗뼱\n?꾨?諛?");
  formData.set("avoidedFoods", "?낆쉘");
  formData.set("allergies", "?덉슦, 蹂듭댂??");

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
      message: "濡쒓렇?몄씠 ?꾩슂?⑸땲??",
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
      message: "?낅젰???뺣낫瑜??ㅼ떆 ?뺤씤??二쇱꽭??",
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

    const { saveProfile } = await import("@/app/actions/profile");
    const result = await saveProfile(buildValidFormData());

    expect(from).toHaveBeenCalledWith("profiles");
    expect(profileUpsert).toHaveBeenCalledWith(
      {
        user_id: "user-123",
        nickname: "誘쇱븘",
        birth_date: "1994-02-15",
        height_cm: 165,
        weight_kg: 58,
        weight_goal: "maintain",
        health_concerns: ["?쇰줈", "?뚰솕"],
        current_condition: "?섎㈃??議곌툑 遺議깊빐??",
        favorite_foods: ["?곗뼱", "?꾨?諛?"],
        avoided_foods: ["?낆쉘"],
        allergies: ["?덉슦", "蹂듭댂??"],
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
        nickname: "誘쇱븘",
        birth_date: "1994-02-15",
        height_cm: 165,
        weight_kg: 58,
        weight_goal: "maintain",
        health_concerns: [],
        current_condition: null,
        favorite_foods: ["?곗뼱"],
        avoided_foods: ["?묎낵"],
        allergies: ["?덉슦"],
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
