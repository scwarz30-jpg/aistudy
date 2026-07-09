# Final Review Fix Report

## Scope handled

- Mark active meal plans stale when profile food preferences or exclusions change.
- Prevent meal-plan generation when the latest check-in requires professional care.
- Centralize Seoul-local date and week-start logic and wire dashboard/recommendation usage to it.
- Fix dashboard unit-test fixtures so TypeScript passes cleanly.
- Remove the stale README deployment note about mojibake.

## Changes made

### 1. Stale meal-plan invalidation

- Updated `src/app/actions/profile.ts` to load the existing profile before save.
- Added focused comparison logic for `favorite_foods`, `avoided_foods`, and `allergies`.
- When those values change, active rows in `meal_plans` are updated to `status: "stale"`.
- Updated `src/app/meal-plan/page.tsx` so stale plans are no longer presented as current.
- Updated `src/app/dashboard/page.tsx` to avoid showing stale plan details as the current plan summary.

### 2. Professional-care meal-plan safety gate

- Updated `src/app/actions/recommendations.ts` to call `requiresProfessionalCare(latestCheckin)` before generation.
- If the latest check-in needs professional care, meal-plan generation stops and returns a warning message instead of inserting a new plan.

### 3. Shared Seoul-local date helper

- Added `src/lib/date/seoul.ts` with:
  - `getSeoulDateString(date)`
  - `getSeoulWeekStartDate(date)`
  - `SEOUL_TIME_ZONE`
- Updated dashboard check-in state and dashboard page to use the shared Seoul-local date helper.
- Updated meal-plan generation to compute week start from the Seoul-local date rather than UTC date boundaries.

### 4. Test and type coverage

- Expanded `tests/unit/profile-action.test.ts` to cover meal-plan staleness invalidation.
- Expanded `tests/unit/recommendations-action.test.ts` to cover the professional-care generation block.
- Fixed `tests/unit/dashboard-page.test.ts` fixture typing and added Seoul week-start regression coverage.
- Added `tests/unit/meal-plan-state.test.ts` to cover stale-vs-current meal-plan selection.

## Verification

All required commands succeeded in `C:\Users\SeongMin\Documents\건강관리앱\.worktrees\health-webapp-implementation`:

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- `npx tsc --noEmit --pretty false`

## Notes

- I kept the status model within the existing `meal_plans.status` field instead of introducing schema changes.
- `src/app/dashboard/page.tsx` was rewired to the tested helper module and normalized to stable English copy while preserving the existing dashboard structure.
