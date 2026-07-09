import Link from "next/link";
import { redirect } from "next/navigation";

import { RegenerateMealPlanButton } from "@/app/meal-plan/RegenerateMealPlanButton";
import { Notice } from "@/components/ui/Notice";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type MealPlanRow = Database["public"]["Tables"]["meal_plans"]["Row"];
type MealPlanDayRow = Database["public"]["Tables"]["meal_plan_days"]["Row"];

function formatDateLabel(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateString}T00:00:00.000Z`));
}

function getMealName(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "Unavailable";
  }

  return typeof value.name === "string" ? value.name : "Unavailable";
}

function getMealDescription(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return typeof value.description === "string" ? value.description : null;
}

async function loadLatestMealPlan(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: mealPlans, error: mealPlanError } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", userId)
    .order("week_start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (mealPlanError) {
    throw new Error("Unable to load meal plans.");
  }

  const mealPlan = mealPlans?.[0] ?? null;

  if (!mealPlan) {
    return {
      mealPlan: null,
      mealPlanDays: [] as MealPlanDayRow[],
    };
  }

  const { data: mealPlanDays, error: mealPlanDaysError } = await supabase
    .from("meal_plan_days")
    .select("*")
    .eq("user_id", userId)
    .eq("meal_plan_id", mealPlan.id)
    .order("day_index", { ascending: true });

  if (mealPlanDaysError) {
    throw new Error("Unable to load meal plan days.");
  }

  return {
    mealPlan,
    mealPlanDays: mealPlanDays ?? [],
  };
}

function MealPlanHeader({ mealPlan }: { mealPlan: MealPlanRow | null }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-600">
          Meal Plan
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          Weekly meal recommendations
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Review your current week of meals, then regenerate a fresh plan when
          your goals or recent check-ins change.
        </p>
        {mealPlan ? (
          <p className="text-sm text-[var(--muted)]">
            Week of {formatDateLabel(mealPlan.week_start_date)}
          </p>
        ) : null}
      </div>

      <div className="w-full max-w-xs">
        <RegenerateMealPlanButton />
      </div>
    </div>
  );
}

export default async function MealPlanPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const { mealPlan, mealPlanDays } = await loadLatestMealPlan(data.user.id);

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <MealPlanHeader mealPlan={mealPlan} />

        {!mealPlan ? (
          <Notice title="No meal plan yet" tone="info">
            Generate your first weekly meal plan to see tailored breakfasts,
            lunches, dinners, snacks, and day-by-day notes.
          </Notice>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {mealPlanDays.map((day) => (
              <article
                key={day.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-sky-600">
                      Day {day.day_index + 1}
                    </p>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">
                      {formatDateLabel(day.date)}
                    </h2>
                  </div>

                  <dl className="grid gap-4">
                    {[
                      {
                        label: "Breakfast",
                        name: getMealName(day.breakfast),
                        description: getMealDescription(day.breakfast),
                      },
                      {
                        label: "Lunch",
                        name: getMealName(day.lunch),
                        description: getMealDescription(day.lunch),
                      },
                      {
                        label: "Dinner",
                        name: getMealName(day.dinner),
                        description: getMealDescription(day.dinner),
                      },
                      {
                        label: "Snack",
                        name: day.snack ? getMealName(day.snack) : "Optional",
                        description: day.snack
                          ? getMealDescription(day.snack)
                          : null,
                      },
                    ].map((meal) => (
                      <div key={meal.label} className="space-y-1">
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          {meal.label}
                        </dt>
                        <dd className="text-sm font-medium text-[var(--foreground)]">
                          {meal.name}
                        </dd>
                        {meal.description ? (
                          <dd className="text-sm leading-6 text-[var(--muted)]">
                            {meal.description}
                          </dd>
                        ) : null}
                      </div>
                    ))}
                  </dl>

                  {day.explanation ? (
                    <div className="rounded-lg bg-[var(--background)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                      {day.explanation}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        <div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-sky-600 hover:text-sky-500"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
