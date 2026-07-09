import Link from "next/link";
import { redirect } from "next/navigation";

import { Notice } from "@/components/ui/Notice";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formatDateLabel(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateString}T00:00:00.000Z`));
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: mealPlans }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nickname, weight_goal")
      .eq("user_id", data.user.id)
      .maybeSingle(),
    supabase
      .from("meal_plans")
      .select("id, week_start_date, status, created_at")
      .eq("user_id", data.user.id)
      .order("week_start_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const latestMealPlan = mealPlans?.[0] ?? null;

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-600">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            Welcome back{profile?.nickname ? `, ${profile.nickname}` : ""}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Keep your health profile current, then review the latest weekly meal
            recommendations tailored to your goals.
          </p>
        </div>

        {!profile ? (
          <Notice title="Profile setup needed" tone="warning">
            Complete onboarding before generating meal recommendations.
          </Notice>
        ) : null}

        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-sky-600">
                Meal recommendations
              </p>
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                Personalized weekly meal plan
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Review suggested breakfasts, lunches, dinners, snacks, and
                explanations built from your profile and latest check-in.
              </p>
            </div>

            <Link
              href="/meal-plan"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              Open meal plan
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-[var(--background)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Weight goal
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                {profile?.weight_goal ?? "Unavailable"}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--background)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Latest plan
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                {latestMealPlan
                  ? formatDateLabel(latestMealPlan.week_start_date)
                  : "Not generated yet"}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--background)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Plan status
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                {latestMealPlan?.status ?? "Awaiting generation"}
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
