import { describe, expect, it } from "vitest";

import { isCurrentMealPlan } from "@/lib/meal-plan/state";

describe("isCurrentMealPlan", () => {
  it("treats stale plans as not current", () => {
    expect(
      isCurrentMealPlan({
        status: "stale",
      } as never),
    ).toBe(false);
  });

  it("keeps active plans current", () => {
    expect(
      isCurrentMealPlan({
        status: "active",
      } as never),
    ).toBe(true);
  });
});
