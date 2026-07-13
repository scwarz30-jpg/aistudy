import { describe, expect, it } from "vitest";

import {
  buildAdjustmentNotice,
  getTodayCheckin,
} from "@/app/dashboard/checkin-state";
import { getSeoulWeekStartDate } from "@/lib/date/seoul";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DailyCheckinRow = Database["public"]["Tables"]["daily_checkins"]["Row"];

const profile: ProfileRow = {
  id: "profile-123",
  user_id: "user-123",
  nickname: "Mina",
  birth_date: "1994-02-15",
  height_cm: 165,
  weight_kg: 58,
  weight_goal: "maintain",
  health_concerns: [],
  current_condition: null,
  favorite_foods: [],
  avoided_foods: [],
  allergies: [],
  created_at: "2026-07-10T00:00:00.000Z",
  updated_at: "2026-07-10T00:00:00.000Z",
};

function buildCheckin(createdAt: string): DailyCheckinRow {
  return {
    id: "checkin-123",
    user_id: "user-123",
    condition_score: 3,
    sleep_quality: 3,
    stress_level: 6,
    exercised_today: false,
    appetite: "low",
    digestion: "normal",
    symptoms: [],
    symptom_severity: 3,
    water_intake: null,
    notes: null,
    created_at: createdAt,
  };
}

describe("dashboard today check-in helpers", () => {
  it("treats the latest check-in as stale when it is from a previous Seoul date", () => {
    const staleCheckin = buildCheckin("2026-07-08T14:30:00.000Z");

    expect(getTodayCheckin(staleCheckin, "2026-07-10")).toBeNull();
  });

  it("keeps today-specific adjustment notices empty when there is no today check-in", () => {
    const notice = buildAdjustmentNotice(profile, null);

    expect(notice.tone).toBe("info");
  });

  it("uses today's check-in when the Seoul date matches", () => {
    const todayCheckin = buildCheckin("2026-07-10T01:30:00.000Z");

    expect(getTodayCheckin(todayCheckin, "2026-07-10")).toEqual(todayCheckin);
  });

  it("computes week start from the Seoul-local date instead of UTC midnight", () => {
    expect(getSeoulWeekStartDate(new Date("2026-07-05T15:30:00.000Z"))).toBe(
      "2026-07-06",
    );
  });
});
