import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileEditor } from "@/app/profile/ProfileEditor";
import { Notice } from "@/components/ui/Notice";
import { profileSchema } from "@/lib/health/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

function asStringArray(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("프로필을 불러오지 못했습니다.");
  }

  if (!profileRow) {
    return (
      <main className="px-4 py-6 sm:px-6 sm:py-10">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-sky-600">프로필</p>
            <h1 className="text-3xl font-semibold text-[var(--foreground)]">
              프로필을 먼저 만들어 주세요
            </h1>
          </div>

          <Notice tone="warning" title="저장된 프로필이 없어요">
            <Link href="/onboarding" className="font-semibold underline">
              온보딩으로 이동
            </Link>
            하여 기본 건강 정보를 먼저 입력해 주세요.
          </Notice>
        </section>
      </main>
    );
  }

  const parsedProfile = profileSchema.safeParse({
    nickname: profileRow.nickname,
    birthDate: profileRow.birth_date,
    heightCm: profileRow.height_cm,
    weightKg: profileRow.weight_kg,
    weightGoal: profileRow.weight_goal,
    healthConcerns: asStringArray(profileRow.health_concerns),
    currentCondition: profileRow.current_condition,
    favoriteFoods: asStringArray(profileRow.favorite_foods),
    avoidedFoods: asStringArray(profileRow.avoided_foods),
    allergies: asStringArray(profileRow.allergies),
  });

  if (!parsedProfile.success) {
    throw new Error("프로필 정보가 완전하지 않습니다.");
  }

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sky-600">프로필</p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            건강 프로필 수정
          </h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            현재 상태와 식사 선호를 업데이트하면 식단과 가이드가 더 잘 맞게 조정돼요.
          </p>
        </div>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8">
          <ProfileEditor profile={parsedProfile.data} />
        </section>
      </section>
    </main>
  );
}
