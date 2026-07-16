import Link from "next/link";

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
    <main>
      <section className="flex min-h-[calc(100svh-140px)] flex-col justify-between gap-8">
        <div className="flex justify-between text-xs font-extrabold text-[var(--muted)]">
          <span>Daily Care</span>
          <span>Seoul</span>
        </div>

        <div className="space-y-8">
          <div className="relative mx-auto h-64 w-full max-w-[300px]">
            <div className="absolute left-4 top-8 h-28 w-44 -rotate-6 rounded-3xl border-2 border-[var(--border)] bg-[#fffdf7] shadow-[8px_8px_0_#f3b7a7]" />
            <div className="absolute right-3 top-3 h-32 w-24 rotate-6 rounded-2xl border-2 border-[var(--border)] bg-[var(--accent)] p-3">
              <div className="h-3 w-12 rounded-full bg-[var(--foreground)]" />
              <div className="mt-4 space-y-2">
                <div className="h-2 rounded-full bg-white/80" />
                <div className="h-2 w-3/4 rounded-full bg-white/80" />
                <div className="h-2 w-1/2 rounded-full bg-white/80" />
              </div>
            </div>
            <div className="absolute bottom-7 left-7 h-28 w-48 rounded-3xl border-2 border-[var(--border)] bg-[#f6eadc] p-4 shadow-[8px_8px_0_#15130f]">
              <div className="text-sm font-black">Today</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["아침", "점심", "저녁"].map((meal) => (
                  <div
                    key={meal}
                    className="rounded-2xl border border-[var(--border)] bg-[#fffdf7] px-2 py-3 text-center text-[10px] font-black"
                  >
                    {meal}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute bottom-2 right-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[#fff2c8] text-2xl font-black">
              7
            </div>
          </div>

          <div className="space-y-4 text-center">
            <h1 className="text-[2.45rem] font-black leading-[1.08] text-[var(--foreground)]">
              내 몸상태에 맞춘
              <br />
              건강 루틴
            </h1>
            <p className="mx-auto max-w-[290px] text-sm font-medium leading-6 text-[var(--muted)]">
              매일 체크인하고 오늘 이후 식단과 관리 루틴을 몸상태에 맞게 조정하세요.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/signup"
            className="inline-flex min-h-14 w-full items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--accent)] px-5 text-sm font-black text-[var(--foreground)] shadow-[0_3px_0_var(--border)]"
          >
            시작하기
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-14 w-full items-center justify-center rounded-full border-2 border-[var(--border)] bg-[#fffdf7] px-5 text-sm font-black text-[var(--foreground)]"
          >
            로그인
          </Link>
        </div>

        <div className="grid gap-3">
          {featureLinks.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="rounded-3xl border border-[rgba(29,26,21,0.18)] bg-[#fffdf7] p-4 transition hover:border-[var(--border)]"
            >
              <h2 className="text-base font-black text-[var(--foreground)]">
                {feature.title}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {feature.body}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
