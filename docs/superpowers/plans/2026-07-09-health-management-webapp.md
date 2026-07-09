# Health Management Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a mobile-first health management web app where users can sign up, create a health profile, generate a personalized weekly meal plan, submit daily health check-ins, and receive safe lifestyle, exercise, nutrition, and general OTC medicine guidance.

**Architecture:** Use a Next.js App Router project with TypeScript, Supabase Auth/database, server-side recommendation services, and Vercel deployment. The recommendation engine separates deterministic safety/constraint logic from AI text generation so food exclusions, profile completeness, and medical safety boundaries are handled before AI output is shown or stored.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Supabase Auth, Supabase Postgres, Vitest, Playwright, Vercel, AI provider API through server-only route handlers.

## Global Constraints

- Web app first; no native iOS or Android app in the first version.
- Authentication uses email and password.
- Meal recommendations use a hybrid rule-based plus AI approach.
- Daily health check-in supports quick input plus optional detailed input.
- Medicine information is limited to general OTC or ingredient education and must not be diagnosis or prescription.
- Allergies and avoided foods are hard constraints for meal suggestions.
- API keys must never be exposed to browser code.
- The UI must be responsive and mobile-browser-first.
- Deploy the app to a public Vercel URL.

---

## File Structure

- Create `package.json`: scripts, dependencies, and project metadata.
- Create `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `.gitignore`, `.env.example`: project configuration.
- Create `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`: root app shell and landing redirect.
- Create `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`: auth screens.
- Create `src/app/onboarding/page.tsx`: profile onboarding form.
- Create `src/app/dashboard/page.tsx`: main signed-in dashboard.
- Create `src/app/meal-plan/page.tsx`: weekly meal plan view and regenerate action.
- Create `src/app/check-in/page.tsx`: quick and detailed daily health check-in.
- Create `src/app/guidance/page.tsx`: lifestyle, exercise, nutrition, and OTC guidance.
- Create `src/app/profile/page.tsx`: profile editing.
- Create `src/components/ui/*`: small reusable controls such as buttons, inputs, cards, badges, and notices.
- Create `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/types.ts`: Supabase clients and typed database shapes.
- Create `src/lib/health/rules.ts`: BMI, goal direction, safety boundaries, and food exclusion logic.
- Create `src/lib/health/schema.ts`: Zod schemas for profiles, check-ins, meal plans, and guidance.
- Create `src/lib/ai/prompts.ts`, `src/lib/ai/generate.ts`: prompt construction, AI calls, and response validation.
- Create `src/app/actions/profile.ts`, `src/app/actions/checkins.ts`, `src/app/actions/recommendations.ts`: server actions for persistence and generation.
- Create `supabase/migrations/0001_initial_schema.sql`: database tables, indexes, and RLS policies.
- Create `tests/unit/health-rules.test.ts`, `tests/unit/schemas.test.ts`: deterministic unit tests.
- Create `tests/e2e/core-flow.spec.ts`: main browser flow test with mocked recommendation output.

---

### Task 1: Scaffold The Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm run test`, and `npm run test:e2e`.
- Produces: a working Next.js shell that later tasks can add routes to.

- [ ] **Step 1: Create the Next.js application files**

Use `npm create next-app@latest . -- --ts --tailwind --eslint --app --src-dir --import-alias "@/*"` from `C:\Users\SeongMin\Documents\건강관리앱`. If the CLI asks to overwrite files, keep existing `docs/` and allow app config files to be created.

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```bash
npm install @supabase/ssr @supabase/supabase-js zod lucide-react
npm install -D vitest @vitejs/plugin-react jsdom playwright @playwright/test
```

Expected: dependencies are added to `package.json` and install completes without audit-blocking errors.

- [ ] **Step 3: Update scripts**

Set `package.json` scripts to:

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

- [ ] **Step 4: Add environment example**

Create `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER_API_KEY=
```

- [ ] **Step 5: Build the blank app**

Run:

```bash
npm run build
```

Expected: `Compiled successfully`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts .gitignore .env.example src
git commit -m "chore: scaffold health webapp"
```

---

### Task 2: Add Supabase Schema And Clients

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `src/lib/supabase/types.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

**Interfaces:**
- Produces: `createBrowserSupabaseClient(): SupabaseClient<Database>`.
- Produces: `createServerSupabaseClient(): Promise<SupabaseClient<Database>>`.
- Produces: database tables `profiles`, `daily_checkins`, `meal_plans`, `meal_plan_days`, and `guidance_items`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0001_initial_schema.sql` with tables from the spec. Include `user_id uuid not null references auth.users(id) on delete cascade` on every user-owned table. Enable RLS and add policies using `auth.uid() = user_id` for select, insert, update, and delete.

- [ ] **Step 2: Create TypeScript database types**

Create `src/lib/supabase/types.ts` with exported `Database` type containing `Tables` entries for `profiles`, `daily_checkins`, `meal_plans`, `meal_plan_days`, and `guidance_items`. Use `Json` for snapshot and array-like JSON fields.

- [ ] **Step 3: Create browser Supabase client**

Create `src/lib/supabase/client.ts`:

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

- [ ] **Step 4: Create server Supabase client**

Create `src/lib/supabase/server.ts` with `cookies()` from `next/headers` and `createServerClient<Database>()`. Return an authenticated server client that reads and writes cookies through the Next.js cookie store.

- [ ] **Step 5: Validate build**

Run:

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add supabase src/lib/supabase
git commit -m "feat: add supabase schema and clients"
```

---

### Task 3: Implement Health Rules And Validation

**Files:**
- Create: `src/lib/health/schema.ts`
- Create: `src/lib/health/rules.ts`
- Create: `tests/unit/health-rules.test.ts`
- Create: `tests/unit/schemas.test.ts`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `profileSchema`, `dailyCheckinSchema`, `mealPlanSchema`, `guidanceItemSchema`.
- Produces: `calculateBmi(heightCm: number, weightKg: number): { value: number; category: "underweight" | "normal" | "overweight" | "obese" }`.
- Produces: `buildFoodConstraints(profile: ProfileInput): { excludedFoods: string[]; preferredFoods: string[] }`.
- Produces: `requiresProfessionalCare(checkin: DailyCheckinInput): boolean`.
- Consumes: database fields defined in Task 2.

- [ ] **Step 1: Write failing health rule tests**

Create tests for BMI categories, allergy exclusion, avoided food exclusion, and severe symptom professional-care detection.

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- tests/unit/health-rules.test.ts
```

Expected: FAIL because `src/lib/health/rules.ts` does not exist.

- [ ] **Step 3: Implement Zod schemas**

Create schemas with required numbers for `heightCm`, `weightKg`, `conditionScore`, `sleepQuality`, `stressLevel`, and enum `weightGoal` values `lose`, `maintain`, `gain`.

- [ ] **Step 4: Implement rule functions**

Implement exact exported functions from the interface. `requiresProfessionalCare` returns true when symptom severity is at least 8 or symptoms include Korean/English urgent terms such as `chest pain`, `difficulty breathing`, `severe bleeding`, `흉통`, `호흡곤란`, or `심한 출혈`.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test -- tests/unit/health-rules.test.ts tests/unit/schemas.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/health tests/unit vitest.config.ts
git commit -m "feat: add health rules and validation"
```

---

### Task 4: Build Authentication And Onboarding

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/TextField.tsx`
- Create: `src/components/ui/Notice.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/onboarding/page.tsx`
- Create: `src/app/actions/profile.ts`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient()` and `createServerSupabaseClient()`.
- Consumes: `profileSchema`.
- Produces: `saveProfile(formData: FormData): Promise<{ ok: true } | { ok: false; message: string }>` server action.

- [ ] **Step 1: Add reusable UI controls**

Create small button, text field, and notice components with stable mobile-friendly sizing and accessible labels.

- [ ] **Step 2: Build signup page**

Implement email/password signup using the browser Supabase client. On success, redirect to `/onboarding`.

- [ ] **Step 3: Build login page**

Implement email/password login using the browser Supabase client. On success, redirect to `/dashboard`.

- [ ] **Step 4: Build profile server action**

Implement `saveProfile` to validate form data, upsert the `profiles` row for the authenticated user, and return a structured success or error result.

- [ ] **Step 5: Build onboarding page**

Create the form for nickname, birth date, height, weight, weight goal, health concerns, current condition, favorite foods, avoided foods, and allergies. Include the health disclaimer notice before submit.

- [ ] **Step 6: Build and test manually**

Run:

```bash
npm run build
```

Expected: build passes. Manual check: `/signup`, `/login`, and `/onboarding` render without runtime errors.

- [ ] **Step 7: Commit**

```bash
git add src/components src/app
git commit -m "feat: add auth and onboarding flow"
```

---

### Task 5: Implement Meal Plan Generation

**Files:**
- Create: `src/lib/ai/prompts.ts`
- Create: `src/lib/ai/generate.ts`
- Create: `src/app/actions/recommendations.ts`
- Create: `src/app/meal-plan/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Test: `tests/unit/schemas.test.ts`

**Interfaces:**
- Consumes: `buildFoodConstraints`, `calculateBmi`, and `mealPlanSchema`.
- Produces: `generateWeeklyMealPlan(userId: string): Promise<{ mealPlanId: string }>` server function.
- Produces: `regenerateMealPlan(): Promise<{ ok: true; mealPlanId: string } | { ok: false; message: string }>` server action.

- [ ] **Step 1: Extend meal plan validation tests**

Add tests that reject meal plans missing a day, missing breakfast/lunch/dinner, or containing excluded food names.

- [ ] **Step 2: Build prompt construction**

Create `buildMealPlanPrompt(input)` in `src/lib/ai/prompts.ts`. It must include profile summary, food exclusions, preferred foods, BMI category, weight goal, and the instruction: "Do not diagnose, prescribe, or claim to cure medical conditions."

- [ ] **Step 3: Implement AI generation wrapper**

Create `generateStructuredMealPlan(input)` in `src/lib/ai/generate.ts`. If `AI_PROVIDER_API_KEY` is missing, return a deterministic mock meal plan suitable for local development. If present, call the AI provider from server code only and validate the parsed JSON against `mealPlanSchema`.

- [ ] **Step 4: Implement recommendation server action**

Load the current user, profile, and latest check-in. Run rule constraints, generate a meal plan, insert `meal_plans`, insert seven `meal_plan_days`, and return the created id.

- [ ] **Step 5: Build meal plan UI**

Render seven days with breakfast, lunch, dinner, snack, and explanation. Add a regenerate button that calls `regenerateMealPlan`.

- [ ] **Step 6: Validate**

Run:

```bash
npm run test -- tests/unit/schemas.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai src/app/actions/recommendations.ts src/app/meal-plan src/app/dashboard tests/unit/schemas.test.ts
git commit -m "feat: generate personalized meal plans"
```

---

### Task 6: Add Daily Check-In And Dashboard

**Files:**
- Create: `src/app/actions/checkins.ts`
- Create: `src/app/check-in/page.tsx`
- Create: `src/app/dashboard/page.tsx`
- Test: `tests/unit/health-rules.test.ts`

**Interfaces:**
- Consumes: `dailyCheckinSchema` and `requiresProfessionalCare`.
- Produces: `saveDailyCheckin(formData: FormData): Promise<{ ok: true } | { ok: false; message: string }>` server action.
- Produces: dashboard data query for latest profile, latest check-in, current meal plan, and today adjustment.

- [ ] **Step 1: Write tests for check-in safety triggers**

Add cases for high severity and urgent symptom terms.

- [ ] **Step 2: Implement check-in server action**

Validate form data and insert into `daily_checkins` for the authenticated user. When professional care is required, store the check-in and return a message that recommends professional care instead of normal diet adjustment.

- [ ] **Step 3: Build check-in page**

Create quick controls for condition score, sleep quality, stress level, exercise status, appetite, digestion, symptom severity, and optional detailed fields for symptoms, water intake, and notes.

- [ ] **Step 4: Build dashboard page**

Show today's check-in status, current weekly meal plan summary, and a daily adjustment notice. If no profile exists, link to `/onboarding`. If no meal plan exists, offer generation.

- [ ] **Step 5: Validate**

Run:

```bash
npm run test -- tests/unit/health-rules.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/checkins.ts src/app/check-in src/app/dashboard tests/unit/health-rules.test.ts
git commit -m "feat: add daily health check-ins"
```

---

### Task 7: Add Guidance And Profile Editing

**Files:**
- Create: `src/app/guidance/page.tsx`
- Create: `src/app/profile/page.tsx`
- Modify: `src/app/actions/profile.ts`
- Modify: `src/app/actions/recommendations.ts`
- Create: `src/lib/health/guidance.ts`

**Interfaces:**
- Consumes: latest profile and check-in.
- Produces: `buildGuidance(profile, checkin): GuidanceItem[]`.
- Produces: editable profile page that reuses `saveProfile`.

- [ ] **Step 1: Implement guidance builder**

Return guidance categories `exercise`, `lifestyle`, `nutrition`, and `medicine_info`. `medicine_info` content must include "This is general information, not diagnosis or prescription. Consult a doctor or pharmacist before using medicine."

- [ ] **Step 2: Build guidance page**

Render guidance cards by category. If urgent symptoms are detected, show professional-care notice above all normal guidance.

- [ ] **Step 3: Build profile page**

Load existing profile, render editable fields, and submit through `saveProfile`. After successful profile update, show a prompt to regenerate the meal plan.

- [ ] **Step 4: Validate**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add src/app/guidance src/app/profile src/lib/health/guidance.ts src/app/actions
git commit -m "feat: add guidance and profile editing"
```

---

### Task 8: Add End-To-End Tests And Deployment Readiness

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/core-flow.spec.ts`
- Create: `README.md`
- Create: `README.ko.md`
- Create: `vercel.json`

**Interfaces:**
- Consumes: all user-facing routes.
- Produces: documented local setup, environment variable setup, Supabase setup, and Vercel deployment instructions.

- [ ] **Step 1: Configure Playwright**

Set `webServer.command` to `npm run dev`, `webServer.url` to `http://127.0.0.1:3000`, and `testDir` to `tests/e2e`.

- [ ] **Step 2: Write core-flow test**

Mock Supabase/AI where needed or use test env variables. Test that signup page renders, onboarding form renders, dashboard route handles missing auth by redirecting or showing login, and public health disclaimer copy is visible where required.

- [ ] **Step 3: Write README files**

Document setup in English and Korean: install dependencies, copy `.env.example` to `.env.local`, configure Supabase, run migration, run dev server, run tests, and deploy with Vercel.

- [ ] **Step 4: Add Vercel config**

Create `vercel.json` with framework default behavior and no secrets committed.

- [ ] **Step 5: Run full verification**

Run:

```bash
npm run test
npm run build
npm run test:e2e
```

Expected: unit tests pass, production build succeeds, and Playwright tests pass.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e README.md README.ko.md vercel.json
git commit -m "test: add e2e coverage and deployment docs"
```

---

## Plan Self-Review

- Spec coverage: authentication, onboarding, daily check-ins, meal generation, guidance, safety limits, Supabase persistence, tests, and Vercel deployment are covered.
- Placeholder scan: no `TBD`, `TODO`, or intentionally vague implementation steps remain.
- Type consistency: exported function names are consistent across tasks: `createBrowserSupabaseClient`, `createServerSupabaseClient`, `calculateBmi`, `buildFoodConstraints`, `requiresProfessionalCare`, `saveProfile`, `saveDailyCheckin`, `generateWeeklyMealPlan`, `regenerateMealPlan`, and `buildGuidance`.
- Scope check: the plan is large but still a single first-version webapp because each task produces a working slice of the same product rather than independent products.
