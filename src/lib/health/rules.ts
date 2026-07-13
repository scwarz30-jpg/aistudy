import type { DailyCheckinInput, ProfileInput } from "@/lib/health/schema";

const urgentSymptomTerms = [
  "chest pain",
  "difficulty breathing",
  "severe bleeding",
  "흉통",
  "호흡곤란",
  "심한 출혈",
] as const;

function normalizeFoodName(value: string) {
  return value.trim().toLowerCase();
}

function dedupeFoods(values: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const key = normalizeFoodName(trimmed);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(trimmed);
  }

  return deduped;
}

export function calculateBmi(heightCm: number, weightKg: number) {
  const heightMeters = heightCm / 100;
  const rawValue = weightKg / (heightMeters * heightMeters);
  const value = Math.round(rawValue * 10) / 10;

  if (rawValue < 18.5) {
    return { value, category: "underweight" as const };
  }

  if (rawValue < 25) {
    return { value, category: "normal" as const };
  }

  if (rawValue < 30) {
    return { value, category: "overweight" as const };
  }

  return { value, category: "obese" as const };
}

export function buildFoodConstraints(profile: ProfileInput) {
  return {
    excludedFoods: dedupeFoods([
      ...profile.avoidedFoods,
      ...profile.allergies,
    ]),
    preferredFoods: dedupeFoods(profile.favoriteFoods),
  };
}

export function requiresProfessionalCare(checkin: DailyCheckinInput) {
  if ((checkin.symptomSeverity ?? 0) >= 8) {
    return true;
  }

  const symptomText = [...checkin.symptoms, checkin.notes ?? ""]
    .join(" ")
    .toLowerCase();

  return urgentSymptomTerms.some((term) =>
    symptomText.includes(term.toLowerCase()),
  );
}
