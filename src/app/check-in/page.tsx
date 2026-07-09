"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  saveDailyCheckin,
  type SaveDailyCheckinResult,
} from "@/app/actions/checkins";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { TextField } from "@/components/ui/TextField";

const initialResult: SaveDailyCheckinResult | null = null;

type SelectFieldProps = {
  defaultValue?: string;
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
};

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: SelectFieldProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="min-h-12 rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildScoreOptions() {
  return Array.from({ length: 10 }, (_, index) => {
    const value = String(index + 1);

    return {
      value,
      label: `${value}/10`,
    };
  });
}

const scoreOptions = buildScoreOptions();
const symptomSeverityOptions = [{ value: "0", label: "0/10" }, ...scoreOptions];

export default function CheckInPage() {
  const router = useRouter();
  const [result, setResult] = useState<SaveDailyCheckinResult | null>(
    initialResult,
  );
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setIsPending(true);

    try {
      const nextResult = await saveDailyCheckin(
        new FormData(event.currentTarget),
      );

      setResult(nextResult);

      if (nextResult.ok && nextResult.status === "saved") {
        router.replace("/dashboard");
      }
    } catch {
      setResult({
        ok: false,
        status: "error",
        message: "We could not save this check-in. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  const hasSavedWarning =
    result?.ok === true && result.status === "saved_with_warning";

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-600">
            Daily Check-In
          </p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            Log today&apos;s health status
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Capture the basics first, then add symptoms or notes if you need
            more detail.
          </p>
        </div>

        <Notice tone="warning" title="Safety notice">
          This tool helps with daily tracking. Severe symptoms, breathing
          problems, chest pain, or heavy bleeding should be handled with
          professional care first.
        </Notice>

        {result && "message" in result ? (
          <Notice
            tone={result.ok ? "warning" : "error"}
            title={result.ok ? "Professional care recommended" : "Save failed"}
          >
            {result.message}
          </Notice>
        ) : null}

        {hasSavedWarning ? (
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Check-in saved
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Your urgent check-in was saved. Move to the dashboard or meal
                plan instead of submitting this entry again.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                Go to dashboard
              </Link>
              <Link
                href="/meal-plan"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
              >
                View meal plan
              </Link>
            </div>
          </section>
        ) : (
          <form
            className="space-y-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8"
            onSubmit={handleSubmit}
          >
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Quick check
                </h2>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Record the signals that best describe how you feel today.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Condition score"
                  name="conditionScore"
                  defaultValue="5"
                  options={scoreOptions}
                />
                <SelectField
                  label="Sleep quality"
                  name="sleepQuality"
                  defaultValue="5"
                  options={scoreOptions}
                />
                <SelectField
                  label="Stress level"
                  name="stressLevel"
                  defaultValue="5"
                  options={scoreOptions}
                />
                <SelectField
                  label="Symptom severity"
                  name="symptomSeverity"
                  defaultValue="0"
                  options={symptomSeverityOptions}
                />
                <SelectField
                  label="Appetite"
                  name="appetite"
                  defaultValue=""
                  options={[
                    { value: "", label: "Select" },
                    { value: "normal", label: "Normal" },
                    { value: "low", label: "Low" },
                    { value: "high", label: "High" },
                  ]}
                />
                <SelectField
                  label="Digestion"
                  name="digestion"
                  defaultValue=""
                  options={[
                    { value: "", label: "Select" },
                    { value: "normal", label: "Normal" },
                    { value: "bloated", label: "Bloated" },
                    { value: "sensitive", label: "Sensitive" },
                    { value: "upset", label: "Upset" },
                  ]}
                />
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  name="exercisedToday"
                  className="mt-1 h-4 w-4 rounded border-[var(--border)] text-sky-600 focus:ring-sky-500"
                />
                <span className="leading-6">
                  I exercised today, even if it was light movement.
                </span>
              </label>
            </section>

            <details className="rounded-lg border border-[var(--border)] bg-[var(--background)]">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                Add more detail
              </summary>
              <div className="grid gap-4 border-t border-[var(--border)] px-4 py-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    label="Symptoms"
                    name="symptoms"
                    textarea
                    placeholder="Headache, dizziness, nausea"
                    hint="Separate items with commas or new lines."
                  />
                </div>
                <TextField
                  label="Water intake (cups)"
                  name="waterIntake"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="6"
                />
                <div className="sm:col-span-2">
                  <TextField
                    label="Notes"
                    name="notes"
                    textarea
                    placeholder="Share timing, food reactions, or care plans."
                  />
                </div>
              </div>
            </details>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" pending={isPending}>
                Save check-in
              </Button>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
              >
                Back to dashboard
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
