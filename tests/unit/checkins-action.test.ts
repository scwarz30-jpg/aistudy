import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUser = vi.fn();
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
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

function buildValidFormData() {
  const formData = new FormData();
  formData.set("conditionScore", "5");
  formData.set("sleepQuality", "5");
  formData.set("stressLevel", "5");
  formData.set("symptomSeverity", "0");
  formData.set("symptoms", "fatigue");

  return formData;
}

describe("saveDailyCheckin", () => {
  beforeEach(() => {
    vi.resetModules();
    authGetUser.mockReset();
    from.mockClear();
    insert.mockReset();
    revalidatePath.mockReset();
  });

  it("returns a saved-with-warning result after persisting an urgent check-in", async () => {
    authGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    });
    insert.mockResolvedValue({ error: null });

    const { saveDailyCheckin } = await import("@/app/actions/checkins");
    const formData = buildValidFormData();
    formData.set("symptomSeverity", "9");
    formData.set("notes", "difficulty breathing");

    const result = await saveDailyCheckin(formData);

    expect(from).toHaveBeenCalledWith("daily_checkins");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      status: "saved_with_warning",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/check-in");
  });

  it("returns a normal saved result for non-urgent check-ins", async () => {
    authGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    });
    insert.mockResolvedValue({ error: null });

    const { saveDailyCheckin } = await import("@/app/actions/checkins");
    const result = await saveDailyCheckin(buildValidFormData());

    expect(result).toEqual({
      ok: true,
      status: "saved",
    });
  });
});
