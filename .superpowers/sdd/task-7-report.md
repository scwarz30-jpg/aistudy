# Task 7 Report

## Scope

Implemented Task 7: guidance builder/page and profile editing page inside the `health-webapp-implementation` worktree.

## Commands Run

1. `npm test -- tests/unit/guidance.test.ts`
   - Result: passed
   - Output summary: `1 passed`

2. `npm test -- tests/unit/profile-action.test.ts`
   - First run failed because `revalidatePath` was not mocked in the unit test environment.
   - Fix applied: mocked `next/cache` in `tests/unit/profile-action.test.ts`.

3. `npm test -- tests/unit/guidance.test.ts tests/unit/profile-action.test.ts`
   - Result: passed
   - Output summary: `2 passed`, `4 tests passed`

4. `npm run lint`
   - Result: passed

5. `npm run build`
   - Result: passed
   - Output summary: Next.js production build completed successfully; `/guidance` and `/profile` were included in the app routes.

## Changed Files

- `src/app/actions/profile.ts`
- `src/app/actions/recommendations.ts`
- `src/app/guidance/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/profile/ProfileEditor.tsx`
- `src/lib/health/guidance.ts`
- `tests/unit/guidance.test.ts`
- `tests/unit/profile-action.test.ts`

## What Changed

- Added `buildGuidance(profile, checkin)` with the required categories:
  - `exercise`
  - `lifestyle`
  - `nutrition`
  - `medicine_info`
- Ensured `medicine_info` content includes exactly:
  - `This is general information, not diagnosis or prescription. Consult a doctor or pharmacist before using medicine.`
- Added `/guidance` page:
  - loads latest profile and latest check-in
  - renders category cards
  - shows a professional-care notice above normal guidance when urgent symptoms are detected
- Added `/profile` page:
  - loads the saved profile
  - renders editable fields
  - submits through `saveProfile`
  - shows a meal-plan regeneration prompt after successful save
- Extended profile save revalidation so dashboard, guidance, meal-plan, and profile pages refresh after edits.
- Extended meal-plan regeneration revalidation to include guidance and profile routes.
- Added focused test coverage for the guidance builder and updated the profile action test for route revalidation.

## Self-Review

- The guidance builder satisfies the required category set and preserves the exact English medicine safety sentence.
- The urgent-symptom notice is rendered separately and above the regular guidance list.
- The profile edit flow reuses the existing server action and keeps the new behavior scoped to Task 7.
- Verification commands requested in the brief completed successfully.

## Concerns

- Existing onboarding/dashboard UI files still contain pre-existing mojibake in some Korean strings. I did not rewrite those unrelated screens during Task 7.
