import Link from "next/link";

const primaryActions = [
  {
    href: "/signup",
    label: "회원가입",
    description: "이메일과 비밀번호로 계정을 만들고 건강 프로필을 저장합니다.",
  },
  {
    href: "/login",
    label: "로그인",
    description: "이미 만든 계정으로 들어가 식단과 체크인 기록을 이어 봅니다.",
  },
  {
    href: "/onboarding",
    label: "프로필 입력",
    description: "키, 몸무게, 목표, 건강 고민, 선호 음식과 제외 음식을 입력합니다.",
  },
];

const featureLinks = [
  {
    href: "/dashboard",
    title: "대시보드",
    body: "오늘 체크인 상태와 현재 식단표, 조정 안내를 한 곳에서 봅니다.",
  },
  {
    href: "/meal-plan",
    title: "일주일 식단표",
    body: "프로필과 음식 취향을 반영한 아침, 점심, 저녁, 간식 추천을 확인합니다.",
  },
  {
    href: "/check-in",
    title: "매일 몸상태 체크인",
    body: "컨디션, 수면, 스트레스, 증상, 물 섭취량과 메모를 기록합니다.",
  },
  {
    href: "/guidance",
    title: "건강 정보",
    body: "운동, 생활습관, 영양, 일반의약품 정보를 안전 안내와 함께 확인합니다.",
  },
  {
    href: "/profile",
    title: "프로필 수정",
    body: "목표와 음식 취향이 바뀌면 프로필을 수정하고 식단을 다시 생성합니다.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase text-sky-600">
              건강 관리 앱
            </p>
            <h1 className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
              내 몸상태에 맞춰 식단과 건강 루틴을 관리하세요
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--muted)]">
              나이, 생년월일, 키, 몸무게, 목표, 건강 고민, 좋아하는 음식과
              피하고 싶은 음식을 바탕으로 일주일 식단표를 만들고, 매일
              체크인으로 현재 몸상태에 맞는 조정 안내를 받을 수 있습니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {primaryActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 transition hover:border-sky-400 hover:bg-white"
              >
                <span className="text-base font-semibold text-[var(--foreground)]">
                  {action.label}
                </span>
                <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                  {action.description}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureLinks.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:border-sky-400 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {feature.body}
              </p>
            </Link>
          ))}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          이 앱의 식단, 운동, 일반의약품 정보는 건강 관리를 돕는 일반 정보이며
          진단이나 처방이 아닙니다. 심한 증상이나 지속되는 불편감이 있으면
          의사 또는 약사와 상담하세요.
        </div>
      </section>
    </main>
  );
}
