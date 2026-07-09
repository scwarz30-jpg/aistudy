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
    name: "Greek yogurt berry bowl",
    description: "Greek yogurt with berries, oats, and chia seeds.",
  },
  {
    name: "Spinach egg toast",
    description: "Whole-grain toast with scrambled eggs and sauteed spinach.",
  },
  {
    name: "Tofu vegetable rice bowl",
    description: "Warm brown rice with tofu, zucchini, and sesame oil.",
  },
  {
    name: "Banana oatmeal",
    description: "Rolled oats cooked with banana slices and cinnamon.",
  },
];

const lunchOptions: MealTemplate[] = [
  {
    name: "Chicken grain bowl",
    description: "Grilled chicken, brown rice, cucumber, and mixed greens.",
  },
  {
    name: "Salmon sweet potato plate",
    description: "Baked salmon with roasted sweet potato and broccoli.",
  },
  {
    name: "Tofu soba salad",
    description: "Chilled soba noodles with tofu, cabbage, and carrots.",
  },
  {
    name: "Turkey avocado wrap",
    description: "Whole-grain wrap with turkey, avocado, lettuce, and tomato.",
  },
];

const dinnerOptions: MealTemplate[] = [
  {
    name: "Beef vegetable stir-fry",
    description: "Lean beef with bell peppers, mushrooms, and rice.",
  },
  {
    name: "Herb chicken quinoa plate",
    description: "Roasted chicken with quinoa and green beans.",
  },
  {
    name: "Miso cod rice set",
    description: "Cod with steamed rice, bok choy, and light miso broth.",
  },
  {
    name: "Lentil tomato pasta",
    description: "Lentil pasta with tomato sauce and roasted vegetables.",
  },
];

const snackOptions: MealTemplate[] = [
  {
    name: "Apple with almond butter",
    description: "Sliced apple with a small serving of almond butter.",
  },
  {
    name: "Carrot hummus cup",
    description: "Carrot sticks with hummus.",
  },
  {
    name: "Cottage cheese fruit cup",
    description: "Cottage cheese with pineapple or berries.",
  },
  {
    name: "Edamame pack",
    description: "Steamed edamame with a pinch of sea salt.",
  },
];

const weightGoalExplanations = {
  lose: "Meals emphasize steady energy, fiber, and portion-friendly balance for a weight-loss goal.",
  maintain:
    "Meals emphasize balanced energy, steady protein, and variety for weight maintenance.",
  gain: "Meals emphasize calorie-dense staples, protein, and consistent fueling for a weight-gain goal.",
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
      description: "Prepared to fit the listed exclusions.",
    };
  }

  return allowedOptions[offset % allowedOptions.length];
}

function addDays(dateString: string, dayOffset: number) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

function buildMockMealPlan(
  input: GenerateStructuredMealPlanInput,
): MealPlanInput {
  return {
    weekStartDate: input.weekStartDate,
    status: "active",
    sourceProfileSnapshot: input.sourceProfileSnapshot,
    sourceCheckinId: input.sourceCheckinId,
    days: Array.from({ length: 7 }, (_, dayIndex) => {
      const breakfast = pickAllowedMeal(
        breakfastOptions,
        input.excludedFoods,
        dayIndex,
        "Breakfast plate",
      );
      const lunch = pickAllowedMeal(
        lunchOptions,
        input.excludedFoods,
        dayIndex + 1,
        "Lunch plate",
      );
      const dinner = pickAllowedMeal(
        dinnerOptions,
        input.excludedFoods,
        dayIndex + 2,
        "Dinner plate",
      );
      const snack = pickAllowedMeal(
        snackOptions,
        input.excludedFoods,
        dayIndex + 3,
        "Snack cup",
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
            ? `Preferred foods considered: ${input.preferredFoods.join(", ")}.`
            : "Preferred foods were not provided.",
          `BMI category considered: ${input.bmi.category}.`,
        ].join(" "),
      };
    }),
  };
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

  return JSON.parse(jsonText);
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
            content: "You create structured weekly meal plans and respond only with JSON.",
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
    throw new Error(`AI provider request failed with status ${response.status}.`);
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
    throw new Error("AI provider returned an empty response.");
  }

  return parseMealPlanJson(content);
}

export async function generateStructuredMealPlan(
  input: GenerateStructuredMealPlanInput,
): Promise<MealPlanInput> {
  const fallbackMealPlan = buildMockMealPlan(input);
  const fallbackResult = safeParseMealPlan(
    fallbackMealPlan,
    input.excludedFoods,
  );

  if (!fallbackResult.success) {
    throw new Error("Deterministic meal plan failed validation.");
  }

  if (!process.env.AI_PROVIDER_API_KEY) {
    return fallbackResult.data;
  }

  try {
    const aiMealPlan = await requestAiMealPlan(input);
    const validatedMealPlan = safeParseMealPlan(
      aiMealPlan,
      input.excludedFoods,
    );

    if (!validatedMealPlan.success) {
      throw new Error("AI meal plan failed validation.");
    }

    return validatedMealPlan.data;
  } catch {
    return fallbackResult.data;
  }
}
