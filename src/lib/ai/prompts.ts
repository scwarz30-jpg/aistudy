import type { DailyCheckinInput, ProfileInput } from "@/lib/health/schema";
import type { calculateBmi } from "@/lib/health/rules";

type BmiSummary = ReturnType<typeof calculateBmi>;

export type BuildMealPlanPromptInput = {
  weekStartDate: string;
  profile: ProfileInput;
  latestCheckin: DailyCheckinInput | null;
  excludedFoods: string[];
  preferredFoods: string[];
  bmi: BmiSummary;
};

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "None";
}

export function buildMealPlanPrompt(input: BuildMealPlanPromptInput) {
  const profileSummaryParts = [
    `Nickname: ${input.profile.nickname}`,
    `Height: ${input.profile.heightCm} cm`,
    `Weight: ${input.profile.weightKg} kg`,
    `Current condition: ${input.profile.currentCondition ?? "Not provided"}`,
    `Health concerns: ${formatList(input.profile.healthConcerns)}`,
  ];

  const latestCheckinSummary = input.latestCheckin
    ? [
        `Condition score: ${input.latestCheckin.conditionScore}/10`,
        `Sleep quality: ${input.latestCheckin.sleepQuality}/10`,
        `Stress level: ${input.latestCheckin.stressLevel}/10`,
        `Appetite: ${input.latestCheckin.appetite ?? "Not provided"}`,
        `Digestion: ${input.latestCheckin.digestion ?? "Not provided"}`,
        `Symptoms: ${formatList(input.latestCheckin.symptoms)}`,
        `Notes: ${input.latestCheckin.notes ?? "Not provided"}`,
      ].join("; ")
    : "No recent daily check-in was provided.";

  return [
    "Create a personalized seven-day meal plan in JSON.",
    `Week start date: ${input.weekStartDate}`,
    `Profile summary: ${profileSummaryParts.join("; ")}`,
    `Food exclusions: ${formatList(input.excludedFoods)}`,
    `Preferred foods: ${formatList(input.preferredFoods)}`,
    `BMI category: ${input.bmi.category} (BMI ${input.bmi.value})`,
    `Weight goal: ${input.profile.weightGoal}`,
    `Latest check-in summary: ${latestCheckinSummary}`,
    'Respond with valid JSON matching this shape: {"weekStartDate":"YYYY-MM-DD","status":"active","sourceProfileSnapshot":{},"sourceCheckinId":null,"days":[{"dayIndex":0,"date":"YYYY-MM-DD","breakfast":{"name":"string","description":"string or null"},"lunch":{"name":"string","description":"string or null"},"dinner":{"name":"string","description":"string or null"},"snack":{"name":"string","description":"string or null"},"explanation":"string or null"}]}.',
    "Each day must include breakfast, lunch, and dinner. Snack is optional.",
    "Keep meal names practical, specific, and compatible with the listed exclusions.",
    "Do not diagnose, prescribe, or claim to cure medical conditions.",
  ].join("\n");
}
