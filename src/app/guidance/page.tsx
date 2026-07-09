import Link from "next/link";
import { redirect } from "next/navigation";

import { Notice } from "@/components/ui/Notice";
import { buildGuidance } from "@/lib/health/guidance";
import { dailyCheckinSchema, profileSchema } from "@/lib/health/schema";
import { requiresProfessionalCare } from "@/lib/health/rules";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

function asStringArray(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapProfile(row: {
  nickname: string;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  weight_goal: string | null;
  health_concerns: Json;
  current_condition: string | null;
  favorite_foods: Json;
  avoided_foods: Json;
  allergies: Json;
}) {
  return profileSchema.safeParse({
    nickname: row.nickname,
    birthDate: row.birth_date,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    weightGoal: row.weight_goal,
    healthConcerns: asStringArray(row.health_concerns),
    currentCondition: row.current_condition,
    favoriteFoods: asStringArray(row.favorite_foods),
    avoidedFoods: asStringArray(row.avoided_foods),
    allergies: asStringArray(row.allergies),
  });
}

function mapCheckin(
  row:
    | {
        id: string;
        condition_score: number;
        sleep_quality: number;
        stress_level: number;
        exercised_today: boolean;
        appetite: string | null;
        digestion: string | null;
        symptoms: Json;
        symptom_severity: number | null;
        water_intake: number | null;
        notes: string | null;
      }
    | null,
) {
  if (!row) {
    return null;
  }

  const parsed = dailyCheckinSchema.safeParse({
    conditionScore: row.condition_score,
    sleepQuality: row.sleep_quality,
    stressLevel: row.stress_level,
    exercisedToday: row.exercised_today,
    appetite: row.appetite,
    digestion: row.digestion,
    symptoms: asStringArray(row.symptoms),
    symptomSeverity: row.symptom_severity,
    waterIntake: row.water_intake,
    notes: row.notes,
  });

  if (!parsed.success) {
    return null;
  }

  return {
    id: row.id,
    input: parsed.data,
  };
}

const categoryLabels = {
  exercise: "운동",
  lifestyle: "생활 습관",
  nutrition: "영양",
  medicine_info: "일반 의약품 정보",
} as const;

export default async function GuidancePage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const userId = data.user.id;
  const [
    { data: profileRow, error: profileError },
    { data: latestCheckins, error: checkinError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (profileError) {
    throw new Error("Unable to load profile.");
  }

  if (checkinError) {
    throw new Error("Unable to load check-in data.");
  }

  if (!profileRow) {
    return (
      <main className="px-4 py-6 sm:px-6 sm:py-10">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-sky-600">가이드</p>
            <h1 className="text-3xl font-semibold text-[var(--foreground)]">
              맞춤 건강 가이드
            </h1>
            <p className="text-sm leading-6 text-[var(--muted)]">
              프로필 정보가 있어야 생활 습관, 영양, 운동 안내를 더 정확하게 구성할 수 있어요.
            </p>
          </div>

          <Notice tone="warning" title="프로필이 먼저 필요해요">
            <Link href="/onboarding" className="font-semibold underline">
              온보딩으로 이동
            </Link>
            하여 기본 정보를 입력해 주세요.
          </Notice>
        </section>
      </main>
    );
  }

  const parsedProfile = mapProfile(profileRow);

  if (!parsedProfile.success) {
    throw new Error("Profile data is incomplete.");
  }

  const latestCheckin = mapCheckin(latestCheckins?.[0] ?? null);
  const guidance = buildGuidance(parsedProfile.data, latestCheckin?.input ?? null);
  const hasUrgentSymptoms =
    latestCheckin !== null && requiresProfessionalCare(latestCheckin.input);

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-sky-600">가이드</p>
            <h1 className="text-3xl font-semibold text-[var(--foreground)]">
              {parsedProfile.data.nickname}님을 위한 건강 가이드
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
              최근 프로필과 체크인 정보를 바탕으로 운동, 생활 습관, 영양, 일반 의약품 참고 정보를 정리했어요.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/check-in"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              체크인 업데이트
            </Link>
            <Link
              href="/profile"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              프로필 수정
            </Link>
          </div>
        </div>

        {hasUrgentSymptoms ? (
          <Notice tone="warning" title="전문 진료가 먼저 필요할 수 있어요">
            최근 체크인에 응급성 가능성이 있는 증상이 보여요. 아래 일반 가이드는 참고용으로만 보고, 병원이나 약사 상담을 우선해 주세요.
          </Notice>
        ) : null}

        {!latestCheckin ? (
          <Notice tone="info" title="최근 체크인이 없어요">
            오늘 상태를 기록하면 지금 컨디션에 더 맞는 안내를 볼 수 있어요.
          </Notice>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {guidance.map((item) => (
            <article
              key={item.category}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-sky-600">
                    {categoryLabels[item.category]}
                  </p>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    {item.title}
                  </h2>
                </div>
                <p className="text-sm leading-7 text-[var(--foreground)]">
                  {item.content}
                </p>
                {item.safetyNotice ? (
                  <Notice tone={item.category === "medicine_info" ? "warning" : "info"}>
                    {item.safetyNotice}
                  </Notice>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
