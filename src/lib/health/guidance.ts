import type {
  DailyCheckinInput,
  GuidanceItemInput,
  ProfileInput,
} from "@/lib/health/schema";

export const MEDICINE_SAFETY_SENTENCE =
  "이 내용은 일반 정보이며 진단이나 처방이 아닙니다. 약을 사용하기 전에는 의사나 약사와 상담해 주세요.";

export type GuidanceItem = GuidanceItemInput;

function buildExerciseGuidance(
  profile: ProfileInput,
  checkin: DailyCheckinInput | null,
): GuidanceItem {
  if (!checkin) {
    return {
      category: "exercise",
      title: "가볍게 시작하는 활동 가이드",
      content: `${profile.nickname}님 기준 운동 강도를 정확히 맞추려면 최근 체크인이 있으면 좋아요. 오늘은 15분 정도의 가벼운 걷기와 부드러운 스트레칭으로 몸 반응을 먼저 살펴보세요.`,
      safetyNotice: "어지럽거나 통증이 있으면 운동을 멈추고 휴식을 우선하세요.",
      sourceCheckinId: null,
    };
  }

  if (checkin.exercisedToday) {
    return {
      category: "exercise",
      title: "오늘은 회복을 챙기는 운동 루틴",
      content:
        "이미 운동을 했다면 강도를 더 올리기보다 10분 정도의 정리 스트레칭, 호흡 정리, 가벼운 보행으로 회복에 집중해 보세요.",
      safetyNotice: "심한 피로감이나 두근거림이 있으면 추가 운동은 미루세요.",
      sourceCheckinId: null,
    };
  }

  if (checkin.conditionScore <= 4 || checkin.sleepQuality <= 4) {
    return {
      category: "exercise",
      title: "무리 없는 저강도 움직임",
      content:
        "컨디션과 수면 점수가 낮은 날에는 10~20분 산책, 가벼운 관절 가동 운동, 목과 어깨 스트레칭처럼 부담이 적은 활동이 더 잘 맞습니다.",
      safetyNotice: "숨이 차거나 증상이 심해지면 운동 대신 휴식과 수분 보충을 선택하세요.",
      sourceCheckinId: null,
    };
  }

  return {
    category: "exercise",
    title: "리듬을 살리는 일상 운동",
    content:
      "오늘은 20~30분 걷기나 가벼운 근력 운동처럼 꾸준히 이어갈 수 있는 활동이 좋습니다. 운동 전후로 물을 챙기고, 몸이 풀리는 느낌을 기준으로 강도를 조절해 보세요.",
    safetyNotice: "새로운 통증이 생기면 강도를 낮추고 상태를 다시 확인하세요.",
    sourceCheckinId: null,
  };
}

function buildLifestyleGuidance(
  profile: ProfileInput,
  checkin: DailyCheckinInput | null,
): GuidanceItem {
  const lifestyleParts: string[] = [];

  if (!checkin) {
    lifestyleParts.push(
      "최근 체크인이 없어서 생활 리듬 중심으로 안내드려요. 오늘은 식사와 수면 시간을 크게 흔들지 않는 것부터 시작해 보세요.",
    );
  } else {
    if (checkin.stressLevel >= 7) {
      lifestyleParts.push(
        "스트레스 점수가 높아 보여서 일정 사이에 5분 정도 호흡을 고르는 짧은 휴식 시간을 먼저 확보하는 편이 좋습니다.",
      );
    }

    if (checkin.sleepQuality <= 4) {
      lifestyleParts.push(
        "수면 질이 낮은 날에는 카페인을 늦은 시간까지 끌고 가지 말고, 저녁에는 화면 밝기와 자극적인 활동을 줄여 보세요.",
      );
    }
  }

  if (profile.currentCondition) {
    lifestyleParts.push(
      `현재 컨디션 메모("${profile.currentCondition}")를 보면 몸 상태를 세밀하게 살피는 편이 좋아 보여요.`,
    );
  }

  if (lifestyleParts.length === 0) {
    lifestyleParts.push(
      "생활 리듬은 비교적 안정적이니 식사, 수면, 활동 시간을 비슷하게 유지하면서 과로만 피하는 방향으로 관리해 보세요.",
    );
  }

  return {
    category: "lifestyle",
    title: "생활 리듬 관리",
    content: lifestyleParts.join(" "),
    safetyNotice: "증상이 빠르게 심해지면 자가 관리보다 진료 상담을 우선하세요.",
    sourceCheckinId: null,
  };
}

function buildNutritionGuidance(
  profile: ProfileInput,
  checkin: DailyCheckinInput | null,
): GuidanceItem {
  const preferredFoods = profile.favoriteFoods.slice(0, 2).join(", ");
  const excludedFoods = [...profile.avoidedFoods, ...profile.allergies]
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const nutritionParts: string[] = [];

  if (!checkin) {
    nutritionParts.push(
      "체크인 정보가 없을 때는 소화 부담이 적고 규칙적으로 먹기 쉬운 구성이 기본입니다.",
    );
  } else {
    if (checkin.appetite === "low") {
      nutritionParts.push(
        "식욕이 낮다면 한 번에 많이 먹기보다 죽, 수프, 요거트처럼 양을 나눠 먹기 쉬운 식사를 고려해 보세요.",
      );
    }

    if (
      checkin.digestion === "bloated" ||
      checkin.digestion === "sensitive" ||
      checkin.digestion === "upset"
    ) {
      nutritionParts.push(
        "소화가 예민한 날에는 기름지거나 매우 자극적인 음식보다 익힌 채소, 단백질, 따뜻한 국물처럼 편안한 조합이 더 무난합니다.",
      );
    }

    if ((checkin.waterIntake ?? 0) < 5) {
      nutritionParts.push(
        "수분 섭취가 적었다면 물이나 무가당 차를 조금씩 자주 마셔 몸이 처지지 않도록 보완해 보세요.",
      );
    }
  }

  if (preferredFoods) {
    nutritionParts.push(
      `좋아하는 음식인 ${preferredFoods} 쪽에서 부담이 덜한 조합을 고르면 지속하기가 쉽습니다.`,
    );
  }

  if (excludedFoods) {
    nutritionParts.push(`피하거나 주의할 음식(${excludedFoods})은 계속 제외하세요.`);
  }

  if (nutritionParts.length === 0) {
    nutritionParts.push(
      "오늘은 탄수화물, 단백질, 채소를 한 끼에 균형 있게 담고 늦은 야식만 줄여도 충분한 관리가 됩니다.",
    );
  }

  return {
    category: "nutrition",
    title: "식사 조절 포인트",
    content: nutritionParts.join(" "),
    safetyNotice: "알레르기 반응이 있거나 음식을 먹기 어려울 정도의 증상이 있으면 전문 진료를 받으세요.",
    sourceCheckinId: null,
  };
}

function buildMedicineGuidance(
  checkin: DailyCheckinInput | null,
): GuidanceItem {
  const symptomContext =
    checkin && checkin.symptoms.length > 0
      ? `현재 적어둔 증상(${checkin.symptoms.slice(0, 2).join(", ")})에 대해서도`
      : "현재 느끼는 불편감에 대해서도";

  return {
    category: "medicine_info",
    title: "일반 의약품 참고 안내",
    content: `${symptomContext} 복용 중인 약, 알레르기, 기저질환 여부에 따라 선택이 달라질 수 있습니다. ${MEDICINE_SAFETY_SENTENCE}`,
    safetyNotice:
      "증상이 심하거나 오래가면 스스로 약을 추가하기보다 의료진과 상의하세요.",
    sourceCheckinId: null,
  };
}

export function buildGuidance(
  profile: ProfileInput,
  checkin: DailyCheckinInput | null,
): GuidanceItem[] {
  return [
    buildExerciseGuidance(profile, checkin),
    buildLifestyleGuidance(profile, checkin),
    buildNutritionGuidance(profile, checkin),
    buildMedicineGuidance(checkin),
  ];
}
