# 건강 관리 앱

Supabase를 기반으로 회원가입, 온보딩, 일일 건강 체크인, 식단 생성, 대시보드 요약, 가이던스를 제공하는 Next.js 웹 앱입니다.

## 준비 사항

- Node.js 20 이상
- npm 10 이상
- Supabase 프로젝트

## 로컬 설정

1. 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. 예시 환경 변수 파일을 복사합니다.

   ```bash
   cp .env.example .env.local
   ```

3. `.env.local` 값을 채웁니다.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
   AI_PROVIDER_API_KEY=
   ```

   선택 환경 변수:

   ```env
   AI_PROVIDER_BASE_URL=https://api.openai.com/v1/chat/completions
   AI_PROVIDER_MODEL=gpt-4o-mini
   ```

## 환경 변수 주의사항

- `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 브라우저와 서버 클라이언트 모두에 필요합니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용으로만 사용해야 합니다.
- `AI_PROVIDER_API_KEY`는 로컬 개발에서는 선택 사항입니다. 비워 두면 식단 생성이 결정적 목업 플랜으로 동작합니다.
- 비밀 값은 `.env.local`, Vercel 환경 변수, CI 비밀 저장소에만 보관하고 저장소나 `vercel.json`에 커밋하지 마세요.

## Supabase 설정

1. 새 Supabase 프로젝트를 생성합니다.
2. **Project Settings > API**에서 아래 값을 확인해 `.env.local`에 입력합니다.
   - Project URL
   - `anon` public key
   - service role key
3. 회원가입 흐름을 테스트하려면 **Authentication > Providers**에서 이메일 인증을 활성화합니다.
4. 배포 후에는 **Authentication > URL Configuration**에서 실제 배포 URL을 `Site URL`과 `Redirect URLs`에 추가해야 합니다.

## 데이터베이스 마이그레이션

`supabase/migrations/0001_initial_schema.sql`을 아래 방법 중 하나로 적용합니다.

- Supabase CLI 사용:

  ```bash
  supabase db push
  ```

- Supabase SQL Editor 사용:
  마이그레이션 파일 내용을 SQL Editor에 붙여 넣고 대상 프로젝트에 한 번 실행합니다.

마이그레이션은 다음 테이블을 생성합니다.

- `profiles`
- `daily_checkins`
- `meal_plans`
- `meal_plan_days`
- `guidance_items`

또한 각 테이블에 대해 RLS와 사용자 범위 정책을 설정합니다.

## 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`을 엽니다.

## 테스트 및 빌드

- 단위 테스트:

  ```bash
  npm run test
  ```

- 프로덕션 빌드:

  ```bash
  npm run build
  ```

- E2E 테스트:

  ```bash
  npm run test:e2e
  ```

Playwright 설정은 `npm run dev`로 앱을 띄운 뒤 `tests/e2e`의 스펙을 실행합니다.

## Vercel 배포

1. 저장소를 Vercel에 import 합니다.
2. 기본 **Next.js** 프레임워크 프리셋을 그대로 사용합니다.
3. Vercel 프로젝트 설정에 아래 환경 변수를 추가합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - 실시간 AI 식단 생성을 위한 `AI_PROVIDER_API_KEY`
   - 선택: `AI_PROVIDER_BASE_URL`, `AI_PROVIDER_MODEL`
4. 환경 변수 입력 후 다시 배포합니다.
5. Supabase의 **Authentication > URL Configuration**에 배포 URL을 반영합니다.

## 현재 배포 차단 사항

- 이 작업 트리에서는 아직 Vercel 인증 또는 토큰 설정이 되어 있지 않습니다.
- 프로젝트 링크 정보가 없어 `.vercel/project.json` 기준의 연결도 완료되지 않았습니다.
- 따라서 지금은 실제 배포 URL을 제공할 수 없습니다.
- 배포를 진행하려면 Vercel 로그인 또는 `VERCEL_TOKEN` 설정, 그리고 프로젝트 링크 구성이 먼저 필요합니다.
