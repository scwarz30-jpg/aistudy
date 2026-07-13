import Link from "next/link";
import { redirect } from "next/navigation";

import { RegenerateMealPlanButton } from "@/app/meal-plan/RegenerateMealPlanButton";
import { Notice } from "@/components/ui/Notice";
import { isCurrentMealPlan } from "@/lib/meal-plan/state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type MealPlanRow = Database["public"]["Tables"]["meal_plans"]["Row"];
type MealPlanDayRow = Database["public"]["Tables"]["meal_plan_days"]["Row"];

function formatDateLabel(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    weekday: "long",
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateString}T00:00:00.000Z`));
}

function getMealName(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "정보 없음";
  }

  return typeof value.name === "string" ? value.name : "정보 없음";
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
    throw new Error("식단표를 불러오지 못했습니다.");
  }

  const latestMealPlan = mealPlans?.[0] ?? null;

  if (!latestMealPlan) {
    return {
      currentMealPlan: null,
      staleMealPlan: null,
      mealPlanDays: [] as MealPlanDayRow[],
    };
  }

  const { data: mealPlanDays, error: mealPlanDaysError } = await supabase
    .from("meal_plan_days")
    .select("*")
    .eq("user_id", userId)
    .eq("meal_plan_id", latestMealPlan.id)
    .order("day_index", { ascending: true });

  if (mealPlanDaysError) {
    throw new Error("식단 상세 정보를 불러오지 못했습니다.");
  }

  return {
    currentMealPlan: isCurrentMealPlan(latestMealPlan) ? latestMealPlan : null,
    staleMealPlan: isCurrentMealPlan(latestMealPlan) ? null : latestMealPlan,
    mealPlanDays: mealPlanDays ?? [],
  };
}

function MealPlanHeader({ mealPlan }: { mealPlan: MealPlanRow | null }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-600">
          식단표
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          일주일 맞춤 식단 추천
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
          현재 식단을 확인하고 목표, 음식 취향, 최근 체크인이 바뀌면 새 식단표를 생성하세요.
        </p>
        {mealPlan ? (
          <p className="text-sm text-[var(--muted)]">
            시작일: {formatDateLabel(mealPlan.week_start_date)}
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

  const { currentMealPlan, staleMealPlan, mealPlanDays } = await loadLatestMealPlan(
    data.user.id,
  );

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <MealPlanHeader mealPlan={currentMealPlan} />

        {staleMealPlan ? (
          <Notice title="기존 식단표를 새로 만들어 주세요" tone="warning">
            음식 취향이나 제외 음식이 바뀌었습니다. 이번 주 식단으로 사용하기 전에 새 식단표를 생성해 주세요.
          </Notice>
        ) : null}

        {!currentMealPlan ? (
          <Notice title="아직 식단표가 없어요" tone="info">
            첫 일주일 식단표를 생성하면 아침, 점심, 저녁, 간식과 날짜별 메모를 확인할 수 있어요.
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
                      {day.day_index + 1}일차
                    </p>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">
                      {formatDateLabel(day.date)}
                    </h2>
                  </div>

                  <dl className="grid gap-4">
                    {[
                      {
                        label: "아침",
                        name: getMealName(day.breakfast),
                        description: getMealDescription(day.breakfast),
                      },
                      {
                        label: "점심",
                        name: getMealName(day.lunch),
                        description: getMealDescription(day.lunch),
                      },
                      {
                        label: "저녁",
                        name: getMealName(day.dinner),
                        description: getMealDescription(day.dinner),
                      },
                      {
                        label: "간식",
                        name: day.snack ? getMealName(day.snack) : "선택",
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
            대시보드로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
