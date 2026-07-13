import { ProfileEditor } from "@/app/profile/ProfileEditor";
import { Notice } from "@/components/ui/Notice";
import { profileSchema } from "@/lib/health/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

import { OnboardingForm } from "./OnboardingForm";

function asStringArray(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return <OnboardingForm />;
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
    return <OnboardingForm />;
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
          <p className="text-sm font-semibold text-sky-600">프로필 입력</p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            저장된 프로필 수정
          </h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            이미 저장된 건강 프로필을 불러왔어요. 필요한 부분만 수정하면 됩니다.
          </p>
        </div>

        <Notice tone="info" title="기존 프로필을 불러왔어요">
          아래 값은 Supabase에 저장되어 있던 프로필 정보입니다.
        </Notice>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8">
          <ProfileEditor profile={parsedProfile.data} />
        </section>
      </section>
    </main>
  );
}
