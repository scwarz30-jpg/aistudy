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
  return values.length > 0 ? values.join(", ") : "없음";
}

const bmiCategoryLabels = {
  underweight: "저체중",
  normal: "정상",
  overweight: "과체중",
  obese: "비만",
} as const;

const weightGoalLabels = {
  lose: "감량",
  maintain: "유지",
  gain: "증량",
} as const;

export function buildMealPlanPrompt(input: BuildMealPlanPromptInput) {
  const profileSummaryParts = [
    `닉네임: ${input.profile.nickname}`,
    `키: ${input.profile.heightCm} cm`,
    `몸무게: ${input.profile.weightKg} kg`,
    `현재 컨디션: ${input.profile.currentCondition ?? "입력 없음"}`,
    `건강 고민: ${formatList(input.profile.healthConcerns)}`,
  ];

  const latestCheckinSummary = input.latestCheckin
    ? [
        `컨디션 점수: ${input.latestCheckin.conditionScore}/10`,
        `수면의 질: ${input.latestCheckin.sleepQuality}/10`,
        `스트레스: ${input.latestCheckin.stressLevel}/10`,
        `식욕: ${input.latestCheckin.appetite ?? "입력 없음"}`,
        `소화 상태: ${input.latestCheckin.digestion ?? "입력 없음"}`,
        `증상: ${formatList(input.latestCheckin.symptoms)}`,
        `메모: ${input.latestCheckin.notes ?? "입력 없음"}`,
      ].join("; ")
    : "최근 체크인이 없습니다.";

  return [
    "개인 맞춤 일주일 식단표를 JSON으로 생성해 주세요.",
    `시작일: ${input.weekStartDate}`,
    `프로필 요약: ${profileSummaryParts.join("; ")}`,
    `제외 음식: ${formatList(input.excludedFoods)}`,
    `좋아하는 음식: ${formatList(input.preferredFoods)}`,
    `BMI 분류: ${bmiCategoryLabels[input.bmi.category]} (BMI ${input.bmi.value})`,
    `체중 목표: ${weightGoalLabels[input.profile.weightGoal]}`,
    `최근 체크인 요약: ${latestCheckinSummary}`,
    'Respond with valid JSON matching this shape: {"weekStartDate":"YYYY-MM-DD","status":"active","sourceProfileSnapshot":{},"sourceCheckinId":null,"days":[{"dayIndex":0,"date":"YYYY-MM-DD","breakfast":{"name":"string","description":"string or null"},"lunch":{"name":"string","description":"string or null"},"dinner":{"name":"string","description":"string or null"},"snack":{"name":"string","description":"string or null"},"explanation":"string or null"}]}.',
    "각 날짜에는 아침, 점심, 저녁이 반드시 있어야 하고 간식은 선택입니다.",
    "식사 이름과 설명은 사용자가 읽는 화면에 표시되므로 자연스러운 한국어로 작성하세요.",
    "제외 음식과 알레르기를 절대 포함하지 마세요.",
    "진단, 처방, 치료 효과를 단정하지 마세요.",
  ].join("\n");
}
