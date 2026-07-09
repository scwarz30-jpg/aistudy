# 건강관리 웹앱 구현 계획

> **에이전트 작업자용:** 필수 하위 스킬: 이 계획을 작업 단위로 구현할 때는 `superpowers:subagent-driven-development` 권장, 또는 `superpowers:executing-plans`를 사용한다. 단계 추적은 체크박스(`- [ ]`) 문법을 사용한다.

**목표:** 사용자가 가입하고 건강 프로필을 만든 뒤 개인화된 일주일 식단표를 받고, 매일 몸상태를 기록하며, 안전한 생활습관/운동/영양/일반의약품 정보를 볼 수 있는 모바일 우선 건강관리 웹앱을 만든다.

**아키텍처:** TypeScript 기반 Next.js App Router 프로젝트, Supabase 인증/데이터베이스, 서버 측 추천 서비스, Vercel 배포를 사용한다. 추천 엔진은 결정적인 안전/제약 로직과 AI 텍스트 생성을 분리해서, 제외 음식과 프로필 완성도, 의료 안전 경계를 AI 결과 표시/저장 전에 처리한다.

**기술 스택:** Next.js, React, TypeScript, Tailwind CSS, Supabase Auth, Supabase Postgres, Vitest, Playwright, Vercel, 서버 전용 AI provider API.

## 전체 제약

- 첫 버전은 웹앱이며 네이티브 iOS/Android 앱은 만들지 않는다.
- 인증은 이메일과 비밀번호를 사용한다.
- 식단 추천은 규칙 기반과 AI를 섞은 방식으로 만든다.
- 매일 몸상태 체크인은 간단 입력과 선택적 상세 입력을 모두 지원한다.
- 약 정보는 일반의약품 또는 성분 교육 수준으로 제한하고 진단/처방처럼 표현하지 않는다.
- 알레르기와 피하고 싶은 음식은 식단 추천의 강한 제약이다.
- API 키는 브라우저 코드에 노출하지 않는다.
- UI는 모바일 브라우저 우선 반응형으로 만든다.
- 앱은 공개 Vercel URL로 배포한다.

---

## 파일 구조

- `package.json`: 스크립트, 의존성, 프로젝트 메타데이터
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `.gitignore`, `.env.example`: 프로젝트 설정
- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`: 루트 앱 셸과 기본 진입
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`: 인증 화면
- `src/app/onboarding/page.tsx`: 프로필 온보딩 폼
- `src/app/dashboard/page.tsx`: 로그인 후 메인 대시보드
- `src/app/meal-plan/page.tsx`: 일주일 식단표 화면과 재생성 액션
- `src/app/check-in/page.tsx`: 간단/상세 매일 체크인
- `src/app/guidance/page.tsx`: 생활습관, 운동, 영양, 일반의약품 정보
- `src/app/profile/page.tsx`: 프로필 수정
- `src/components/ui/*`: 버튼, 입력, 카드, 배지, 안내문 같은 작은 재사용 컴포넌트
- `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/types.ts`: Supabase 클라이언트와 타입
- `src/lib/health/rules.ts`: BMI, 목표 방향, 안전 경계, 음식 제외 로직
- `src/lib/health/schema.ts`: 프로필, 체크인, 식단, 건강 정보 Zod 스키마
- `src/lib/ai/prompts.ts`, `src/lib/ai/generate.ts`: 프롬프트 구성, AI 호출, 응답 검증
- `src/app/actions/profile.ts`, `src/app/actions/checkins.ts`, `src/app/actions/recommendations.ts`: 저장과 생성용 서버 액션
- `supabase/migrations/0001_initial_schema.sql`: DB 테이블, 인덱스, RLS 정책
- `tests/unit/health-rules.test.ts`, `tests/unit/schemas.test.ts`: 결정적 단위 테스트
- `tests/e2e/core-flow.spec.ts`: 주요 브라우저 흐름 테스트

---

### 작업 1: Next.js 프로젝트 뼈대 만들기

**파일:**
- 생성: `package.json`
- 생성: `next.config.ts`
- 생성: `tsconfig.json`
- 생성: `postcss.config.mjs`
- 생성: `tailwind.config.ts`
- 생성: `.gitignore`
- 생성: `.env.example`
- 생성: `src/app/layout.tsx`
- 생성: `src/app/globals.css`
- 생성: `src/app/page.tsx`

**인터페이스:**
- 제공: `npm run dev`, `npm run build`, `npm run test`, `npm run test:e2e`
- 제공: 이후 작업이 라우트를 추가할 수 있는 동작하는 Next.js 셸

- [ ] **1단계: Next.js 앱 파일 생성**

`C:\Users\SeongMin\Documents\건강관리앱`에서 실행한다.

```bash
npm create next-app@latest . -- --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

CLI가 파일 덮어쓰기를 묻는다면 기존 `docs/`는 유지하고 앱 설정 파일은 생성한다.

- [ ] **2단계: 런타임/테스트 의존성 설치**

```bash
npm install @supabase/ssr @supabase/supabase-js zod lucide-react
npm install -D vitest @vitejs/plugin-react jsdom playwright @playwright/test
```

예상 결과: 의존성이 `package.json`에 추가되고 설치가 완료된다.

- [ ] **3단계: 스크립트 수정**

`package.json`의 scripts를 다음처럼 맞춘다.

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

- [ ] **4단계: 환경 변수 예시 추가**

`.env.example`을 만든다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER_API_KEY=
```

- [ ] **5단계: 빈 앱 빌드 확인**

```bash
npm run build
```

예상 결과: `Compiled successfully`.

- [ ] **6단계: 커밋**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts .gitignore .env.example src
git commit -m "chore: scaffold health webapp"
```

---

### 작업 2: Supabase 스키마와 클라이언트 추가

**파일:**
- 생성: `supabase/migrations/0001_initial_schema.sql`
- 생성: `src/lib/supabase/types.ts`
- 생성: `src/lib/supabase/client.ts`
- 생성: `src/lib/supabase/server.ts`

**인터페이스:**
- 제공: `createBrowserSupabaseClient(): SupabaseClient<Database>`
- 제공: `createServerSupabaseClient(): Promise<SupabaseClient<Database>>`
- 제공: DB 테이블 `profiles`, `daily_checkins`, `meal_plans`, `meal_plan_days`, `guidance_items`

- [ ] **1단계: 마이그레이션 작성**

스펙의 테이블을 `supabase/migrations/0001_initial_schema.sql`에 작성한다. 모든 사용자 소유 테이블에는 `user_id uuid not null references auth.users(id) on delete cascade`를 포함한다. RLS를 활성화하고 `auth.uid() = user_id` 기반 select, insert, update, delete 정책을 추가한다.

- [ ] **2단계: TypeScript DB 타입 생성**

`src/lib/supabase/types.ts`에 `Database` 타입을 만들고 `profiles`, `daily_checkins`, `meal_plans`, `meal_plan_days`, `guidance_items` 테이블 타입을 포함한다. 스냅샷과 JSON 배열 성격 필드는 `Json` 타입을 사용한다.

- [ ] **3단계: 브라우저 Supabase 클라이언트 생성**

`src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **4단계: 서버 Supabase 클라이언트 생성**

`src/lib/supabase/server.ts`에서 `next/headers`의 `cookies()`와 `createServerClient<Database>()`를 사용한다. Next.js cookie store를 통해 쿠키를 읽고 쓰는 인증 서버 클라이언트를 반환한다.

- [ ] **5단계: 빌드 검증**

```bash
npm run build
```

예상 결과: TypeScript 오류 없음.

- [ ] **6단계: 커밋**

```bash
git add supabase src/lib/supabase
git commit -m "feat: add supabase schema and clients"
```

---

### 작업 3: 건강 규칙과 검증 구현

**파일:**
- 생성: `src/lib/health/schema.ts`
- 생성: `src/lib/health/rules.ts`
- 생성: `tests/unit/health-rules.test.ts`
- 생성: `tests/unit/schemas.test.ts`
- 생성: `vitest.config.ts`

**인터페이스:**
- 제공: `profileSchema`, `dailyCheckinSchema`, `mealPlanSchema`, `guidanceItemSchema`
- 제공: `calculateBmi(heightCm: number, weightKg: number): { value: number; category: "underweight" | "normal" | "overweight" | "obese" }`
- 제공: `buildFoodConstraints(profile: ProfileInput): { excludedFoods: string[]; preferredFoods: string[] }`
- 제공: `requiresProfessionalCare(checkin: DailyCheckinInput): boolean`
- 사용: 작업 2의 데이터베이스 필드

- [ ] **1단계: 실패하는 건강 규칙 테스트 작성**

BMI 범주, 알레르기 제외, 피하고 싶은 음식 제외, 심각 증상 전문 진료 감지를 테스트한다.

- [ ] **2단계: 테스트 실패 확인**

```bash
npm run test -- tests/unit/health-rules.test.ts
```

예상 결과: `src/lib/health/rules.ts`가 없어 실패한다.

- [ ] **3단계: Zod 스키마 구현**

`heightCm`, `weightKg`, `conditionScore`, `sleepQuality`, `stressLevel`은 필수 숫자로 두고, `weightGoal` enum 값은 `lose`, `maintain`, `gain`으로 둔다.

- [ ] **4단계: 규칙 함수 구현**

인터페이스에 정의한 export 함수를 구현한다. `requiresProfessionalCare`는 증상 심각도가 8 이상이거나 증상에 `chest pain`, `difficulty breathing`, `severe bleeding`, `흉통`, `호흡곤란`, `심한 출혈`이 포함되면 true를 반환한다.

- [ ] **5단계: 테스트 실행**

```bash
npm run test -- tests/unit/health-rules.test.ts tests/unit/schemas.test.ts
```

예상 결과: PASS.

- [ ] **6단계: 커밋**

```bash
git add src/lib/health tests/unit vitest.config.ts
git commit -m "feat: add health rules and validation"
```

---

### 작업 4: 인증과 온보딩 구현

**파일:**
- 생성: `src/components/ui/Button.tsx`
- 생성: `src/components/ui/TextField.tsx`
- 생성: `src/components/ui/Notice.tsx`
- 생성: `src/app/(auth)/login/page.tsx`
- 생성: `src/app/(auth)/signup/page.tsx`
- 생성: `src/app/onboarding/page.tsx`
- 생성: `src/app/actions/profile.ts`

**인터페이스:**
- 사용: `createBrowserSupabaseClient()`, `createServerSupabaseClient()`
- 사용: `profileSchema`
- 제공: `saveProfile(formData: FormData): Promise<{ ok: true } | { ok: false; message: string }>` 서버 액션

- [ ] **1단계: 재사용 UI 컨트롤 추가**

모바일에서 안정적인 크기와 접근 가능한 라벨을 가진 버튼, 텍스트 필드, 안내문 컴포넌트를 만든다.

- [ ] **2단계: 회원가입 화면 구현**

브라우저 Supabase 클라이언트로 이메일/비밀번호 회원가입을 구현한다. 성공하면 `/onboarding`으로 이동한다.

- [ ] **3단계: 로그인 화면 구현**

브라우저 Supabase 클라이언트로 이메일/비밀번호 로그인을 구현한다. 성공하면 `/dashboard`로 이동한다.

- [ ] **4단계: 프로필 서버 액션 구현**

폼 데이터를 검증하고 인증된 사용자 기준으로 `profiles` 행을 upsert한다. 성공/오류 결과를 구조화해서 반환한다.

- [ ] **5단계: 온보딩 화면 구현**

닉네임, 생년월일, 키, 몸무게, 체중 목표, 건강 고민, 현재 몸상태, 좋아하는 음식, 피하고 싶은 음식, 알레르기 입력 폼을 만든다. 제출 전 건강 정보 안내문을 포함한다.

- [ ] **6단계: 빌드와 수동 확인**

```bash
npm run build
```

예상 결과: 빌드 통과. 수동 확인: `/signup`, `/login`, `/onboarding`이 런타임 오류 없이 렌더링된다.

- [ ] **7단계: 커밋**

```bash
git add src/components src/app
git commit -m "feat: add auth and onboarding flow"
```

---

### 작업 5: 식단표 생성 구현

**파일:**
- 생성: `src/lib/ai/prompts.ts`
- 생성: `src/lib/ai/generate.ts`
- 생성: `src/app/actions/recommendations.ts`
- 생성: `src/app/meal-plan/page.tsx`
- 수정: `src/app/dashboard/page.tsx`
- 테스트: `tests/unit/schemas.test.ts`

**인터페이스:**
- 사용: `buildFoodConstraints`, `calculateBmi`, `mealPlanSchema`
- 제공: `generateWeeklyMealPlan(userId: string): Promise<{ mealPlanId: string }>`
- 제공: `regenerateMealPlan(): Promise<{ ok: true; mealPlanId: string } | { ok: false; message: string }>`

- [ ] **1단계: 식단표 검증 테스트 확장**

하루가 빠진 식단, 아침/점심/저녁이 빠진 식단, 제외 음식 이름이 포함된 식단을 거부하는 테스트를 추가한다.

- [ ] **2단계: 프롬프트 구성 구현**

`src/lib/ai/prompts.ts`에 `buildMealPlanPrompt(input)`을 만든다. 프로필 요약, 제외 음식, 선호 음식, BMI 범주, 체중 목표, `"Do not diagnose, prescribe, or claim to cure medical conditions."` 문장을 포함한다.

- [ ] **3단계: AI 생성 래퍼 구현**

`src/lib/ai/generate.ts`에 `generateStructuredMealPlan(input)`을 만든다. `AI_PROVIDER_API_KEY`가 없으면 로컬 개발용 결정적 mock 식단을 반환한다. 키가 있으면 서버 코드에서만 AI provider를 호출하고 JSON 파싱 결과를 `mealPlanSchema`로 검증한다.

- [ ] **4단계: 추천 서버 액션 구현**

현재 사용자, 프로필, 최신 체크인을 불러온다. 규칙 제약을 실행하고 식단을 생성한 뒤 `meal_plans`와 7개의 `meal_plan_days`를 저장하고 생성 id를 반환한다.

- [ ] **5단계: 식단표 UI 구현**

7일치 아침, 점심, 저녁, 간식, 설명을 렌더링한다. `regenerateMealPlan`을 호출하는 재생성 버튼을 추가한다.

- [ ] **6단계: 검증**

```bash
npm run test -- tests/unit/schemas.test.ts
npm run build
```

예상 결과: 테스트와 빌드 통과.

- [ ] **7단계: 커밋**

```bash
git add src/lib/ai src/app/actions/recommendations.ts src/app/meal-plan src/app/dashboard tests/unit/schemas.test.ts
git commit -m "feat: generate personalized meal plans"
```

---

### 작업 6: 매일 체크인과 대시보드 추가

**파일:**
- 생성: `src/app/actions/checkins.ts`
- 생성: `src/app/check-in/page.tsx`
- 생성: `src/app/dashboard/page.tsx`
- 테스트: `tests/unit/health-rules.test.ts`

**인터페이스:**
- 사용: `dailyCheckinSchema`, `requiresProfessionalCare`
- 제공: `saveDailyCheckin(formData: FormData): Promise<{ ok: true } | { ok: false; message: string }>` 서버 액션
- 제공: 최신 프로필, 최신 체크인, 현재 식단표, 오늘의 조정 추천을 조회하는 대시보드 데이터 흐름

- [ ] **1단계: 체크인 안전 트리거 테스트 작성**

높은 증상 심각도와 긴급 증상 단어 케이스를 추가한다.

- [ ] **2단계: 체크인 서버 액션 구현**

폼 데이터를 검증하고 인증된 사용자의 `daily_checkins`에 저장한다. 전문 진료가 필요한 경우에도 체크인은 저장하되 일반 식단 조정보다 전문 진료 안내 메시지를 반환한다.

- [ ] **3단계: 체크인 화면 구현**

컨디션 점수, 수면 품질, 스트레스, 운동 여부, 식욕, 소화, 증상 심각도를 빠르게 입력하게 하고, 증상/물 섭취량/메모 상세 필드를 선택적으로 제공한다.

- [ ] **4단계: 대시보드 구현**

오늘 체크인 상태, 현재 식단표 요약, 오늘의 조정 안내를 보여준다. 프로필이 없으면 `/onboarding`으로 안내하고 식단표가 없으면 생성 버튼을 보여준다.

- [ ] **5단계: 검증**

```bash
npm run test -- tests/unit/health-rules.test.ts
npm run build
```

예상 결과: 테스트와 빌드 통과.

- [ ] **6단계: 커밋**

```bash
git add src/app/actions/checkins.ts src/app/check-in src/app/dashboard tests/unit/health-rules.test.ts
git commit -m "feat: add daily health check-ins"
```

---

### 작업 7: 건강 정보와 프로필 수정 추가

**파일:**
- 생성: `src/app/guidance/page.tsx`
- 생성: `src/app/profile/page.tsx`
- 수정: `src/app/actions/profile.ts`
- 수정: `src/app/actions/recommendations.ts`
- 생성: `src/lib/health/guidance.ts`

**인터페이스:**
- 사용: 최신 프로필과 체크인
- 제공: `buildGuidance(profile, checkin): GuidanceItem[]`
- 제공: `saveProfile`을 재사용하는 프로필 수정 화면

- [ ] **1단계: 건강 정보 빌더 구현**

`exercise`, `lifestyle`, `nutrition`, `medicine_info` 카테고리를 반환한다. `medicine_info` 내용에는 `"This is general information, not diagnosis or prescription. Consult a doctor or pharmacist before using medicine."` 문장을 포함한다.

- [ ] **2단계: 건강 정보 화면 구현**

카테고리별 건강 정보 카드를 렌더링한다. 긴급 증상이 감지되면 일반 정보보다 위에 전문 진료 안내문을 보여준다.

- [ ] **3단계: 프로필 수정 화면 구현**

기존 프로필을 불러와 수정 가능한 필드를 보여주고 `saveProfile`로 제출한다. 성공하면 식단 재생성을 권한다.

- [ ] **4단계: 검증**

```bash
npm run build
```

예상 결과: 빌드 통과.

- [ ] **5단계: 커밋**

```bash
git add src/app/guidance src/app/profile src/lib/health/guidance.ts src/app/actions
git commit -m "feat: add guidance and profile editing"
```

---

### 작업 8: E2E 테스트와 배포 준비

**파일:**
- 생성: `playwright.config.ts`
- 생성: `tests/e2e/core-flow.spec.ts`
- 생성: `README.md`
- 생성: `README.ko.md`
- 생성: `vercel.json`

**인터페이스:**
- 사용: 모든 사용자-facing 라우트
- 제공: 로컬 설정, 환경 변수 설정, Supabase 설정, Vercel 배포 안내

- [ ] **1단계: Playwright 설정**

`webServer.command`는 `npm run dev`, `webServer.url`은 `http://127.0.0.1:3000`, `testDir`은 `tests/e2e`로 설정한다.

- [ ] **2단계: 핵심 흐름 테스트 작성**

필요하면 Supabase/AI를 mock하거나 테스트 환경 변수를 사용한다. 회원가입 화면 렌더링, 온보딩 폼 렌더링, 대시보드의 미인증 처리, 필수 건강 안내문 표시를 테스트한다.

- [ ] **3단계: README 작성**

영문/한글 README에 의존성 설치, `.env.example`을 `.env.local`로 복사, Supabase 설정, 마이그레이션 실행, 개발 서버 실행, 테스트 실행, Vercel 배포를 문서화한다.

- [ ] **4단계: Vercel 설정 추가**

비밀값을 커밋하지 않는 `vercel.json`을 만든다.

- [ ] **5단계: 전체 검증**

```bash
npm run test
npm run build
npm run test:e2e
```

예상 결과: 단위 테스트 통과, 프로덕션 빌드 성공, Playwright 테스트 통과.

- [ ] **6단계: 커밋**

```bash
git add playwright.config.ts tests/e2e README.md README.ko.md vercel.json
git commit -m "test: add e2e coverage and deployment docs"
```

---

## 계획 자체 검토

- 스펙 커버리지: 인증, 온보딩, 매일 체크인, 식단 생성, 건강 정보, 안전 제한, Supabase 저장, 테스트, Vercel 배포가 포함되어 있다.
- 플레이스홀더 검사: `TBD`, `TODO`, 의도적으로 비어 있는 구현 단계는 없다.
- 타입 일관성: `createBrowserSupabaseClient`, `createServerSupabaseClient`, `calculateBmi`, `buildFoodConstraints`, `requiresProfessionalCare`, `saveProfile`, `saveDailyCheckin`, `generateWeeklyMealPlan`, `regenerateMealPlan`, `buildGuidance` 이름이 작업 간 일관된다.
- 범위 확인: 계획은 크지만 첫 버전 웹앱이라는 하나의 제품 흐름 안에서 동작하는 작업 단위로 나뉘어 있다.
