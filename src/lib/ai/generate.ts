import "server-only";

import type { MealPlanInput } from "@/lib/health/schema";
import { safeParseMealPlan } from "@/lib/health/schema";

import {
  buildMealPlanPrompt,
  type BuildMealPlanPromptInput,
} from "@/lib/ai/prompts";

export type GenerateStructuredMealPlanInput = BuildMealPlanPromptInput & {
  sourceProfileSnapshot: Record<string, unknown>;
  sourceCheckinId: string | null;
};

type MealTemplate = {
  name: string;
  description: string;
};

const breakfastOptions: MealTemplate[] = [
  {
    name: "그릭요거트 베리 볼",
    description: "그릭요거트에 베리, 오트, 치아씨드를 곁들인 아침 식사입니다.",
  },
  {
    name: "시금치 달걀 토스트",
    description: "통곡물 토스트에 스크램블드 에그와 볶은 시금치를 올린 식사입니다.",
  },
  {
    name: "두부 채소 현미덮밥",
    description: "따뜻한 현미밥에 두부, 애호박, 참기름을 더한 든든한 한 그릇입니다.",
  },
  {
    name: "바나나 오트밀",
    description: "오트에 바나나와 시나몬을 넣어 부드럽게 끓인 아침 식사입니다.",
  },
];

const lunchOptions: MealTemplate[] = [
  {
    name: "닭가슴살 곡물 볼",
    description: "구운 닭가슴살, 현미밥, 오이, 잎채소를 담은 점심 식사입니다.",
  },
  {
    name: "연어 고구마 플레이트",
    description: "구운 연어에 고구마와 브로콜리를 곁들인 균형 잡힌 식사입니다.",
  },
  {
    name: "두부 메밀면 샐러드",
    description: "차가운 메밀면에 두부, 양배추, 당근을 더한 산뜻한 점심입니다.",
  },
  {
    name: "칠면조 아보카도 랩",
    description: "통곡물 또띠아에 칠면조, 아보카도, 양상추, 토마토를 넣은 랩입니다.",
  },
];

const dinnerOptions: MealTemplate[] = [
  {
    name: "소고기 채소 볶음",
    description: "기름기 적은 소고기와 파프리카, 버섯을 밥과 함께 먹는 저녁입니다.",
  },
  {
    name: "허브 치킨 퀴노아 플레이트",
    description: "허브로 구운 닭고기에 퀴노아와 그린빈을 곁들인 식사입니다.",
  },
  {
    name: "대구 된장국 밥상",
    description: "대구, 밥, 청경채, 맑은 된장국을 함께 구성한 저녁입니다.",
  },
  {
    name: "렌틸 토마토 파스타",
    description: "렌틸 파스타에 토마토소스와 구운 채소를 더한 식사입니다.",
  },
];

const snackOptions: MealTemplate[] = [
  {
    name: "사과와 아몬드버터",
    description: "얇게 썬 사과에 소량의 아몬드버터를 곁들인 간식입니다.",
  },
  {
    name: "당근 후무스 컵",
    description: "스틱 당근을 후무스에 찍어 먹는 간단한 간식입니다.",
  },
  {
    name: "코티지치즈 과일 컵",
    description: "코티지치즈에 파인애플이나 베리를 곁들인 간식입니다.",
  },
  {
    name: "에다마메 한 팩",
    description: "찐 에다마메에 소금을 아주 조금 더한 간식입니다.",
  },
];

const weightGoalExplanations = {
  lose: "감량 목표에 맞춰 포만감, 식이섬유, 적절한 양 조절을 우선했습니다.",
  maintain:
    "유지 목표에 맞춰 균형 잡힌 에너지, 단백질, 식단 다양성을 우선했습니다.",
  gain: "증량 목표에 맞춰 에너지 밀도, 단백질, 꾸준한 영양 보충을 우선했습니다.",
} as const;

const bmiCategoryLabels = {
  underweight: "저체중",
  normal: "정상",
  overweight: "과체중",
  obese: "비만",
} as const;

function normalizeFoodName(value: string) {
  return value.trim().toLowerCase();
}

function containsExcludedFood(
  meal: MealTemplate,
  excludedFoods: string[],
) {
  const haystack = `${meal.name} ${meal.description}`.toLowerCase();
  return excludedFoods.some((food) => haystack.includes(food));
}

function pickAllowedMeal(
  options: MealTemplate[],
  excludedFoods: string[],
  offset: number,
  fallbackName: string,
) {
  const normalizedExcludedFoods = excludedFoods
    .map(normalizeFoodName)
    .filter(Boolean);

  const allowedOptions = options.filter(
    (option) => !containsExcludedFood(option, normalizedExcludedFoods),
  );

  if (allowedOptions.length === 0) {
    return {
      name: fallbackName,
      description: "입력한 제외 음식을 피하도록 구성한 대체 식사입니다.",
    };
  }

  return allowedOptions[offset % allowedOptions.length];
}

function addDays(dateString: string, dayOffset: number) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

function buildCheckinSignature(
  input: GenerateStructuredMealPlanInput["latestCheckin"],
) {
  if (!input) {
    return "";
  }

  return JSON.stringify({
    conditionScore: input.conditionScore,
    sleepQuality: input.sleepQuality,
    stressLevel: input.stressLevel,
    exercisedToday: input.exercisedToday,
    appetite: input.appetite,
    digestion: input.digestion,
    symptoms: input.symptoms,
    symptomSeverity: input.symptomSeverity,
    waterIntake: input.waterIntake,
    notes: input.notes,
  });
}

function hashText(value: string) {
  return Array.from(value).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) % 997,
    0,
  );
}

function buildCheckinExplanation(
  input: GenerateStructuredMealPlanInput["latestCheckin"],
) {
  if (!input) {
    return "최근 체크인이 없어 프로필을 기준으로 구성했습니다.";
  }

  const details = [
    `컨디션 ${input.conditionScore}/10`,
    `수면 ${input.sleepQuality}/10`,
    `스트레스 ${input.stressLevel}/10`,
  ];

  if (input.appetite) {
    details.push(`식욕 ${input.appetite}`);
  }

  if (input.digestion) {
    details.push(`소화 ${input.digestion}`);
  }

  if ((input.symptomSeverity ?? 0) > 0) {
    details.push(`증상 강도 ${input.symptomSeverity}/10`);
  }

  return `최근 체크인(${details.join(", ")})을 반영해 오늘 몸상태에 맞게 다시 배치했습니다.`;
}

function buildMockMealPlan(
  input: GenerateStructuredMealPlanInput,
): MealPlanInput {
  const checkinOffset = hashText(buildCheckinSignature(input.latestCheckin));
  const checkinExplanation = buildCheckinExplanation(input.latestCheckin);

  return {
    weekStartDate: input.weekStartDate,
    status: "active",
    sourceProfileSnapshot: input.sourceProfileSnapshot,
    sourceCheckinId: input.sourceCheckinId,
    days: Array.from({ length: 7 }, (_, dayIndex) => {
      const breakfast = pickAllowedMeal(
        breakfastOptions,
        input.excludedFoods,
        dayIndex + checkinOffset,
        "아침 대체 식단",
      );
      const lunch = pickAllowedMeal(
        lunchOptions,
        input.excludedFoods,
        dayIndex + checkinOffset + 1,
        "점심 대체 식단",
      );
      const dinner = pickAllowedMeal(
        dinnerOptions,
        input.excludedFoods,
        dayIndex + checkinOffset + 2,
        "저녁 대체 식단",
      );
      const snack = pickAllowedMeal(
        snackOptions,
        input.excludedFoods,
        dayIndex + checkinOffset + 3,
        "간식 대체 구성",
      );

      return {
        dayIndex,
        date: addDays(input.weekStartDate, dayIndex),
        breakfast,
        lunch,
        dinner,
        snack,
        explanation: [
          weightGoalExplanations[input.profile.weightGoal],
          input.preferredFoods.length > 0
            ? `좋아하는 음식(${input.preferredFoods.join(", ")})을 참고했습니다.`
            : "좋아하는 음식 정보가 없어 기본 균형 식단으로 구성했습니다.",
          checkinExplanation,
          `BMI 분류(${bmiCategoryLabels[input.bmi.category]})를 참고했습니다.`,
        ].join(" "),
      };
    }),
  };
}

function buildValidatedFallbackMealPlan(input: GenerateStructuredMealPlanInput) {
  const fallbackMealPlan = buildMockMealPlan(input);
  const fallbackResult = safeParseMealPlan(
    fallbackMealPlan,
    input.excludedFoods,
  );

  if (!fallbackResult.success) {
    throw new Error("기본 식단표 검증에 실패했습니다.");
  }

  return fallbackResult.data;
}

function extractJsonText(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          part.type === "text" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("");
  }

  return "";
}

function parseMealPlanJson(content: unknown) {
  const rawText = extractJsonText(content).trim();
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/u);
  const jsonText = fencedMatch?.[1]?.trim() ?? rawText;

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error("AI 제공자가 올바른 JSON을 반환하지 않았습니다.");
  }
}

async function requestAiMealPlan(input: GenerateStructuredMealPlanInput) {
  const apiKey = process.env.AI_PROVIDER_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch(
    process.env.AI_PROVIDER_BASE_URL ?? "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_PROVIDER_MODEL ?? "gpt-4o-mini",
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content:
              "당신은 한국어로 구조화된 일주일 식단표를 만드는 도우미입니다. 반드시 JSON만 반환하세요.",
          },
          {
            role: "user",
            content: buildMealPlanPrompt(input),
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`AI 제공자 요청이 실패했습니다. 상태 코드: ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI 제공자가 빈 응답을 반환했습니다.");
  }

  return parseMealPlanJson(content);
}

export async function generateStructuredMealPlan(
  input: GenerateStructuredMealPlanInput,
): Promise<MealPlanInput> {
  if (!process.env.AI_PROVIDER_API_KEY) {
    return buildValidatedFallbackMealPlan(input);
  }

  try {
    const aiMealPlan = await requestAiMealPlan(input);
    const validatedMealPlan = safeParseMealPlan(
      aiMealPlan,
      input.excludedFoods,
    );

    if (!validatedMealPlan.success) {
      throw new Error("AI 식단표 검증에 실패했습니다.");
    }

    return validatedMealPlan.data;
  } catch (error) {
    console.warn(
      "AI 식단표 생성에 실패하여 기본 식단표로 대체합니다.",
      error,
    );
    return buildValidatedFallbackMealPlan(input);
  }
}
