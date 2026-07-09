import { requiresProfessionalCare } from "@/lib/health/rules";
import { getSeoulDateString } from "@/lib/date/seoul";
import type { Database, Json } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DailyCheckinRow = Database["public"]["Tables"]["daily_checkins"]["Row"];

function asStringArray(value: Json) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function buildAdjustmentNotice(
  profile: ProfileRow | null,
  latestCheckin: DailyCheckinRow | null,
) {
  if (!profile) {
    return {
      tone: "warning" as const,
      title: "프로필 설정이 먼저 필요해요",
      message:
        "온보딩을 완료하면 체크인과 식단 요약을 더 정확하게 연결할 수 있어요.",
    };
  }

  if (!latestCheckin) {
    return {
      tone: "info" as const,
      title: "오늘 조정 메모 준비 중",
      message:
        "오늘 체크인을 남기면 컨디션에 맞는 식단 메모를 바로 보여드릴게요.",
    };
  }

  const mappedCheckin = {
    conditionScore: latestCheckin.condition_score,
    sleepQuality: latestCheckin.sleep_quality,
    stressLevel: latestCheckin.stress_level,
    exercisedToday: latestCheckin.exercised_today,
    appetite: latestCheckin.appetite,
    digestion: latestCheckin.digestion,
    symptoms: asStringArray(latestCheckin.symptoms),
    symptomSeverity: latestCheckin.symptom_severity,
    waterIntake: latestCheckin.water_intake,
    notes: latestCheckin.notes,
  };

  if (requiresProfessionalCare(mappedCheckin)) {
    return {
      tone: "warning" as const,
      title: "오늘은 전문 진료를 우선해 주세요",
      message:
        "체크인에 심한 증상이나 응급 신호가 보여서 식단 조정보다 병원, 약사, 또는 의료진 상담을 먼저 권장합니다.",
    };
  }

  if (
    latestCheckin.condition_score <= 4 ||
    latestCheckin.sleep_quality <= 4
  ) {
    return {
      tone: "warning" as const,
      title: "부담 적은 식사로 강도를 낮춰 보세요",
      message:
        "오늘은 자극적인 간식보다 수분과 부드러운 채소, 단백질 위주로 가볍게 챙기는 편이 좋아 보여요.",
    };
  }

  if (latestCheckin.stress_level >= 7) {
    return {
      tone: "info" as const,
      title: "스트레스 완화를 돕는 식사 리듬을 추천해요",
      message:
        "카페인과 야식을 줄이고 규칙적인 식사와 충분한 수분 섭취를 중심으로 하루 템포를 맞춰 보세요.",
    };
  }

  if (
    latestCheckin.appetite === "low" ||
    latestCheckin.digestion === "bloated" ||
    latestCheckin.digestion === "sensitive" ||
    latestCheckin.digestion === "upset"
  ) {
    return {
      tone: "info" as const,
      title: "소화가 편한 구성이 더 잘 맞겠어요",
      message:
        "죽, 수프, 익힌 채소처럼 부담이 적은 메뉴를 우선하고, 한 번에 많이 먹기보다 나눠 먹는 편이 좋아 보여요.",
    };
  }

  if (latestCheckin.exercised_today && latestCheckin.condition_score >= 7) {
    return {
      tone: "success" as const,
      title: "운동 후 회복까지 챙겨 보세요",
      message:
        "오늘은 단백질과 수분을 조금 더 챙기면 좋아요. 현재 식단에 가벼운 간식이나 과일을 보완해 보세요.",
    };
  }

  return {
    tone: "success" as const,
    title: "현재 리듬을 그대로 유지해도 좋아요",
    message:
      "큰 조정 신호는 없어요. 이번 주 식단을 유지하면서 수분과 식사 시간을 규칙적으로 챙겨 보세요.",
  };
}

export function getTodayCheckin(
  latestCheckin: DailyCheckinRow | null,
  todayDate: string,
) {
  if (!latestCheckin) {
    return null;
  }

  return getSeoulDateString(new Date(latestCheckin.created_at)) === todayDate
    ? latestCheckin
    : null;
}
