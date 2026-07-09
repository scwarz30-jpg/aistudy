import Link from "next/link";
import { redirect } from "next/navigation";

import { RegenerateMealPlanButton } from "@/app/meal-plan/RegenerateMealPlanButton";
import { Notice } from "@/components/ui/Notice";
import { requiresProfessionalCare } from "@/lib/health/rules";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DailyCheckinRow = Database["public"]["Tables"]["daily_checkins"]["Row"];
type MealPlanDayRow = Database["public"]["Tables"]["meal_plan_days"]["Row"];

function formatDateLabel(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${dateString}T00:00:00.000Z`));
}

function formatDateTimeLabel(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(dateString));
}

function getDateStringInSeoul(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function asStringArray(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
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

function getMealName(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "미정";
  }

  return typeof value.name === "string" ? value.name : "미정";
}

export function buildAdjustmentNotice(
  profile: ProfileRow | null,
  latestCheckin: DailyCheckinRow | null,
) {
  if (!profile) {
    return {
      tone: "warning" as const,
      title: "프로필 설정이 먼저 필요해요",
      message: "온보딩을 완료하면 체크인과 식단 요약을 더 정확하게 연결할 수 있어요.",
    };
  }

  if (!latestCheckin) {
    return {
      tone: "info" as const,
      title: "오늘의 조정 팁 준비 중",
      message: "오늘 체크인을 남기면 컨디션에 맞는 식단 메모를 바로 보여드릴게요.",
    };
  }

  const mappedCheckin = {
    conditionScore: latestCheckin.condition_score,
    sleepQuality: latestCheckin.sleep_quality,
    stressLevel: latestCheckin.stress_level,
    exercisedToday: latestCheckin.exercised_today,
    appetite: latestCheckin.appetite,
    digestion: latestCheckin.digestion,
    symptoms: asStringArray(latestCheckin.symptoms),
    symptomSeverity: latestCheckin.symptom_severity,
    waterIntake: latestCheckin.water_intake,
    notes: latestCheckin.notes,
  };

  if (requiresProfessionalCare(mappedCheckin)) {
    return {
      tone: "warning" as const,
      title: "오늘은 전문 진료를 우선해 주세요",
      message:
        "체크인에 심한 증상이나 응급 신호가 보여요. 식단 조정보다 병원, 약사, 또는 의료진 상담을 먼저 권장합니다.",
    };
  }

  if (
    latestCheckin.condition_score <= 4 ||
    latestCheckin.sleep_quality <= 4
  ) {
    return {
      tone: "warning" as const,
      title: "부담 적은 식사로 속도를 늦춰 보세요",
      message:
        "오늘은 자극적인 음식보다 수분과 부드러운 탄수화물, 단백질 위주로 가볍게 챙기는 편이 좋아 보여요.",
    };
  }

  if (latestCheckin.stress_level >= 7) {
    return {
      tone: "info" as const,
      title: "스트레스 완화용 식사 리듬을 추천해요",
      message:
        "카페인과 너무 짠 음식은 줄이고, 따뜻한 식사와 충분한 수분 섭취를 중심으로 하루 템포를 맞춰 보세요.",
    };
  }

  if (
    latestCheckin.appetite === "low" ||
    latestCheckin.digestion === "bloated" ||
    latestCheckin.digestion === "sensitive" ||
    latestCheckin.digestion === "upset"
  ) {
    return {
      tone: "info" as const,
      title: "소화가 편한 구성이 잘 맞겠어요",
      message:
        "죽, 수프, 익힌 채소처럼 부담이 적은 메뉴를 우선하고, 한 번에 많이 먹기보다 나눠 먹는 편이 좋아 보여요.",
    };
  }

  if (latestCheckin.exercised_today && latestCheckin.condition_score >= 7) {
    return {
      tone: "success" as const,
      title: "운동 후 회복용 한 끼를 챙겨 보세요",
      message:
        "오늘은 단백질과 수분을 조금 더 챙기면 좋아요. 현재 식단에 간단한 단백질 간식이나 과일을 보완해 보세요.",
    };
  }

  return {
    tone: "success" as const,
    title: "현재 리듬을 그대로 유지해도 좋아요",
    message:
      "큰 조정 신호는 없어요. 이번 주 식단을 유지하면서 수분과 식사 시간을 규칙적으로 챙겨 보세요.",
  };
}

export function getTodayCheckin(
  latestCheckin: DailyCheckinRow | null,
  todayDate: string,
) {
  if (!latestCheckin) {
    return null;
  }

  return getDateStringInSeoul(new Date(latestCheckin.created_at)) === todayDate
    ? latestCheckin
    : null;
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
  const mealPlanDays = await loadLatestMealPlanDays(
    supabase,
    userId,
    latestMealPlan?.id ?? null,
  );
  const todayDate = getDateStringInSeoul(new Date());
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
                ? `${profile.nickname}님의 오늘 건강 흐름`
                : "오늘 건강 흐름"}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
              체크인, 주간 식단, 오늘의 조정 포인트를 한 번에 확인할 수 있어요.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={profile ? "/check-in" : "/onboarding"}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              {profile ? "오늘 체크인하기" : "온보딩 시작하기"}
            </Link>
            <Link
              href="/meal-plan"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              식단 보기
            </Link>
          </div>
        </div>

        {!profile ? (
          <Notice title="프로필이 아직 없어요" tone="warning">
            <Link href="/onboarding" className="font-semibold underline">
              온보딩으로 이동
            </Link>
            해서 키, 체중, 목표, 음식 제한을 먼저 입력해 주세요.
          </Notice>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <section className="grid gap-6">
            <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-sky-600">
                    오늘 체크인 상태
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                    {hasCheckedInToday
                      ? "오늘 기록이 있어요"
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
                      최근 기록 시각
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
                  첫 체크인을 남기면 오늘 상태와 조정 메모가 여기에 표시돼요.
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
                    이번 주 식단 요약
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                    {latestMealPlan
                      ? `${formatDateLabel(latestMealPlan.week_start_date)} 시작`
                      : "아직 생성된 식단이 없어요"}
                  </h2>
                </div>

                <Link
                  href="/meal-plan"
                  className="text-sm font-semibold text-sky-600 hover:text-sky-500"
                >
                  전체 식단 보기
                </Link>
              </div>

              {latestMealPlan ? (
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
                          {latestMealPlan.status}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          체크인 연동
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
                          {latestMealPlan.source_checkin_id ? "반영됨" : "기본 프로필 기준"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-lg bg-[var(--background)] p-4">
                    {todayPlanDay ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                            {todayPlanDay.date === todayDate ? "오늘 식단" : "가장 가까운 식단"}
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
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-[var(--muted)]">
                        식단 요약을 준비하는 중이에요.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <Notice title="식단 생성이 아직 없어요" tone="info">
                    현재 프로필을 바탕으로 주간 식단을 만들어 보세요.
                  </Notice>
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
                  오늘의 조정 메모
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
                  요약 상태
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--foreground)]">
                  <li>
                    오늘 체크인: {hasCheckedInToday ? "완료" : "미완료"}
                  </li>
                  <li>
                    최근 식단: {latestMealPlan ? "생성됨" : "미생성"}
                  </li>
                  <li>
                    프로필: {profile ? "완료" : "미완료"}
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
