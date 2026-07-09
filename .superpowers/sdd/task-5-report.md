# Task 5 Report: Implement Meal Plan Generation

## Summary

Implemented Task 5 inside `C:\Users\SeongMin\Documents\건강관리앱\.worktrees\health-webapp-implementation`:

- Extended meal plan validation coverage with test-first schema checks.
- Added prompt construction for personalized meal plan generation.
- Added server-only AI generation with deterministic mock fallback when `AI_PROVIDER_API_KEY` is missing.
- Added recommendation server action and weekly meal plan persistence.
- Added meal plan UI and dashboard touchpoint.

## Commands Run

### 1. Red phase for schema validation extension

Command:

```bash
npm run test -- tests/unit/schemas.test.ts
```

Observed output:

```text
FAIL tests/unit/schemas.test.ts > mealPlanSchema > rejects a meal plan containing excluded food names
TypeError: safeParseMealPlan is not a function
```

Notes:

- This was the expected failing state after adding the new excluded-food validation test.

### 2. Green verification after adding schema helper

Command:

```bash
npm run test -- tests/unit/schemas.test.ts
```

Observed output:

```text
Test Files  1 passed (1)
Tests       8 passed (8)
```

### 3. Lint

Command:

```bash
npm run lint
```

Observed output:

```text
> eslint .
```

Exit code: `0`

### 4. Build

First command:

```bash
npm run build
```

Initial output:

```text
Failed to type check.
Type 'Record<string, unknown>' is not assignable to type 'Json'.
```

Fix applied:

- Cast the validated `sourceProfileSnapshot` to `Json` at the `meal_plans` insert boundary.

Rerun command:

```bash
npm run build
```

Observed output after fix:

```text
Compiled successfully
Finished TypeScript
Generating static pages using 5 workers (9/9)
```

Exit code: `0`

### 5. Final required verification rerun

Commands:

```bash
npm run test -- tests/unit/schemas.test.ts
npm run lint
npm run build
```

Observed outputs:

```text
schemas.test.ts: 8 passed
eslint: exit 0
next build: exit 0
```

## Changed Files

- `src/lib/health/schema.ts`
- `tests/unit/schemas.test.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/generate.ts`
- `src/app/actions/recommendations.ts`
- `src/app/meal-plan/RegenerateMealPlanButton.tsx`
- `src/app/meal-plan/page.tsx`
- `src/app/dashboard/page.tsx`

## Implementation Notes

### Validation

- Added `safeParseMealPlan(input, excludedFoods)` to keep structural validation on top of `mealPlanSchema` while also rejecting:
  - missing effective day coverage,
  - excluded food names in generated meal entries.

### Prompt construction

- Added `buildMealPlanPrompt(input)` with:
  - profile summary,
  - exclusions,
  - preferred foods,
  - BMI category,
  - weight goal,
  - the exact safety instruction:
    `Do not diagnose, prescribe, or claim to cure medical conditions.`

### AI generation

- Added `generateStructuredMealPlan(input)` in server-only code.
- If `AI_PROVIDER_API_KEY` is absent, generation returns deterministic mock meal data.
- If the key is present, code requests structured JSON from the provider, parses it, and validates it before returning.
- If provider response or validation fails, the function falls back to the deterministic mock plan.

### Persistence

- Added `generateWeeklyMealPlan(userId)` and `regenerateMealPlan()`.
- Loads current user, profile, and latest daily check-in.
- Builds food constraints and BMI inputs.
- Inserts:
  - `meal_plans`
  - `meal_plan_days`
- Insert payloads include required composite ownership columns:
  - `user_id`
  - `meal_plan_id`

### UI

- Added `/meal-plan` page:
  - seven-day rendering,
  - breakfast/lunch/dinner/snack,
  - explanation text,
  - regenerate button wired to `regenerateMealPlan`.
- Added `/dashboard` page as the meal-plan entry point for the existing onboarding redirect target.

## Self-Review

- Followed test-first for the schema validation extension.
- Kept AI calling logic on the server only.
- Ensured deterministic fallback works without `AI_PROVIDER_API_KEY`.
- Validated generated meal plan data before storage.
- Avoided excluded food names in mock meal output and in the new validation test.

## Concerns

- There are no dedicated automated tests yet for the server action, persistence flow, or UI rendering; current automated coverage for Task 5 is concentrated in schema validation plus lint/build verification.
- The AI provider integration uses an OpenAI-compatible chat-completions request shape; if deployment uses a different provider contract behind `AI_PROVIDER_API_KEY`, that environment may need matching base URL/model settings.
