# Health Management App

Next.js web app for sign-up, onboarding, daily health check-ins, meal-plan generation, dashboard summaries, and guidance backed by Supabase.

## Requirements

- Node.js 20+
- npm 10+
- A Supabase project

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
   AI_PROVIDER_API_KEY=
   ```

   Optional AI overrides:

   ```env
   AI_PROVIDER_BASE_URL=https://api.openai.com/v1/chat/completions
   AI_PROVIDER_MODEL=gpt-4o-mini
   ```

   Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for the browser and server clients.
- `SUPABASE_SERVICE_ROLE_KEY` should stay server-side only.
- `AI_PROVIDER_API_KEY` is optional for local development. When omitted, meal-plan generation falls back to a deterministic mock plan. Set it in production if you want live AI responses.

## Supabase setup

1. Create a new Supabase project.
2. In **Project Settings > API**, copy:
   - Project URL
   - `anon` public key
   - service role key
3. Enable email auth in **Authentication > Providers** if you want to test the signup flow.

## Run the database migration

Apply [`supabase/migrations/0001_initial_schema.sql`](/C:/Users/SeongMin/Documents/건강관리앱/.worktrees/health-webapp-implementation/supabase/migrations/0001_initial_schema.sql) with one of these options:

- Supabase CLI:

  ```bash
  supabase db push
  ```

- Supabase SQL Editor:
  Paste the migration file into the SQL editor and run it once for the target project.

The migration creates:

- `profiles`
- `daily_checkins`
- `meal_plans`
- `meal_plan_days`
- `guidance_items`

It also enables RLS and adds user-scoped policies for each table.

## Start the dev server

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Test commands

- Unit tests:

  ```bash
  npm run test
  ```

- Production build:

  ```bash
  npm run build
  ```

- End-to-end tests:

  ```bash
  npm run test:e2e
  ```

The Playwright config starts the app with `npm run dev` and runs specs from `tests/e2e`.

## Deploy to Vercel

1. Import the repo into Vercel.
2. Keep the default **Next.js** framework preset.
3. Add these environment variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_PROVIDER_API_KEY` for live AI meal-plan generation
   - Optional: `AI_PROVIDER_BASE_URL`, `AI_PROVIDER_MODEL`
4. Redeploy after setting env vars.
5. In Supabase, add the deployed Vercel URL to:
   - **Authentication > URL Configuration > Site URL**
   - **Authentication > URL Configuration > Redirect URLs**

## Deployment notes

- Do not commit secrets to the repo or `vercel.json`.
- The checked-in [`vercel.json`](/C:/Users/SeongMin/Documents/건강관리앱/.worktrees/health-webapp-implementation/vercel.json) only declares the Next.js framework.
- Some older screens still contain garbled legacy copy outside the signup/onboarding flow; treat that as follow-up polish, not deployment config.
