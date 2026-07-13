import Link from "next/link";
import { redirect } from "next/navigation";

import { buildAdjustmentNotice, getTodayCheckin } from "@/app/dashboard/checkin-state";
import { RegenerateMealPlanButton } from "@/app/meal-plan/RegenerateMealPlanButton";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Notice } from "@/components/ui/Notice";
import { getSeoulDateString, SEOUL_TIME_ZONE } from "@/lib/date/seoul";
import { isCurrentMealPlan } from "@/lib/meal-plan/state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type MealPlanDayRow = Database["public"]["Tables"]["meal_plan_days"]["Row"];

function formatDateLabel(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
  }).format(new Date(`${dateString}T00:00:00.000Z`));
}

function formatDateTimeLabel(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    timeZone: SEOUL_TIME_ZONE,
  }).format(new Date(dateString));
}

function getWeightGoalLabel(value: string | null) {
  if (value === "lose") {
    return "감량";
  }

  if (value === "gain") {
    return "증량";
  }

  if (value === "maintain") {
    return "유지";
  }

  return "미설정";
}

function getMealPlanStatusLabel(value: string) {
  if (value === "active") {
    return "사용 가능";
  }

  if (value === "stale") {
    return "새로 생성 필요";
  }

  return value;
}

function getMealName(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "정보 없음";
  }

  return typeof value.name === "string" ? value.name : "정보 없음";
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
    throw new Error("식단 상세 정보를 불러오지 못했습니다.");
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
    throw new Error("프로필을 불러오지 못했습니다.");
  }

  if (checkinError) {
    throw new Error("체크인 정보를 불러오지 못했습니다.");
  }

  if (mealPlanError) {
    throw new Error("식단표를 불러오지 못했습니다.");
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
              대시보드
            </p>
            <h1 className="text-3xl font-semibold text-[var(--foreground)]">
              {profile?.nickname
                ? `${profile.nickname}님의 오늘 건강 요약`
                : "오늘 건강 요약"}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
              오늘 체크인, 이번 주 식단표, 최신 조정 안내를 한 곳에서 확인하세요.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={profile ? "/check-in" : "/onboarding"}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              {profile ? "오늘 체크인 입력" : "프로필 먼저 입력"}
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              프로필 입력
            </Link>
            <Link
              href="/meal-plan"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              식단표 보기
            </Link>
            <LogoutButton />
          </div>
        </div>

        {!profile ? (
          <Notice title="프로필 입력이 필요해요" tone="warning">
            <Link href="/onboarding" className="font-semibold underline">
              프로필 입력으로 이동
            </Link>
            {" "}해서 키, 몸무게, 목표, 음식 취향을 먼저 저장해 주세요.
          </Notice>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <section className="grid gap-6">
            <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-sky-600">
                    오늘 체크인
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                    {hasCheckedInToday
                      ? "오늘 체크인을 기록했어요"
                      : "아직 오늘 체크인이 없어요"}
                  </h2>
                </div>

                <Link
                  href="/check-in"
                  className="text-sm font-semibold text-sky-600 hover:text-sky-500"
                >
                  체크인 열기
                </Link>
              </div>

              {latestCheckin ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      최근 기록
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {formatDateTimeLabel(latestCheckin.created_at)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      컨디션
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {latestCheckin.condition_score}/10
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      수면
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {latestCheckin.sleep_quality}/10
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      스트레스
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      {latestCheckin.stress_level}/10
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-lg bg-[var(--background)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                  첫 체크인을 입력하면 오늘 상태에 맞는 안내를 볼 수 있어요.
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
                    이번 주 식단표
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                    {currentMealPlan
                      ? `${formatDateLabel(currentMealPlan.week_start_date)} 시작`
                      : "현재 식단표가 없어요"}
                  </h2>
                </div>

                <Link
                  href="/meal-plan"
                  className="text-sm font-semibold text-sky-600 hover:text-sky-500"
                >
                  식단표 열기
                </Link>
              </div>

              {currentMealPlan ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div className="rounded-lg bg-[var(--background)] p-4">
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          목표
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
                          {getWeightGoalLabel(profile?.weight_goal ?? null)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          상태
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
                          {getMealPlanStatusLabel(currentMealPlan.status)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          반영 기준
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
                          {currentMealPlan.source_checkin_id
                            ? "최근 체크인 반영"
                            : "프로필 기준"}
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
                              ? "오늘 식단"
                              : "가장 가까운 식단"}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                            {formatDateLabel(todayPlanDay.date)}
                          </h3>
                        </div>
                        <dl className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                              아침
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--foreground)]">
                              {getMealName(todayPlanDay.breakfast)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                              점심
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--foreground)]">
                              {getMealName(todayPlanDay.lunch)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                              저녁
                            </dt>
                            <dd className="mt-1 text-sm text-[var(--foreground)]">
                              {getMealName(todayPlanDay.dinner)}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-4 max-w-xs">
                          <RegenerateMealPlanButton />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-[var(--muted)]">
                        식단 상세 정보를 준비 중입니다.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <Notice title="현재 식단표가 없어요" tone="info">
                    프로필과 최근 체크인을 바탕으로 일주일 식단표를 생성해 주세요.
                  </Notice>
                  {latestMealPlan && !currentMealPlan ? (
                    <Notice title="식단표를 새로 만들어 주세요" tone="warning">
                      프로필 변경 후 기존 식단표가 오래된 상태가 되었어요. 이번 주 식단을 따르기 전에 새로 생성해 주세요.
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
                  오늘 안내
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
                  요약
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--foreground)]">
                  <li>
                    오늘 체크인: {hasCheckedInToday ? "완료" : "미입력"}
                  </li>
                  <li>
                    최신 식단표:{" "}
                    {currentMealPlan
                      ? "사용 가능"
                      : latestMealPlan
                        ? "새로 생성 필요"
                        : "없음"}
                  </li>
                  <li>
                    프로필: {profile ? "완료" : "미입력"}
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
