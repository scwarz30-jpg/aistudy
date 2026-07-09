"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveProfile, type SaveProfileResult } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";

const initialResult: SaveProfileResult | null = null;

export default function OnboardingPage() {
  const router = useRouter();
  const [result, setResult] = useState<SaveProfileResult | null>(initialResult);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const nextResult = await saveProfile(formData);
      setResult(nextResult);

      if (nextResult.ok) {
        router.replace("/dashboard");
      }
    } catch {
      setResult({
        ok: false,
        message: "We could not save your profile. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sky-600">Onboarding</p>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Build your baseline health profile
          </h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Share the minimum details we need to personalize meal plans,
            check-ins, and guidance.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nickname"
              name="nickname"
              placeholder="Mina"
              required
            />
            <TextField label="Birth date" name="birthDate" type="date" />
            <TextField
              label="Height (cm)"
              name="heightCm"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              placeholder="165"
              required
            />
            <TextField
              label="Weight (kg)"
              name="weightKg"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              placeholder="58"
              required
            />
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
            <span>Goal</span>
            <select
              name="weightGoal"
              defaultValue="maintain"
              className="min-h-12 rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Gain weight</option>
            </select>
          </label>

          <div className="grid gap-4">
            <TextField
              label="Health concerns"
              name="healthConcerns"
              textarea
              placeholder="Fatigue, digestion discomfort, blood sugar management"
              hint="Separate multiple concerns with commas or line breaks."
            />
            <TextField
              label="Current condition"
              name="currentCondition"
              textarea
              placeholder="Briefly describe your recent sleep, stress, and meal rhythm."
            />
            <TextField
              label="Favorite foods"
              name="favoriteFoods"
              textarea
              placeholder="Salmon, tofu, bananas"
              hint="Separate multiple foods with commas or line breaks."
            />
            <TextField
              label="Foods to avoid"
              name="avoidedFoods"
              textarea
              placeholder="Peanuts, spicy food"
            />
            <TextField
              label="Allergies"
              name="allergies"
              textarea
              placeholder="Milk, shellfish"
            />
          </div>

          <Notice tone="warning" title="Health notice">
            <p>
              This information is for general wellness guidance only and does
              not replace medical diagnosis or treatment.
            </p>
            <p className="mt-2">
              If you have symptoms or take medication, speak with a qualified
              professional first.
            </p>
          </Notice>

          {result && !result.ok ? (
            <Notice tone="error" title="Could not save your profile">
              {result.message}
            </Notice>
          ) : null}

          <Button type="submit" pending={isPending}>
            Save profile
          </Button>
        </form>
      </section>
    </main>
  );
}
