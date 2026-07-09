# Health Management Web App Design

## Summary

Build a web app that helps users manage diet and daily health condition. The first version will use a Next.js web app, Supabase for authentication and persistent data, a hybrid rule-based plus AI recommendation engine for meal plans, and Vercel for deployment.

The app will support email and password signup, onboarding profile creation, weekly meal plan generation, daily health check-ins, meal plan adjustments based on current condition, and health guidance that includes exercise, lifestyle tips, and limited over-the-counter medicine information with clear safety disclaimers.

## Goals

- Let users create an account with email and password.
- Collect profile data: age, birth date, height, weight, weight goal, health concerns, current body condition, preferred foods, and avoided foods.
- Generate a personalized one-week meal plan.
- Let users record daily body condition through a fast check-in and optional detailed notes.
- Update or adjust meal recommendations based on recent check-ins.
- Provide condition-improvement guidance such as exercise, lifestyle changes, nutrition tips, and general over-the-counter medicine information.
- Deploy the app so other people can access it through a public web URL.

## Non-Goals For The First Version

- Native iOS or Android app distribution.
- Medical diagnosis, prescription, or emergency care advice.
- Direct pharmacy purchase flows.
- Wearable device integration.
- Automated calorie tracking from photos.
- Admin dashboard for managing all users.

## Product Flow

### 1. Authentication

Users sign up and log in with email and password. Supabase Auth will handle account creation, login sessions, password reset, and secure user identity.

### 2. Onboarding

After the first login, users complete an onboarding form:

- Name or nickname
- Birth date
- Age, derived from birth date where possible
- Height
- Weight
- Weight goal: lose, maintain, or gain
- Health concerns, such as fatigue, digestion, sleep, muscle gain, blood sugar management, or other free-text concerns
- Current body condition
- Favorite foods
- Foods to avoid, allergies, or dietary restrictions

The app should treat allergies and major restrictions as hard constraints for meal suggestions.

### 3. Dashboard

The dashboard is the main screen after login. It shows:

- Today's check-in status
- Current weekly meal plan
- Recommended adjustment for today, if the latest check-in suggests a change
- Quick actions for entering body condition, regenerating the meal plan, and viewing guidance

### 4. Weekly Meal Plan

The meal plan page shows seven days of meals. Each day includes breakfast, lunch, dinner, and optional snack suggestions. Each meal includes a short reason explaining why it fits the user's profile and goal.

Users can regenerate the weekly plan when their profile changes or when daily check-ins show a meaningful condition change.

### 5. Daily Health Check-In

The daily check-in supports two levels:

- Quick check-in: condition score, sleep quality, stress level, exercise status, appetite, digestion, and symptom severity.
- Detailed input: notes, specific symptoms, water intake, meal feedback, pain or discomfort location, and free-form comments.

The quick path should be lightweight enough to complete every day.

### 6. Guidance

The guidance section provides condition-improvement information based on the user's profile and latest check-ins:

- Exercise suggestions
- Stretching and recovery suggestions
- Sleep and hydration tips
- Nutrition guidance
- General over-the-counter medicine or ingredient information where appropriate

Medicine guidance must not be phrased as diagnosis or prescription. It should include clear notices that users should consult a doctor or pharmacist, especially for severe symptoms, pregnancy, chronic disease, children, allergies, drug interactions, or symptoms that persist.

## Recommendation Design

The app will use a hybrid recommendation approach.

### Rule-Based Layer

The rule-based layer calculates or constrains:

- BMI category from height and weight
- Weight direction from the user's goal
- Basic calorie direction, without presenting it as exact medical advice
- Food exclusions from allergies, avoided foods, and restrictions
- Meal balance across protein, vegetables, carbohydrates, and hydration
- Safety boundaries for symptoms that require professional care

This layer creates a structured recommendation request for the AI layer.

### AI Layer

The AI layer generates:

- Meal names and descriptions
- Seven-day variety
- Explanations for why meals fit the user
- Alternative meals when the user dislikes a suggestion
- Friendly summaries of exercise and lifestyle guidance

The AI prompt must include safety instructions, excluded foods, and a requirement to avoid medical diagnosis or prescription.

### Plan Refresh Logic

The app should refresh or adjust the meal plan when:

- The user completes onboarding for the first time.
- The user updates profile, goal, favorite foods, avoided foods, or health concerns.
- The latest daily check-in differs meaningfully from recent baseline.
- The user manually asks to regenerate.

For minor daily changes, the app may show a "today's adjustment" instead of replacing the whole weekly plan.

## Data Model

### users

Managed by Supabase Auth.

### profiles

- id
- user_id
- nickname
- birth_date
- height_cm
- weight_kg
- weight_goal
- health_concerns
- current_condition
- favorite_foods
- avoided_foods
- allergies
- created_at
- updated_at

### daily_checkins

- id
- user_id
- condition_score
- sleep_quality
- stress_level
- exercised_today
- appetite
- digestion
- symptoms
- symptom_severity
- water_intake
- notes
- created_at

### meal_plans

- id
- user_id
- week_start_date
- source_profile_snapshot
- source_checkin_id
- status
- created_at
- updated_at

### meal_plan_days

- id
- meal_plan_id
- day_index
- date
- breakfast
- lunch
- dinner
- snack
- explanation

### guidance_items

- id
- user_id
- source_checkin_id
- category
- title
- content
- safety_notice
- created_at

## Architecture

### Frontend

Use Next.js App Router with TypeScript. Pages should include:

- Auth pages
- Onboarding
- Dashboard
- Meal plan
- Daily check-in
- Guidance
- Profile settings

The UI should be responsive and usable on mobile browsers first, while still working well on desktop.

### Backend

Use Next.js server actions or route handlers for:

- Saving onboarding data
- Saving daily check-ins
- Generating meal plans
- Generating guidance
- Reading current dashboard data

Supabase handles authentication and database storage. Row Level Security should ensure each user can only access their own data.

### AI Integration

The AI integration should live behind server-side code. API keys must never be exposed to the browser.

The generation pipeline:

1. Load user profile and latest check-ins.
2. Run rule-based health and diet constraints.
3. Build a structured AI request.
4. Validate the AI response shape.
5. Store the generated meal plan or guidance.
6. Show the result to the user.

## Safety And Compliance

- The app must show a health disclaimer during onboarding and near medicine-related guidance.
- The app must avoid diagnosis, prescription, or claims that a meal, exercise, or medicine will cure a condition.
- Severe or urgent symptoms should trigger professional-care guidance instead of normal recommendations.
- Allergy and avoided-food constraints should be treated as high priority.
- Medicine information should focus on general ingredient or category education and should recommend consulting a doctor or pharmacist.

## Error Handling

- If AI generation fails, show a friendly retry state and keep the previous meal plan if one exists.
- If profile data is incomplete, guide the user back to onboarding or settings.
- If Supabase session expires, redirect to login.
- If generated output fails validation, ask the user to regenerate rather than storing unsafe or malformed data.

## Testing

Initial tests should cover:

- Rule-based BMI and goal direction logic.
- Food exclusion handling.
- Daily check-in save and retrieval.
- Meal plan generation response validation.
- Row Level Security assumptions through integration checks where possible.
- Main user flows: signup, onboarding, check-in, meal plan view, and regeneration.

## Deployment

Deploy the web app to Vercel. Supabase will host authentication and database. Required environment variables include:

- Supabase project URL
- Supabase anon key
- Supabase service role key, only for secure server-side operations if needed
- AI provider API key

The first public deployment should include a clear beta label and health disclaimer.

## First-Version Success Criteria

- A new user can sign up, complete onboarding, and see a generated weekly meal plan.
- A returning user can log in and see their existing plan.
- A user can submit a daily check-in.
- A check-in can trigger a meal adjustment or regeneration.
- A user can view exercise, lifestyle, nutrition, and safe general medicine guidance.
- The app is deployed to a public URL.
