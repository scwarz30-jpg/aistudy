import Link from "next/link";
import { redirect } from "next/navigation";

import { buildAdjustmentNotice, getTodayCheckin } from "@/app/dashboard/checkin-state";
import { RegenerateMealPlanButton } from "@/app/meal-plan/RegenerateMealPlanButton";
import { Notice } from "@/components/ui/Notice";
import { getSeoulDateString, SEOUL_TIME_ZONE } from "@/lib/date/seoul";
import { isCurrentMealPlan } from "@/lib/meal-plan/state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type MealPlanDayRow = Database["public"]["Tables"]["meal_plan_days"]["Row"];

function formatDateLabel(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${dateString}T00:00:00.000Z`));
}

function formatDateTimeLabel(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    timeZone: SEOUL_TIME_ZONE,
  }).format(new Date(dateString));
}

function getWeightGoalLabel(value: string | null) {
  if (value === "lose") {
    return "Lose weight";
  }

  if (value === "gain") {
    return "Gain weight";
  }

  if (value === "maintain") {
    return "Maintain";
  }

  return "Not set";
}

function getMealName(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "Unavailable";
  }

  return typeof value.name === "string" ? value.name : "Unavailable";
}

async function loadLatestMealPlanDays(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  mealPlanId: string | null,
) {
  if (!mealPlanId) {
    return [] as MealPlanDayRow[];
  }

  const { data, error } = await supabase
    .from("meal_plan_days")
    .select("*")
    .eq("user_id", userId)
    .eq("meal_plan_id", mealPlanId)
    .order("day_index", { ascending: true });

  if (error) {
    throw new Error("Unable to load meal plan days.");
  }

  return data ?? [];
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const userId = data.user.id;
  const [
    { data: profile, error: profileError },
    { data: latestCheckins, error: checkinError },
    { data: latestMealPlans, error: mealPlanError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .order("week_start_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (profileError) {
    throw new Error("Unable to load profile.");
  }

  if (checkinError) {
    throw new Error("Unable to load check-in data.");
  }

  if (mealPlanError) {
    throw new Error("Unable to load meal plans.");
  }

  const latestCheckin = latestCheckins?.[0] ?? null;
  const latestMealPlan = latestMealPlans?.[0] ?? null;
  const currentMealPlan = isCurrentMealPlan(latestMealPlan) ? latestMealPlan : null;
  const mealPlanDays = await loadLatestMealPlanDays(
    supabase,
    userId,
    currentMealPlan?.id ?? null,
  );
  const todayDate = getSeoulDateString(new Date());
  const todayCheckin = getTodayCheckin(latestCheckin, todayDate);
  const hasCheckedInToday = todayCheckin !== null;
  const todayPlanDay =
    mealPlanDays.find((day) => day.date === todayDate) ?? mealPlanDays[0] ?? null;
  const adjustmentNotice = buildAdjustmentNotice(profile, todayCheckin);

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-600">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold text-[var(--foreground)]">
              {profile?.nickname
                ? `${profile.nickname}'s daily health summary`
                : "Daily health summary"}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Review today&apos;s check-in, this week&apos;s meal plan, and the
              latest adjustment guidance in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={profile ? "/check-in" : "/onboarding"}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              {profile ? "Complete today&apos;s check-in" : "Start onboarding"}
            </Link>
            <Link
              href="/meal-plan"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              View meal plan
            </Link>
          </div>
        </div>

        {!profile ? (
          <Notice title="Profile setup needed" tone="warning">
            <Link href="/onboarding" className="font-semibold underline">
              Go to onboarding
            </Link>
            {" "}to add your body metrics, goals, and food preferences before
            using the personalized features.
          </Notice>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <section className="grid gap-6">
            <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-sky-600">
                    Today&apos;s check-in
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                    {hasCheckedInToday
                      ? "Today&apos;s entry is recorded"
                      : "No check-in recorded for today"}
                  </h2>
                </div>

                <Link
                  href="/check-in"
                  className="text-sm font-semibold text-sky-600 hover:text-sky-500"
                >
                  Open check-in
                </Link>
              </div>

              {latestCheckin ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Latest entry
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {formatDateTimeLabel(latestCheckin.created_at)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Condition
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {latestCheckin.condition_score}/10
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Sleep
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {latestCheckin.sleep_quality}/10
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Stress
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {latestCheckin.stress_level}/10
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg bg-[var(--background)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                  Submit your first check-in to unlock today-specific guidance.
                </div>
              )}

              {latestCheckin?.notes ? (
                <div className="mt-4 rounded-lg bg-[var(--background)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                  {latestCheckin.notes}
                </div>
              ) : null}
            </article>

            <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-sky-600">
                    This week&apos;s meal plan
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                    {currentMealPlan
                      ? `${formatDateLabel(currentMealPlan.week_start_date)} start`
                      : "No current meal plan"}
                  </h2>
                </div>

                <Link
                  href="/meal-plan"
                  className="text-sm font-semibold text-sky-600 hover:text-sky-500"
                >
                  Open meal plan
                </Link>
              </div>

              {currentMealPlan ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          Goal
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
                          {getWeightGoalLabel(profile?.weight_goal ?? null)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          Status
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
                          {currentMealPlan.status}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          Check-in source
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
                          {currentMealPlan.source_checkin_id
                            ? "Adjusted from latest check-in"
                            : "Profile-based default"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-lg bg-[var(--background)] p-4">
                    {todayPlanDay ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                            {todayPlanDay.date === todayDate
                              ? "Today&apos;s plan"
                              : "Closest planned day"}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                            {formatDateLabel(todayPlanDay.date)}
                          </h3>
                        </div>
                        <dl className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                              Breakfast
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--foreground)]">
                              {getMealName(todayPlanDay.breakfast)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                              Lunch
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--foreground)]">
                              {getMealName(todayPlanDay.lunch)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                              Dinner
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--foreground)]">
                              {getMealName(todayPlanDay.dinner)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-[var(--muted)]">
                        Meal-plan details are being prepared.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <Notice title="No current meal plan" tone="info">
                    Generate a weekly plan based on your profile and recent
                    check-ins.
                  </Notice>
                  {latestMealPlan && !currentMealPlan ? (
                    <Notice title="Refresh your previous meal plan" tone="warning">
                      Your saved plan is stale after a profile change. Generate
                      a new one before following this week&apos;s meals.
                    </Notice>
                  ) : null}
                  {profile ? (
                    <div className="max-w-xs">
                      <RegenerateMealPlanButton />
                    </div>
                  ) : null}
                </div>
              )}
            </article>
          </section>

          <aside className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-sky-600">
                  Today&apos;s guidance
                </p>
                <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                  {adjustmentNotice.title}
                </h2>
              </div>

              <Notice tone={adjustmentNotice.tone}>
                {adjustmentNotice.message}
              </Notice>

              <div className="rounded-lg bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Summary
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--foreground)]">
                  <li>
                    Today&apos;s check-in: {hasCheckedInToday ? "done" : "missing"}
                  </li>
                  <li>
                    Latest meal plan:{" "}
                    {currentMealPlan
                      ? "current"
                      : latestMealPlan
                        ? "stale"
                        : "none"}
                  </li>
                  <li>
                    Profile: {profile ? "complete" : "missing"}
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
